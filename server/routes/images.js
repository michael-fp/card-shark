import { Router } from 'express';
import { query } from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/images/:filename
 * Serve image from database (for persistent storage on Railway)
 */
router.get('/:filename', asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const imagePath = `/uploads/${filename}`;

    // Try to find the image in the database
    const result = await query(
        'SELECT image_data FROM cards WHERE image_path = $1 LIMIT 1',
        [imagePath]
    );

    if (result.rows.length === 0 || !result.rows[0].image_data) {
        return res.status(404).json({ error: 'Image not found' });
    }

    const imageData = result.rows[0].image_data;

    // Parse base64 data URL
    // Format: data:image/webp;base64,AAAA...
    const matches = imageData.match(/^data:([^;]+);base64,(.*)$/);

    if (!matches) {
        return res.status(500).json({ error: 'Invalid image data format' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(buffer);
}));

export default router;
