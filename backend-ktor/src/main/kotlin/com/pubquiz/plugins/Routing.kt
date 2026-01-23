package com.pubquiz.plugins

import com.pubquiz.routes.quizRoutes
import com.pubquiz.routes.teamRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.http.content.*
import java.io.File

fun Application.configureRouting() {
    routing {
        // Health check
        get("/api/health") {
            call.respond(mapOf("status" to "ok"))
        }
        
        route("/api") {
            quizRoutes()
            teamRoutes()
        }
        
        // Serve static files in production
        val distDir = File("../dist")
        if (distDir.exists()) {
            staticFiles("/", distDir)
            
            // SPA fallback for client-side routing
            get("{...}") {
                val indexFile = distDir.resolve("index.html")
                if (indexFile.exists()) {
                    call.respondFile(indexFile)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }
        }
    }
}
