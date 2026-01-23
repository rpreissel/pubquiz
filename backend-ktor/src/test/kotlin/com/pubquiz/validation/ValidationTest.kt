package com.pubquiz.validation

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ValidationTest {
    
    @Test
    fun `validateQuizCode accepts valid codes`() {
        assertTrue(Validation.validateQuizCode("ABC123"))
        assertTrue(Validation.validateQuizCode("QUIZ99"))
        assertTrue(Validation.validateQuizCode("000000"))
        assertTrue(Validation.validateQuizCode("ZZZZZZ"))
    }
    
    @Test
    fun `validateQuizCode rejects invalid codes`() {
        assertFalse(Validation.validateQuizCode("abc123")) // lowercase
        assertFalse(Validation.validateQuizCode("ABC12"))  // too short
        assertFalse(Validation.validateQuizCode("ABC1234")) // too long
        assertFalse(Validation.validateQuizCode("ABC-123")) // special char
        assertFalse(Validation.validateQuizCode(""))
    }
    
    @Test
    fun `generateQuizCode creates valid codes`() {
        repeat(100) {
            val code = Validation.generateQuizCode()
            assertTrue(Validation.validateQuizCode(code), "Generated code '$code' should be valid")
            assertEquals(6, code.length)
        }
    }
    
    @Test
    fun `validateTeamName accepts valid names`() {
        val result1 = Validation.validateTeamName("Team A")
        assertTrue(result1.valid)
        
        val result2 = Validation.validateTeamName("The Amazing Quiz Masters")
        assertTrue(result2.valid)
        
        val result3 = Validation.validateTeamName("T")
        assertTrue(result3.valid)
    }
    
    @Test
    fun `validateTeamName rejects empty or blank names`() {
        val result1 = Validation.validateTeamName("")
        assertFalse(result1.valid)
        assertEquals("Team name is required", result1.error)
        
        val result2 = Validation.validateTeamName("   ")
        assertFalse(result2.valid)
        assertEquals("Team name cannot be empty", result2.error)
        
        val result3 = Validation.validateTeamName(null)
        assertFalse(result3.valid)
    }
    
    @Test
    fun `validateTeamName rejects names that are too long`() {
        val longName = "a".repeat(51)
        val result = Validation.validateTeamName(longName)
        assertFalse(result.valid)
        assertTrue(result.error?.contains("cannot exceed") == true)
    }
    
    @Test
    fun `validateQuizTitle accepts valid titles`() {
        val result1 = Validation.validateQuizTitle("General Knowledge Quiz")
        assertTrue(result1.valid)
        
        val result2 = Validation.validateQuizTitle("Q")
        assertTrue(result2.valid)
    }
    
    @Test
    fun `validateQuizTitle rejects invalid titles`() {
        val result1 = Validation.validateQuizTitle("")
        assertFalse(result1.valid)
        
        val result2 = Validation.validateQuizTitle("   ")
        assertFalse(result2.valid)
        
        val result3 = Validation.validateQuizTitle("a".repeat(201))
        assertFalse(result3.valid)
    }
}
