package com.pubquiz.storage

import com.pubquiz.models.*
import kotlin.test.*
import java.time.Instant
import java.util.*

class FileStorageTest {
    
    @Test
    fun `getQuizStatistics returns correct statistics`() {
        // Create a test quiz
        val quiz = Quiz(
            code = "TEST01",
            title = "Test Quiz",
            questions = listOf(
                Question(0, "Q1", "A1"),
                Question(1, "Q2", "A2"),
                Question(2, "Q3", "A3")
            ),
            status = QuizStatus.ACTIVE,
            currentQuestionIndex = 1,
            createdAt = Instant.now().toString(),
            masterToken = UUID.randomUUID().toString()
        )
        
        FileStorage.saveQuiz(quiz)
        
        // Create test teams
        val team1 = Team(
            id = "team1",
            quizCode = "TEST01",
            name = "Team 1",
            answers = listOf(
                Answer(0, "answer1", true, 1.0),
                Answer(1, "answer2", true, 1.0)
            ),
            totalScore = 2.0,
            joinedAt = Instant.now().toString(),
            sessionToken = UUID.randomUUID().toString()
        )
        
        val team2 = Team(
            id = "team2",
            quizCode = "TEST01",
            name = "Team 2",
            answers = listOf(
                Answer(0, "wrong", false, 0.0),
                Answer(1, "answer2", true, 1.0)
            ),
            totalScore = 1.0,
            joinedAt = Instant.now().toString(),
            sessionToken = UUID.randomUUID().toString()
        )
        
        FileStorage.saveTeam(team1)
        FileStorage.saveTeam(team2)
        
        // Get statistics
        val stats = FileStorage.getQuizStatistics("TEST01")
        
        assertNotNull(stats)
        assertEquals("TEST01", stats.quizCode)
        assertEquals("Test Quiz", stats.title)
        assertEquals(QuizStatus.ACTIVE, stats.status)
        assertEquals(3, stats.totalQuestions)
        assertEquals(2, stats.totalTeams)
        assertEquals(1, stats.currentQuestionIndex)
        assertEquals(1.5, stats.averageScore) // (2.0 + 1.0) / 2
        assertEquals(2.0, stats.highestScore)
        assertEquals(1.0, stats.lowestScore)
    }
    
    @Test
    fun `getQuizStatistics returns null for non-existent quiz`() {
        val stats = FileStorage.getQuizStatistics("NONEXIST")
        assertNull(stats)
    }
    
    @Test
    fun `getQuizStatistics handles quiz with no teams`() {
        val quiz = Quiz(
            code = "EMPTY1",
            title = "Empty Quiz",
            questions = listOf(Question(0, "Q1", "A1")),
            status = QuizStatus.DRAFT,
            currentQuestionIndex = 0,
            createdAt = Instant.now().toString(),
            masterToken = UUID.randomUUID().toString()
        )
        
        FileStorage.saveQuiz(quiz)
        
        val stats = FileStorage.getQuizStatistics("EMPTY1")
        
        assertNotNull(stats)
        assertEquals(0, stats.totalTeams)
        assertEquals(0.0, stats.averageScore)
        assertEquals(0.0, stats.highestScore)
        assertEquals(0.0, stats.lowestScore)
    }
}
