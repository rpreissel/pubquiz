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

fun Route.quizRoutes() {
    route("/quiz") {
        // POST /api/quiz/create - Create new quiz
        post("/create") {
            val request = call.receive<CreateQuizRequest>()
            
            // Validate title
            val titleValidation = Validation.validateQuizTitle(request.title)
            if (!titleValidation.valid) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", titleValidation.error!!)
                )
                return@post
            }
            
            // Validate questions
            val questionsValidation = Validation.validateQuestions(request.questions)
            if (!questionsValidation.valid) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", questionsValidation.error!!)
                )
                return@post
            }
            
            // Generate unique quiz code
            var code = Validation.generateQuizCode()
            while (FileStorage.quizExists(code)) {
                code = Validation.generateQuizCode()
            }
            
            // Assign IDs to questions
            val questionsWithIds = request.questions.mapIndexed { index, question ->
                question.copy(id = index)
            }
            
            // Create quiz object
            val quiz = Quiz(
                code = code,
                title = request.title.trim(),
                questions = questionsWithIds,
                status = QuizStatus.DRAFT,
                currentQuestionIndex = 0,
                createdAt = Instant.now().toString(),
                masterToken = UUID.randomUUID().toString()
            )
            
            FileStorage.saveQuiz(quiz)
            
            call.respond(HttpStatusCode.Created, CreateQuizResponse(quiz))
        }
        
        // GET /api/quiz/:code - Get quiz (without correct answers for teams)
        get("/{code}") {
            val code = call.parameters["code"] ?: throw IllegalArgumentException("Missing quiz code")
            
            if (!Validation.validateQuizCode(code)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid quiz code format")
                )
                return@get
            }
            
            val quiz = FileStorage.loadQuiz(code)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Remove correct answers from questions for team view
            val questionsWithoutAnswers = quiz.questions.map { question ->
                QuestionWithoutAnswer(id = question.id, text = question.text)
            }
            
            call.respond(
                GetQuizResponse(
                    QuizWithoutAnswers(
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
        
        // GET /api/quiz/:code/master - Get quiz with correct answers (for quiz master)
        get("/{code}/master") {
            val code = call.parameters["code"] ?: throw IllegalArgumentException("Missing quiz code")
            
            if (!Validation.validateQuizCode(code)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid quiz code format")
                )
                return@get
            }
            
            val quiz = FileStorage.loadQuiz(code)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Get all teams and their answer status for the current question
            val allTeams = FileStorage.getTeamsByQuizCode(code)
            val currentQuestionId = quiz.currentQuestionIndex
            
            val teams = allTeams.map { team ->
                TeamAnswerStatus(
                    id = team.id,
                    name = team.name,
                    hasAnswered = team.answers.any { it.questionId == currentQuestionId }
                )
            }
            
            call.respond(GetQuizMasterResponse(quiz, teams))
        }
        
        // GET /api/quiz/:code/results - Get quiz results with team rankings
        get("/{code}/results") {
            val code = call.parameters["code"] ?: throw IllegalArgumentException("Missing quiz code")
            
            if (!Validation.validateQuizCode(code)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid quiz code format")
                )
                return@get
            }
            
            val quiz = FileStorage.loadQuiz(code)
                ?: throw NoSuchElementException("Quiz not found")
            
            val teams = FileStorage.getTeamsByQuizCode(code)
            
            // Sort teams by score (descending)
            val sortedTeams = teams.map { team ->
                TeamResult(
                    id = team.id,
                    name = team.name,
                    totalScore = team.totalScore,
                    answers = team.answers
                )
            }.sortedByDescending { it.totalScore }
            
            call.respond(QuizResultsResponse(quiz, sortedTeams))
        }
        
        // PATCH /api/quiz/:code/status - Update quiz status
        patch("/{code}/status") {
            val code = call.parameters["code"] ?: throw IllegalArgumentException("Missing quiz code")
            val request = call.receive<UpdateQuizStatusRequest>()
            
            if (!Validation.validateQuizCode(code)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid quiz code format")
                )
                return@patch
            }
            
            val quiz = FileStorage.loadQuiz(code)
                ?: throw NoSuchElementException("Quiz not found")
            
            FileStorage.updateQuizStatus(code, request.status)
            
            call.respond(
                mapOf(
                    "message" to "Quiz status updated successfully",
                    "status" to request.status
                )
            )
        }
        
        // PATCH /api/quiz/:code/question - Update current question index
        patch("/{code}/question") {
            val code = call.parameters["code"] ?: throw IllegalArgumentException("Missing quiz code")
            val body = call.receive<Map<String, Int>>()
            val questionIndex = body["questionIndex"] ?: throw IllegalArgumentException("Missing questionIndex")
            
            if (!Validation.validateQuizCode(code)) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid quiz code format")
                )
                return@patch
            }
            
            if (questionIndex < 0) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid question index")
                )
                return@patch
            }
            
            val quiz = FileStorage.loadQuiz(code)
                ?: throw NoSuchElementException("Quiz not found")
            
            if (questionIndex >= quiz.questions.size) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Question index out of range")
                )
                return@patch
            }
            
            FileStorage.updateCurrentQuestion(code, questionIndex)
            
            call.respond(
                mapOf(
                    "message" to "Current question updated successfully",
                    "questionIndex" to questionIndex
                )
            )
        }
        
        // GET /api/quiz - Get all quizzes (for listing)
        get {
            val quizzes = FileStorage.getAllQuizzes()
            
            call.respond(
                mapOf(
                    "quizzes" to quizzes.map { quiz ->
                        mapOf(
                            "code" to quiz.code,
                            "title" to quiz.title,
                            "status" to quiz.status,
                            "created_at" to quiz.createdAt,
                            "question_count" to quiz.questions.size
                        )
                    }
                )
            )
        }
        
        // ==================== TOKEN-BASED ENDPOINTS ====================
        
        // GET /api/quiz/master/:masterToken - Get quiz by master token (secure)
        get("/master/{masterToken}") {
            val masterToken = call.parameters["masterToken"]
                ?: throw IllegalArgumentException("Missing master token")
            
            val quiz = FileStorage.findQuizByMasterToken(masterToken)
                ?: throw NoSuchElementException("Quiz not found")
            
            // Get all teams and their answer status for the current question
            val allTeams = FileStorage.getTeamsByQuizCode(quiz.code)
            val currentQuestionId = quiz.currentQuestionIndex
            
            val teams = allTeams.map { team ->
                TeamAnswerStatus(
                    id = team.id,
                    name = team.name,
                    hasAnswered = team.answers.any { it.questionId == currentQuestionId }
                )
            }
            
            call.respond(GetQuizMasterResponse(quiz, teams))
        }
        
        // PATCH /api/quiz/master/:masterToken/status - Update quiz status by master token
        patch("/master/{masterToken}/status") {
            val masterToken = call.parameters["masterToken"]
                ?: throw IllegalArgumentException("Missing master token")
            val request = call.receive<UpdateQuizStatusRequest>()
            
            val quiz = FileStorage.findQuizByMasterToken(masterToken)
                ?: throw NoSuchElementException("Quiz not found")
            
            FileStorage.updateQuizStatus(quiz.code, request.status)
            
            call.respond(
                mapOf(
                    "message" to "Quiz status updated successfully",
                    "status" to request.status
                )
            )
        }
        
        // PATCH /api/quiz/master/:masterToken/question - Update current question by master token
        patch("/master/{masterToken}/question") {
            val masterToken = call.parameters["masterToken"]
                ?: throw IllegalArgumentException("Missing master token")
            val body = call.receive<Map<String, Int>>()
            val questionIndex = body["questionIndex"]
                ?: throw IllegalArgumentException("Missing questionIndex")
            
            val quiz = FileStorage.findQuizByMasterToken(masterToken)
                ?: throw NoSuchElementException("Quiz not found")
            
            if (questionIndex < 0) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Invalid question index")
                )
                return@patch
            }
            
            if (questionIndex >= quiz.questions.size) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse("Validation Error", "Question index out of range")
                )
                return@patch
            }
            
            FileStorage.updateCurrentQuestion(quiz.code, questionIndex)
            
            call.respond(
                mapOf(
                    "message" to "Current question updated successfully",
                    "questionIndex" to questionIndex
                )
            )
        }
        
        // GET /api/quiz/master/:masterToken/results - Get quiz results by master token
        get("/master/{masterToken}/results") {
            val masterToken = call.parameters["masterToken"]
                ?: throw IllegalArgumentException("Missing master token")
            
            val quiz = FileStorage.findQuizByMasterToken(masterToken)
                ?: throw NoSuchElementException("Quiz not found")
            
            val teams = FileStorage.getTeamsByQuizCode(quiz.code)
            
            // Sort teams by score (descending)
            val sortedTeams = teams.map { team ->
                TeamResult(
                    id = team.id,
                    name = team.name,
                    totalScore = team.totalScore,
                    answers = team.answers
                )
            }.sortedByDescending { it.totalScore }
            
            call.respond(QuizResultsResponse(quiz, sortedTeams))
        }
    }
}
