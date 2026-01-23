package com.pubquiz.plugins

import com.pubquiz.models.ErrorResponse
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*

fun Application.configureStatusPages() {
    val app = this
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse(
                    error = "Bad Request",
                    message = cause.message ?: "Invalid request"
                )
            )
        }
        
        exception<NoSuchElementException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(
                    error = "Not Found",
                    message = cause.message ?: "Resource not found"
                )
            )
        }
        
        exception<Throwable> { call, cause ->
            app.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    error = "Internal Server Error",
                    message = "An unexpected error occurred"
                )
            )
        }
        
        status(HttpStatusCode.NotFound) { call, _ ->
            if (call.request.local.uri.startsWith("/api/")) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(
                        error = "Not Found",
                        message = "API endpoint not found"
                    )
                )
            }
        }
    }
}
