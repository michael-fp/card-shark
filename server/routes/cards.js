import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/cards
 * Get all cards for the authenticated user with optional filters
 */
router.get('/', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const {
        sport,
        year,
        team,
        player,
        gradeMin,
        gradeMax,
        valueMin,
        valueMax,
        isWishlist,
        sort = 'created_at',
        order = 'desc',
        limit = 50,
        offset = 0,
    } = req.query;

    // Build dynamic query
    let conditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (sport) {
        conditions.push(`sport = $${paramIndex++}`);
        params.push(sport);
    }

    if (year) {
        conditions.push(`year = $${paramIndex++}`);
        params.push(parseInt(year));
    }

    if (team) {
        conditions.push(`team ILIKE $${paramIndex++}`);
        params.push(`%${team}%`);
    }

    if (player) {
        conditions.push(`player_name ILIKE $${paramIndex++}`);
        params.push(`%${player}%`);
    }

    if (gradeMin) {
        conditions.push(`grade >= $${paramIndex++}`);
        params.push(parseFloat(gradeMin));
    }

    if (gradeMax) {
        conditions.push(`grade <= $${paramIndex++}`);
        params.push(parseFloat(gradeMax));
    }

    if (valueMin) {
        conditions.push(`value >= $${paramIndex++}`);
        params.push(parseFloat(valueMin));
    }

    if (valueMax) {
        conditions.push(`value <= $${paramIndex++}`);
        params.push(parseFloat(valueMax));
    }

    if (isWishlist !== undefined) {
        conditions.push(`is_wishlist = $${paramIndex++}`);
        params.push(isWishlist === 'true');
    }

    // Validate sort column
    const allowedSorts = ['created_at', 'updated_at', 'player_name', 'value', 'grade', 'year'];
    const sortColumn = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Add pagination params
    params.push(parseInt(limit), parseInt(offset));

    const sql = `
    SELECT 
      id, image_path, description, sport, year, player_name, team,
      card_number, card_set, grade, value, purchase_price, 
      is_wishlist, ebay_item_id, created_at, updated_at
    FROM cards
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

    const result = await query(sql, params);

    // Get total count for pagination
    const countSql = `
    SELECT COUNT(*) as total
    FROM cards
    WHERE ${conditions.join(' AND ')}
  `;
    const countResult = await query(countSql, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
        cards: result.rows,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + result.rows.length < total,
        },
    });
}));

/**
 * GET /api/cards/:id
 * Get a single card by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await query(
        `SELECT * FROM cards WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card: result.rows[0] });
}));

/**
 * POST /api/cards
 * Create a new card
 */
router.post('/', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const {
        imagePath,
        description,
        sport,
        year,
        playerName,
        team,
        cardNumber,
        cardSet,
        grade,
        value,
        purchasePrice,
        isWishlist = false,
        ebayItemId,
    } = req.body;

    // Validation
    if (!imagePath || !sport || !playerName) {
        return res.status(400).json({
            error: 'Missing required fields: imagePath, sport, playerName'
        });
    }

    // Check for duplicates (optional warning)
    const duplicateCheck = await query(
        `SELECT id, player_name, year, card_set 
     FROM cards 
     WHERE user_id = $1 
       AND player_name ILIKE $2 
       AND ($3::integer IS NULL OR year = $3)
       AND is_wishlist = false
     LIMIT 1`,
        [userId, playerName, year || null]
    );

    const result = await query(
        `INSERT INTO cards (
      user_id, image_path, description, sport, year, player_name, team,
      card_number, card_set, grade, value, purchase_price, is_wishlist, ebay_item_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
        [
            userId, imagePath, description, sport, year, playerName, team,
            cardNumber, cardSet, grade, value, purchasePrice, isWishlist, ebayItemId
        ]
    );

    res.status(201).json({
        card: result.rows[0],
        duplicate: duplicateCheck.rows.length > 0 ? {
            existingId: duplicateCheck.rows[0].id,
            message: `Similar card already exists: ${duplicateCheck.rows[0].player_name} (${duplicateCheck.rows[0].year})`,
        } : null,
    });
}));

/**
 * PUT /api/cards/:id
 * Update an existing card
 */
router.put('/:id', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const {
        description,
        sport,
        year,
        playerName,
        team,
        cardNumber,
        cardSet,
        grade,
        value,
        purchasePrice,
        isWishlist,
    } = req.body;

    // Check ownership
    const existing = await query(
        'SELECT id FROM cards WHERE id = $1 AND user_id = $2',
        [id, userId]
    );

    if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
    }

    const result = await query(
        `UPDATE cards SET
      description = COALESCE($3, description),
      sport = COALESCE($4, sport),
      year = COALESCE($5, year),
      player_name = COALESCE($6, player_name),
      team = COALESCE($7, team),
      card_number = COALESCE($8, card_number),
      card_set = COALESCE($9, card_set),
      grade = COALESCE($10, grade),
      value = COALESCE($11, value),
      purchase_price = COALESCE($12, purchase_price),
      is_wishlist = COALESCE($13, is_wishlist)
    WHERE id = $1 AND user_id = $2
    RETURNING *`,
        [id, userId, description, sport, year, playerName, team, cardNumber, cardSet, grade, value, purchasePrice, isWishlist]
    );

    res.json({ card: result.rows[0] });
}));

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await query(
        'DELETE FROM cards WHERE id = $1 AND user_id = $2 RETURNING id, image_path',
        [id, userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
    }

    // TODO: Delete image file from storage

    res.json({
        success: true,
        deleted: result.rows[0].id,
    });
}));

/**
 * GET /api/cards/filters/options
 * Get available filter options (sports, teams, years)
 */
router.get('/filters/options', asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const [sports, teams, years] = await Promise.all([
        query(
            'SELECT DISTINCT sport FROM cards WHERE user_id = $1 AND sport IS NOT NULL ORDER BY sport',
            [userId]
        ),
        query(
            'SELECT DISTINCT team FROM cards WHERE user_id = $1 AND team IS NOT NULL ORDER BY team',
            [userId]
        ),
        query(
            'SELECT DISTINCT year FROM cards WHERE user_id = $1 AND year IS NOT NULL ORDER BY year DESC',
            [userId]
        ),
    ]);

    res.json({
        sports: sports.rows.map(r => r.sport),
        teams: teams.rows.map(r => r.team),
        years: years.rows.map(r => r.year),
    });
}));

export default router;
