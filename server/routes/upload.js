import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { canMakeApiCall, incrementApiUsage } from '../middleware/usage.js';
import { extractCardText } from '../services/vision.js';
import { searchCards } from '../services/ebay.js';
import { matchCard } from '../services/matcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, HEIC'));
        }
    },
});

// Storage limit (800MB warning, 1GB max)
const STORAGE_WARNING_BYTES = 800 * 1024 * 1024;
const STORAGE_MAX_BYTES = 1024 * 1024 * 1024;

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/upload/storage
 * Get current storage usage
 */
router.get('/storage', asyncHandler(async (req, res) => {
    const result = await query('SELECT current_bytes FROM storage_usage LIMIT 1');
    const currentBytes = result.rows[0]?.current_bytes || 0;

    res.json({
        used: currentBytes,
        usedMB: (currentBytes / (1024 * 1024)).toFixed(2),
        max: STORAGE_MAX_BYTES,
        maxMB: (STORAGE_MAX_BYTES / (1024 * 1024)).toFixed(0),
        warning: currentBytes > STORAGE_WARNING_BYTES,
        available: STORAGE_MAX_BYTES - currentBytes,
    });
}));

/**
 * POST /api/upload/image
 * Upload a card image and optionally run matching
 */
router.post('/image', upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    const { runMatching = 'true' } = req.body;

    // Check storage limit
    const storageResult = await query('SELECT current_bytes FROM storage_usage LIMIT 1');
    const currentBytes = storageResult.rows[0]?.current_bytes || 0;

    if (currentBytes >= STORAGE_MAX_BYTES) {
        return res.status(507).json({
            error: 'Storage limit reached',
            message: 'Maximum storage of 1GB reached. Please delete some cards first.',
        });
    }

    // Process and optimize image
    const imageId = uuidv4();
    const filename = `${imageId}.webp`;
    const uploadsDir = join(__dirname, '..', 'uploads');
    const filePath = join(uploadsDir, filename);

    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Resize and convert to WebP for smaller file size
    const processedImage = await sharp(req.file.buffer)
        .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

    // Save to disk
    await fs.writeFile(filePath, processedImage);

    // Update storage usage
    const newBytes = currentBytes + processedImage.length;
    await query(
        'UPDATE storage_usage SET current_bytes = $1, last_updated = NOW()',
        [newBytes]
    );

    const imagePath = `/uploads/${filename}`;

    // Storage warning check
    const storageWarning = newBytes > STORAGE_WARNING_BYTES;
    if (storageWarning) {
        console.warn(`⚠️ Storage warning: ${(newBytes / (1024 * 1024)).toFixed(2)}MB used`);
    }

    // Run card matching if requested
    let matchResult = null;

    if (runMatching === 'true') {
        console.log('🔍 Starting card matching flow...');

        // Check API limit
        const canUseVision = await canMakeApiCall('google_vision');
        console.log('📊 Can use Vision API:', canUseVision);

        if (canUseVision) {
            try {
                // Extract text from card image
                console.log('👁️ Calling Vision API...');
                const extractedText = await extractCardText(processedImage);
                await incrementApiUsage('google_vision');
                console.log('📝 Extracted text result:', extractedText);

                if (extractedText) {
                    // Try eBay search (optional - don't fail if it doesn't work)
                    let ebayResults = [];
                    try {
                        console.log('🔎 Searching eBay...');
                        ebayResults = await searchCards(extractedText);
                        console.log('🛒 eBay results count:', ebayResults?.length || 0);
                    } catch (ebayError) {
                        console.warn('⚠️ eBay search failed (optional):', ebayError.message);
                        // Continue without eBay results
                    }

                    // Run matching algorithm with Vision data (eBay optional)
                    matchResult = await matchCard(extractedText, ebayResults);
                    console.log('✅ Match result:', matchResult);

                    // Always include the extracted Vision data even if no eBay match
                    matchResult.visionData = extractedText;
                } else {
                    console.log('⚠️ No text extracted from image');
                    matchResult = { error: 'No text detected', message: 'Could not extract text from image' };
                }
            } catch (error) {
                console.error('❌ Card matching error:', error.message);
                console.error('Stack:', error.stack);
                // Don't fail the upload, just skip matching
                matchResult = { error: 'Matching failed', message: error.message };
            }
        } else {
            console.log('⚠️ API limit reached');
            matchResult = {
                skipped: true,
                reason: 'Monthly API limit reached. Please add card details manually.',
            };
        }
    } else {
        console.log('ℹ️ Card matching disabled (runMatching =', runMatching, ')');
    }

    res.status(201).json({
        success: true,
        imagePath,
        imageSize: processedImage.length,
        storageWarning,
        match: matchResult,
    });
}));

/**
 * DELETE /api/upload/image/:filename
 * Delete an uploaded image
 */
router.delete('/image/:filename', asyncHandler(async (req, res) => {
    const { filename } = req.params;

    // Security: Only allow deleting from uploads directory
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = join(__dirname, '..', 'uploads', filename);

    try {
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);

        // Update storage usage
        await query(
            `UPDATE storage_usage 
       SET current_bytes = GREATEST(0, current_bytes - $1), 
           last_updated = NOW()`,
            [stats.size]
        );

        res.json({ success: true, deleted: filename });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'Image not found' });
        }
        throw error;
    }
}));

export default router;
