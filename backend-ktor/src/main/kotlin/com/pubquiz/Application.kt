package com.pubquiz

import com.pubquiz.plugins.*
import com.pubquiz.storage.FileStorage
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

fun main() {
    // Ensure data directories exist
    FileStorage.ensureDataDirectories()
    
    embeddedServer(Netty, port = 3000, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    configureSerialization()
    configureCORS()
    configureStatusPages()
    configureRouting()
    
    log.info("Pub Quiz Backend (Kotlin/Ktor) started successfully!")
}
