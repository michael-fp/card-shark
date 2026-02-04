import tinify from 'tinify';
import { promises as fs } from 'fs';
import { query } from '../db/index.js';

// Initialize with API key from environment
tinify.key = process.env.TINIFY_API_KEY;

/**
 * Compress an image using TinyPNG/TinyJPG API
 * This runs in the background and overwrites the original file when done
 * @param {string} filePath - Absolute path to the image file
 * @param {number} originalSize - Original file size in bytes (for storage tracking)
 */
export async function compressImageAsync(filePath, originalSize) {
    // Don't proceed if no API key configured
    if (!process.env.TINIFY_API_KEY) {
        console.log('⏭️ Tinify API key not configured, skipping compression');
        return;
    }

    try {
        console.log(`🗜️ Starting async compression for: ${filePath}`);

        // Read the current file
        const imageBuffer = await fs.readFile(filePath);

        // Compress using Tinify API
        const compressedBuffer = await tinify.fromBuffer(imageBuffer).toBuffer();
        const compressedSize = compressedBuffer.length;

        // Calculate savings
        const savedBytes = originalSize - compressedSize;
        const savingsPercent = ((savedBytes / originalSize) * 100).toFixed(1);

        console.log(`✅ Compression complete: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savingsPercent}% saved)`);

        // Overwrite the original file with compressed version
        await fs.writeFile(filePath, compressedBuffer);

        // Update storage usage (reduce by the bytes saved)
        if (savedBytes > 0) {
            await query(`
                UPDATE storage_usage 
                SET current_bytes = GREATEST(0, current_bytes - $1), 
                    last_updated = NOW()
            `, [savedBytes]);
            console.log(`💾 Storage reduced by ${(savedBytes / 1024).toFixed(1)}KB`);
        }

        return {
            success: true,
            originalSize,
            compressedSize,
            savedBytes,
            savingsPercent: parseFloat(savingsPercent),
        };
    } catch (error) {
        // Fail gracefully - keep the uncompressed version
        console.warn(`⚠️ Tinify compression failed (keeping original): ${error.message}`);

        // Check if it's a rate limit error
        if (error.status === 429 || error.message?.includes('limit')) {
            console.warn('🚫 Tinify API limit reached');
        }

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Get current Tinify API usage
 */
export async function getTinifyUsage() {
    if (!process.env.TINIFY_API_KEY) {
        return { configured: false };
    }

    try {
        // Make a validation request to get compression count
        await tinify.validate();
        return {
            configured: true,
            compressionsThisMonth: tinify.compressionCount,
        };
    } catch (error) {
        return {
            configured: true,
            error: error.message,
        };
    }
}
