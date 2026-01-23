package com.pubquiz.demo

import com.pubquiz.models.Quiz
import com.pubquiz.models.QuizStatus
import com.pubquiz.storage.FileStorage

// Demo: LSP Type-Checking in Aktion
fun demonstrateLSP() {
    // Dieser Code zeigt, wie der LSP Type-Fehler erkennt
    
    // ✅ Korrekt: Quiz-Code ist ein String
    val quiz = FileStorage.loadQuiz("ABC123")
    
    // ❌ Type-Fehler: loadQuiz erwartet String, nicht Int
    // val wrongQuiz = FileStorage.loadQuiz(123)  // <- LSP würde das als Fehler markieren
    
    // ✅ Korrekt: Null-Safety
    if (quiz != null) {
        println("Quiz title: ${quiz.title}")
        
        // ✅ LSP kennt alle Properties von Quiz
        println("Status: ${quiz.status}")
        println("Questions: ${quiz.questions.size}")
        
        // ❌ Type-Fehler: Property existiert nicht
        // println("Invalid: ${quiz.invalidProperty}")  // <- LSP würde das als Fehler markieren
    }
    
    // ✅ LSP erkennt Enum-Werte
    val isActive = quiz?.status == QuizStatus.ACTIVE
    
    // ❌ Type-Fehler: Ungültiger Enum-Wert
    // val wrongStatus = quiz?.status == QuizStatus.INVALID  // <- LSP würde das als Fehler markieren
    
    // ✅ LSP unterstützt Smart-Casts
    val statistics = FileStorage.getQuizStatistics("ABC123")
    if (statistics != null) {
        // Nach dem null-check weiß LSP, dass statistics nicht null ist
        val avg = statistics.averageScore  // Kein "?." nötig
        println("Average score: $avg")
    }
}
