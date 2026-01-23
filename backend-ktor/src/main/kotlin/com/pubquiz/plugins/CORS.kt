package com.pubquiz.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCORS() {
    val logger = log  // Get logger from Application context
    
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Delete)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        
        // Configure allowed hosts based on environment
        val allowedHosts = System.getenv("ALLOWED_HOSTS")?.split(",")?.map { it.trim() }
        
        if (allowedHosts != null && allowedHosts.isNotEmpty()) {
            // Production: Use specific allowed hosts from environment
            allowedHosts.forEach { host ->
                allowHost(host, schemes = listOf("http", "https"))
            }
            logger.info("CORS configured with allowed hosts: ${allowedHosts.joinToString(", ")}")
        } else {
            // Development: Allow any host
            anyHost()
            logger.warn("CORS configured to allow ANY host - set ALLOWED_HOSTS environment variable for production")
        }
    }
}
