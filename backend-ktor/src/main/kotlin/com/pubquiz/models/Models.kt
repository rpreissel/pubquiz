package com.pubquiz.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Question(
    val id: Int,
    val text: String,
    val correct: String
)

@Serializable
enum class QuizStatus {
    @SerialName("draft")
    DRAFT,
    
    @SerialName("active")
    ACTIVE,
    
    @SerialName("finished")
    FINISHED
}

@Serializable
data class Quiz(
    val code: String,
    val title: String,
    val questions: List<Question>,
    val status: QuizStatus,
    @SerialName("current_question_index") val currentQuestionIndex: Int,
    @SerialName("created_at") val createdAt: String,
    @SerialName("master_token") val masterToken: String
)

@Serializable
data class Answer(
    @SerialName("question_id") val questionId: Int,
    val answer: String,
    @SerialName("is_correct") val isCorrect: Boolean,
    val score: Double
)

@Serializable
data class Team(
    val id: String,
    @SerialName("quiz_code") val quizCode: String,
    val name: String,
    val answers: List<Answer>,
    @SerialName("total_score") val totalScore: Double,
    @SerialName("joined_at") val joinedAt: String,
    @SerialName("session_token") val sessionToken: String
)

@Serializable
data class TeamAnswerStatus(
    val id: String,
    val name: String,
    val hasAnswered: Boolean
)

// Request DTOs
@Serializable
data class CreateQuizRequest(
    val title: String,
    val questions: List<Question>
)

@Serializable
data class UpdateQuizStatusRequest(
    val status: QuizStatus
)

@Serializable
data class JoinTeamRequest(
    @SerialName("quiz_code") val quizCode: String,
    @SerialName("team_name") val teamName: String
)

@Serializable
data class SubmitAnswerRequest(
    @SerialName("question_id") val questionId: Int,
    val answer: String,
    @SerialName("quiz_code") val quizCode: String? = null
)

@Serializable
data class UpdateAnswerScoreRequest(
    @SerialName("quiz_code") val quizCode: String,
    @SerialName("question_id") val questionId: Int,
    val score: Double
)

// Response DTOs
@Serializable
data class CreateQuizResponse(
    val quiz: Quiz
)

@Serializable
data class QuestionWithoutAnswer(
    val id: Int,
    val text: String
)

@Serializable
data class QuizWithoutAnswers(
    val code: String,
    val title: String,
    val questions: List<QuestionWithoutAnswer>,
    val status: QuizStatus,
    @SerialName("current_question_index") val currentQuestionIndex: Int,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class GetQuizResponse(
    val quiz: QuizWithoutAnswers
)

@Serializable
data class GetQuizMasterResponse(
    val quiz: Quiz,
    val teams: List<TeamAnswerStatus>
)

@Serializable
data class JoinTeamResponse(
    val team: Team
)

@Serializable
data class SubmitAnswerResponse(
    val answer: Answer,
    @SerialName("total_score") val totalScore: Double
)

@Serializable
data class GetTeamResponse(
    val team: Team
)

@Serializable
data class TeamResult(
    val id: String,
    val name: String,
    @SerialName("total_score") val totalScore: Double,
    val answers: List<Answer>
)

@Serializable
data class QuizResultsResponse(
    val quiz: Quiz,
    val teams: List<TeamResult>
)

@Serializable
data class ErrorResponse(
    val error: String,
    val message: String
)

@Serializable
data class GetTeamBySessionResponse(
    val team: Team,
    val quiz: QuizWithoutAnswers
)
