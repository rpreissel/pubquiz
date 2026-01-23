package com.pubquiz.routes

import com.pubquiz.models.*
import com.pubquiz.storage.FileStorage
import com.pubquiz.validation.Validation
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.Instant
import java.util.*

fun Route.teamRoutes() {
    route("/team") {
        // POST /api/team/join - Team joins a quiz
        post("/join") {
            val request = call.receive<JoinTeamRequest>()
            
            // Validate team name
            val nameValidation = Validation.validateTeamName(request.teamName)
            if (!nameValidation.valid) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", nameValidation.error!!)
                )
                return@post
            }
            
            // Check if quiz exists
            val quiz = FileStorage.loadQuiz(request.quizCode)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Check if quiz is active
            if (quiz.status != QuizStatus.ACTIVE) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Invalid State", "Quiz is not active")
                )
                return@post
            }
            
            // Check if team name already exists in this quiz (case-insensitive)
            val existingTeams = FileStorage.getTeamsByQuizCode(request.quizCode)
            val trimmedName = request.teamName.trim()
            val nameExists = existingTeams.any { 
                it.name.lowercase() == trimmedName.lowercase() 
            }
            
            if (nameExists) {
                call.respond(
                    HttpStatusCode.Conflict,
                    ErrorResponse("Conflict", "Team name already exists in this quiz")
                )
                return@post
            }
            
            // Create team
            val team = Team(
                id = UUID.randomUUID().toString(),
                quizCode = request.quizCode,
                name = trimmedName,
                answers = emptyList(),
                totalScore = 0.0,
                joinedAt = Instant.now().toString(),
                sessionToken = UUID.randomUUID().toString()
            )
            
            FileStorage.saveTeam(team)
            
            call.respond(HttpStatusCode.Created, JoinTeamResponse(team))
        }
        
        // POST /api/team/:teamId/answer - Submit answer
        post("/{teamId}/answer") {
            val teamId = call.parameters["teamId"]
                ?: throw IllegalArgumentException("Missing team ID")
            val request = call.receive<SubmitAnswerRequest>()
            
            val quizCode = request.quizCode
                ?: throw IllegalArgumentException("quiz_code is required")
            
            if (request.answer.isBlank()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Answer cannot be empty")
                )
                return@post
            }
            
            // Verify team exists
            FileStorage.loadTeam(teamId, quizCode)
                ?: throw NoSuchElementException("Team not found")
            
            // Load quiz
            val quiz = FileStorage.loadQuiz(quizCode)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Check if quiz is active
            if (quiz.status != QuizStatus.ACTIVE) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Invalid State", "Quiz is not active")
                )
                return@post
            }
            
            // Find question
            val question = quiz.questions.find { it.id == request.questionId }
                ?: throw NoSuchElementException("Question not found")
            
            // Check if answer is correct (case-insensitive comparison)
            val isCorrect = question.correct.lowercase().trim() == request.answer.lowercase().trim()
            
            // Create answer object
            val answer = Answer(
                questionId = request.questionId,
                answer = request.answer.trim(),
                isCorrect = isCorrect,
                score = if (isCorrect) 1.0 else 0.0
            )
            
            // Update team answer
            FileStorage.updateTeamAnswer(teamId, quizCode, answer)
            
            // Load updated team to get new total score
            val updatedTeam = FileStorage.loadTeam(teamId, quizCode)
            
            call.respond(
                SubmitAnswerResponse(
                    answer = answer,
                    totalScore = updatedTeam?.totalScore ?: 0.0
                )
            )
        }
        
        // GET /api/team/:teamId - Get team information
        get("/{teamId}") {
            val teamId = call.parameters["teamId"]
                ?: throw IllegalArgumentException("Missing team ID")
            val quizCode = call.request.queryParameters["quiz_code"]
                ?: throw IllegalArgumentException("quiz_code query parameter is required")
            
            val team = FileStorage.loadTeam(teamId, quizCode)
                ?: throw NoSuchElementException("Team not found")
            
            call.respond(GetTeamResponse(team))
        }
        
        // PATCH /api/team/:teamId/score - Update answer score (for quiz master)
        patch("/{teamId}/score") {
            val teamId = call.parameters["teamId"]
                ?: throw IllegalArgumentException("Missing team ID")
            val request = call.receive<UpdateAnswerScoreRequest>()
            
            // Validate score value
            if (request.score != 0.0 && request.score != 0.5 && request.score != 1.0) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Score must be 0, 0.5, or 1")
                )
                return@patch
            }
            
            // Update the answer score
            val updatedTeam = FileStorage.updateAnswerScore(
                teamId,
                request.quizCode,
                request.questionId,
                request.score
            )
            
            call.respond(
                mapOf(
                    "team" to updatedTeam,
                    "message" to "Score updated successfully"
                )
            )
        }
        
        // ==================== TOKEN-BASED ENDPOINTS ====================
        
        // GET /api/team/session/:sessionToken - Get team and quiz by session token (secure)
        get("/session/{sessionToken}") {
            val sessionToken = call.parameters["sessionToken"]
                ?: throw IllegalArgumentException("Missing session token")
            
            val team = FileStorage.findTeamBySessionToken(sessionToken)
                ?: throw NoSuchElementException("Team not found")
            
            // Load the quiz (without correct answers)
            val quiz = FileStorage.loadQuiz(team.quizCode)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Remove correct answers from questions for team view
            val questionsWithoutAnswers = quiz.questions.map { question ->
                QuestionWithoutAnswer(id = question.id, text = question.text)
            }
            
            call.respond(
                GetTeamBySessionResponse(
                    team = team,
                    quiz = QuizWithoutAnswers(
                        code = quiz.code,
                        title = quiz.title,
                        questions = questionsWithoutAnswers,
                        status = quiz.status,
                        currentQuestionIndex = quiz.currentQuestionIndex,
                        createdAt = quiz.createdAt
                    )
                )
            )
        }
        
        // POST /api/team/session/:sessionToken/answer - Submit answer by session token
        post("/session/{sessionToken}/answer") {
            val sessionToken = call.parameters["sessionToken"]
                ?: throw IllegalArgumentException("Missing session token")
            val request = call.receive<SubmitAnswerRequest>()
            
            if (request.answer.isBlank()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Answer cannot be empty")
                )
                return@post
            }
            
            val team = FileStorage.findTeamBySessionToken(sessionToken)
                ?: throw NoSuchElementException("Team not found")
            
            // Load quiz
            val quiz = FileStorage.loadQuiz(team.quizCode)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Check if quiz is active
            if (quiz.status != QuizStatus.ACTIVE) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Invalid State", "Quiz is not active")
                )
                return@post
            }
            
            // Find question
            val question = quiz.questions.find { it.id == request.questionId }
                ?: throw NoSuchElementException("Question not found")
            
            // Check if answer is correct (case-insensitive comparison)
            val isCorrect = question.correct.lowercase().trim() == request.answer.lowercase().trim()
            
            // Create answer object
            val answer = Answer(
                questionId = request.questionId,
                answer = request.answer.trim(),
                isCorrect = isCorrect,
                score = if (isCorrect) 1.0 else 0.0
            )
            
            // Update team answer
            FileStorage.updateTeamAnswer(team.id, team.quizCode, answer)
            
            // Load updated team to get new total score
            val updatedTeam = FileStorage.loadTeam(team.id, team.quizCode)
            
            call.respond(
                SubmitAnswerResponse(
                    answer = answer,
                    totalScore = updatedTeam?.totalScore ?: 0.0
                )
            )
        }
    }
}
