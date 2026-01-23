package com.pubquiz.storage

import com.pubquiz.models.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.*

object FileStorage {
    private val logger = LoggerFactory.getLogger(FileStorage::class.java)
    private val dataDir = Path("data")
    private val quizzesDir = dataDir.resolve("quizzes")
    private val teamsDir = dataDir.resolve("teams")
    
    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
    }
    
    // Ensure data directories exist
    fun ensureDataDirectories() {
        try {
            Files.createDirectories(quizzesDir)
            Files.createDirectories(teamsDir)
            logger.info("Data directories initialized: $dataDir")
        } catch (e: Exception) {
            logger.error("Failed to create data directories: ${e.message}", e)
            throw e
        }
    }
    
    // Quiz operations
    fun saveQuiz(quiz: Quiz) {
        try {
            val filePath = quizzesDir.resolve("${quiz.code}.json")
            val jsonString = json.encodeToString(quiz)
            AtomicFileWriter.writeAtomic(filePath, jsonString)
            logger.debug("Quiz ${quiz.code} saved successfully (atomic write)")
        } catch (e: Exception) {
            logger.error("Failed to save quiz ${quiz.code}: ${e.message}", e)
            throw e
        }
    }
    
    fun loadQuiz(code: String): Quiz? {
        return try {
            val filePath = quizzesDir.resolve("$code.json")
            if (!filePath.exists()) {
                return null
            }
            AtomicFileWriter.readWithLock(filePath) { content ->
                json.decodeFromString<Quiz>(content)
            }
        } catch (e: Exception) {
            logger.error("Failed to load quiz $code: ${e.message}", e)
            throw e
        }
    }
    
    fun getAllQuizzes(): List<Quiz> {
        return try {
            if (!quizzesDir.exists()) {
                return emptyList()
            }
            
            Files.list(quizzesDir)
                .filter { it.fileName.toString().endsWith(".json") }
                .map { path ->
                    val jsonString = path.readText(Charsets.UTF_8)
                    json.decodeFromString<Quiz>(jsonString)
                }
                .toList()
                .sortedByDescending { it.createdAt }
        } catch (e: Exception) {
            logger.error("Failed to load all quizzes: ${e.message}", e)
            throw e
        }
    }
    
    fun updateQuizStatus(code: String, status: QuizStatus) {
        try {
            val quiz = loadQuiz(code) ?: throw IllegalArgumentException("Quiz $code not found")
            val updatedQuiz = quiz.copy(status = status)
            saveQuiz(updatedQuiz)
            logger.info("Quiz $code status updated to $status")
        } catch (e: Exception) {
            logger.error("Failed to update quiz $code status: ${e.message}", e)
            throw e
        }
    }
    
    fun quizExists(code: String): Boolean {
        return quizzesDir.resolve("$code.json").exists()
    }
    
    fun updateCurrentQuestion(code: String, questionIndex: Int) {
        try {
            val quiz = loadQuiz(code) ?: throw IllegalArgumentException("Quiz $code not found")
            val updatedQuiz = quiz.copy(currentQuestionIndex = questionIndex)
            saveQuiz(updatedQuiz)
            logger.info("Quiz $code current question updated to index $questionIndex")
        } catch (e: Exception) {
            logger.error("Failed to update current question for quiz $code: ${e.message}", e)
            throw e
        }
    }
    
    // Team operations
    fun saveTeam(team: Team) {
        try {
            val quizTeamsDir = teamsDir.resolve(team.quizCode)
            Files.createDirectories(quizTeamsDir)
            
            val filePath = quizTeamsDir.resolve("${team.id}.json")
            val jsonString = json.encodeToString(team)
            AtomicFileWriter.writeAtomic(filePath, jsonString)
            logger.debug("Team ${team.id} saved successfully for quiz ${team.quizCode} (atomic write)")
        } catch (e: Exception) {
            logger.error("Failed to save team ${team.id}: ${e.message}", e)
            throw e
        }
    }
    
    fun loadTeam(teamId: String, quizCode: String): Team? {
        return try {
            val filePath = teamsDir.resolve(quizCode).resolve("$teamId.json")
            if (!filePath.exists()) {
                return null
            }
            AtomicFileWriter.readWithLock(filePath) { content ->
                json.decodeFromString<Team>(content)
            }
        } catch (e: Exception) {
            logger.error("Failed to load team $teamId: ${e.message}", e)
            throw e
        }
    }
    
    fun getTeamsByQuizCode(quizCode: String): List<Team> {
        return try {
            val quizTeamsDir = teamsDir.resolve(quizCode)
            
            if (!quizTeamsDir.exists()) {
                return emptyList()
            }
            
            Files.list(quizTeamsDir)
                .filter { it.fileName.toString().endsWith(".json") }
                .map { path ->
                    val jsonString = path.readText(Charsets.UTF_8)
                    json.decodeFromString<Team>(jsonString)
                }
                .toList()
                .sortedBy { it.joinedAt }
        } catch (e: Exception) {
            logger.error("Failed to load teams for quiz $quizCode: ${e.message}", e)
            throw e
        }
    }
    
    fun updateTeamAnswer(teamId: String, quizCode: String, answer: Answer) {
        try {
            val team = loadTeam(teamId, quizCode) 
                ?: throw IllegalArgumentException("Team $teamId not found")
            
            val existingAnswerIndex = team.answers.indexOfFirst { it.questionId == answer.questionId }
            
            val updatedAnswers = if (existingAnswerIndex >= 0) {
                team.answers.toMutableList().apply {
                    set(existingAnswerIndex, answer)
                }
            } else {
                team.answers + answer
            }
            
            // Recalculate total score
            val totalScore = updatedAnswers.sumOf { it.score }
            
            val updatedTeam = team.copy(
                answers = updatedAnswers,
                totalScore = totalScore
            )
            
            saveTeam(updatedTeam)
            logger.debug("Team $teamId answer updated for question ${answer.questionId}")
        } catch (e: Exception) {
            logger.error("Failed to update team $teamId answer: ${e.message}", e)
            throw e
        }
    }
    
    fun updateAnswerScore(
        teamId: String,
        quizCode: String,
        questionId: Int,
        score: Double
    ): Team {
        try {
            val team = loadTeam(teamId, quizCode)
                ?: throw IllegalArgumentException("Team $teamId not found")
            
            val answerIndex = team.answers.indexOfFirst { it.questionId == questionId }
            if (answerIndex < 0) {
                throw IllegalArgumentException("Answer for question $questionId not found")
            }
            
            val updatedAnswers = team.answers.toMutableList().apply {
                set(answerIndex, get(answerIndex).copy(
                    score = score,
                    isCorrect = score == 1.0
                ))
            }
            
            // Recalculate total score
            val totalScore = updatedAnswers.sumOf { it.score }
            
            val updatedTeam = team.copy(
                answers = updatedAnswers,
                totalScore = totalScore
            )
            
            saveTeam(updatedTeam)
            logger.info("Answer score updated for team $teamId, question $questionId: $score")
            return updatedTeam
        } catch (e: Exception) {
            logger.error("Failed to update answer score for team $teamId: ${e.message}", e)
            throw e
        }
    }
    
    fun teamExists(teamId: String, quizCode: String): Boolean {
        return teamsDir.resolve(quizCode).resolve("$teamId.json").exists()
    }
    
    // Token-based lookup functions
    fun findQuizByMasterToken(masterToken: String): Quiz? {
        return try {
            val quizzes = getAllQuizzes()
            quizzes.find { it.masterToken == masterToken }
        } catch (e: Exception) {
            logger.error("Failed to find quiz by master token: ${e.message}", e)
            null
        }
    }
    
    fun findTeamBySessionToken(sessionToken: String): Team? {
        return try {
            val quizzes = getAllQuizzes()
            
            for (quiz in quizzes) {
                val teams = getTeamsByQuizCode(quiz.code)
                val team = teams.find { it.sessionToken == sessionToken }
                if (team != null) {
                    return team
                }
            }
            
            null
        } catch (e: Exception) {
            logger.error("Failed to find team by session token: ${e.message}", e)
            null
        }
    }
    
    // Statistics and helper functions
    fun getQuizStatistics(code: String): QuizStatistics? {
        return try {
            val quiz = loadQuiz(code) ?: return null
            val teams = getTeamsByQuizCode(code)
            
            QuizStatistics(
                quizCode = quiz.code,
                title = quiz.title,
                status = quiz.status,
                totalQuestions = quiz.questions.size,
                totalTeams = teams.size,
                currentQuestionIndex = quiz.currentQuestionIndex,
                averageScore = if (teams.isNotEmpty()) {
                    teams.map { it.totalScore }.average()
                } else {
                    0.0
                },
                highestScore = teams.maxOfOrNull { it.totalScore } ?: 0.0,
                lowestScore = teams.minOfOrNull { it.totalScore } ?: 0.0
            )
        } catch (e: Exception) {
            logger.error("Failed to get quiz statistics for $code: ${e.message}", e)
            null
        }
    }
}
