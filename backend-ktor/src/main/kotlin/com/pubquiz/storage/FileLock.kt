package com.pubquiz.storage

import java.io.RandomAccessFile
import java.nio.file.Path
import kotlin.io.path.*

/**
 * Provides file-level locking to prevent concurrent write conflicts.
 * Uses atomic write pattern: write to temp file, then rename.
 */
object AtomicFileWriter {
    
    /**
     * Atomically writes content to a file with proper locking.
     * 
     * Process:
     * 1. Write to temporary file (*.tmp)
     * 2. Acquire exclusive lock on target file
     * 3. Rename temp file to target (atomic operation on most filesystems)
     * 4. Release lock
     * 
     * This ensures concurrent writes don't corrupt data and last write wins.
     */
    fun writeAtomic(filePath: Path, content: String) {
        // Ensure parent directory exists
        val parentDir = filePath.parent
        if (parentDir != null) {
            parentDir.createDirectories()
        }
        
        // Write to temp file first
        val tempFile = filePath.resolveSibling("${filePath.fileName}.tmp")
        tempFile.writeText(content, Charsets.UTF_8)
        
        // Acquire lock on target file (create if doesn't exist)
        val lockFile = filePath.resolveSibling("${filePath.fileName}.lock")
        RandomAccessFile(lockFile.toFile(), "rw").use { raf ->
            raf.channel.use { channel ->
                // Acquire exclusive lock (blocks if another process has lock)
                channel.lock().use {
                    // Atomic rename (on POSIX systems, this is atomic even if target exists)
                    tempFile.toFile().renameTo(filePath.toFile())
                }
            }
        }
        
        // Clean up lock file if it exists
        lockFile.deleteIfExists()
    }
    
    /**
     * Reads a file with shared lock to ensure consistency.
     * Multiple readers can acquire shared lock simultaneously.
     */
    fun <T> readWithLock(filePath: Path, reader: (String) -> T): T? {
        if (!filePath.exists()) {
            return null
        }
        
        // Acquire shared lock for reading
        val lockFile = filePath.resolveSibling("${filePath.fileName}.lock")
        
        return try {
            RandomAccessFile(lockFile.toFile(), "rw").use { raf ->
                raf.channel.use { channel ->
                    // Acquire shared lock (allows multiple readers)
                    channel.lock(0, Long.MAX_VALUE, true).use {
                        val content = filePath.readText(Charsets.UTF_8)
                        reader(content)
                    }
                }
            }
        } finally {
            // Clean up lock file
            lockFile.deleteIfExists()
        }
    }
}
