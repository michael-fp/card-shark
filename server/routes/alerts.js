import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/alerts
 * Get all price alerts for the user
 */
router.get('/', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { triggered } = req.query;

    let sql = `
    SELECT 
      pa.id,
      pa.target_price,
      pa.direction,
      pa.is_triggered,
      pa.triggered_at,
      pa.created_at,
      c.id as card_id,
      c.player_name,
      c.team,
      c.year,
      c.value as current_value,
      c.image_path
    FROM price_alerts pa
    JOIN cards c ON pa.card_id = c.id
    WHERE pa.user_id = $1
  `;

    const params = [userId];

    if (triggered !== undefined) {
        sql += ` AND pa.is_triggered = $2`;
        params.push(triggered === 'true');
    }

    sql += ` ORDER BY pa.created_at DESC`;

    const result = await query(sql, params);

    res.json({ alerts: result.rows });
}));

/**
 * POST /api/alerts
 * Create a new price alert
 */
router.post('/', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { cardId, targetPrice, direction } = req.body;

    // Validate input
    if (!cardId || !targetPrice || !direction) {
        return res.status(400).json({
            error: 'Missing required fields: cardId, targetPrice, direction',
        });
    }

    if (!['above', 'below'].includes(direction)) {
        return res.status(400).json({
            error: 'Direction must be "above" or "below"',
        });
    }

    // Verify card ownership
    const cardCheck = await query(
        'SELECT id, player_name FROM cards WHERE id = $1 AND user_id = $2',
        [cardId, userId]
    );

    if (cardCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
    }

    // Check for existing alert on same card/direction
    const existingCheck = await query(
        `SELECT id FROM price_alerts 
     WHERE card_id = $1 AND user_id = $2 AND direction = $3 AND is_triggered = false`,
        [cardId, userId, direction]
    );

    if (existingCheck.rows.length > 0) {
        return res.status(409).json({
            error: 'Alert already exists',
            message: `You already have an active "${direction}" alert for this card`,
        });
    }

    const result = await query(
        `INSERT INTO price_alerts (card_id, user_id, target_price, direction)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [cardId, userId, targetPrice, direction]
    );

    res.status(201).json({
        alert: result.rows[0],
        card: cardCheck.rows[0],
    });
}));

/**
 * DELETE /api/alerts/:id
 * Delete a price alert
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await query(
        'DELETE FROM price_alerts WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, deleted: result.rows[0].id });
}));

/**
 * POST /api/alerts/:id/dismiss
 * Dismiss a triggered alert
 */
router.post('/:id/dismiss', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await query(
        `DELETE FROM price_alerts 
     WHERE id = $1 AND user_id = $2 AND is_triggered = true 
     RETURNING id`,
        [id, userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found or not triggered' });
    }

    res.json({ success: true, dismissed: result.rows[0].id });
}));

/**
 * GET /api/alerts/triggered
 * Get count of triggered alerts (for notification badge)
 */
router.get('/triggered/count', asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const result = await query(
        'SELECT COUNT(*) as count FROM price_alerts WHERE user_id = $1 AND is_triggered = true',
        [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
}));

export default router;
