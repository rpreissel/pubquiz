package com.pubquiz.validation

import com.pubquiz.models.Question
import kotlin.random.Random

// Constants
private val QUIZ_CODE_REGEX = Regex("^[A-Z0-9]{6}$")
private const val TEAM_NAME_MIN_LENGTH = 1
private const val TEAM_NAME_MAX_LENGTH = 50
private const val QUIZ_TITLE_MIN_LENGTH = 1
private const val QUIZ_TITLE_MAX_LENGTH = 200
private const val MIN_QUESTIONS = 1
private const val MAX_QUESTIONS = 100

data class ValidationResult(
    val valid: Boolean,
    val error: String? = null
)

object Validation {
    fun validateQuizCode(code: String): Boolean {
        return code.matches(QUIZ_CODE_REGEX)
    }
    
    fun generateQuizCode(): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return (1..6)
            .map { chars[Random.nextInt(chars.length)] }
            .joinToString("")
    }
    
    fun validateTeamName(name: String?): ValidationResult {
        if (name == null || name.isEmpty()) {
            return ValidationResult(false, "Team name is required")
        }
        
        val trimmedName = name.trim()
        
        if (trimmedName.isEmpty()) {
            return ValidationResult(false, "Team name cannot be empty")
        }
        
        if (trimmedName.length > TEAM_NAME_MAX_LENGTH) {
            return ValidationResult(false, "Team name cannot exceed $TEAM_NAME_MAX_LENGTH characters")
        }
        
        return ValidationResult(true)
    }
    
    fun validateQuizTitle(title: String?): ValidationResult {
        if (title.isNullOrBlank()) {
            return ValidationResult(false, "Quiz title is required")
        }
        
        val trimmedTitle = title.trim()
        
        if (trimmedTitle.length < QUIZ_TITLE_MIN_LENGTH) {
            return ValidationResult(false, "Quiz title cannot be empty")
        }
        
        if (trimmedTitle.length > QUIZ_TITLE_MAX_LENGTH) {
            return ValidationResult(false, "Quiz title cannot exceed $QUIZ_TITLE_MAX_LENGTH characters")
        }
        
        return ValidationResult(true)
    }
    
    fun validateQuestions(questions: List<Question>?): ValidationResult {
        if (questions == null) {
            return ValidationResult(false, "Questions must be provided")
        }
        
        if (questions.size < MIN_QUESTIONS) {
            return ValidationResult(false, "At least one question is required")
        }
        
        if (questions.size > MAX_QUESTIONS) {
            return ValidationResult(false, "Cannot exceed $MAX_QUESTIONS questions")
        }
        
        questions.forEachIndexed { index, question ->
            if (question.text.isBlank()) {
                return ValidationResult(false, "Question ${index + 1}: Text cannot be empty")
            }
            
            if (question.correct.isBlank()) {
                return ValidationResult(false, "Question ${index + 1}: Correct answer cannot be empty")
            }
        }
        
        return ValidationResult(true)
    }
    
    fun validateAnswerSubmission(
        questionId: Int,
        answer: String?,
        totalQuestions: Int
    ): ValidationResult {
        if (questionId < 0) {
            return ValidationResult(false, "Invalid question ID")
        }
        
        if (questionId >= totalQuestions) {
            return ValidationResult(false, "Question not found")
        }
        
        if (answer.isNullOrBlank()) {
            return ValidationResult(false, "Answer cannot be empty")
        }
        
        return ValidationResult(true)
    }
}
