import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getApiUsage } from '../middleware/usage.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/stats
 * Get comprehensive collection statistics
 */
router.get('/', asyncHandler(async (req, res) => {
    const { userId } = req.user;

    // Execute all queries in parallel
    const [
        totalStats,
        sportBreakdown,
        gradeBreakdown,
        yearBreakdown,
        topCards,
        recentCards,
        wishlistCount,
    ] = await Promise.all([
        // Total collection stats
        query(
            `SELECT 
        COUNT(*) as total_cards,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(SUM(purchase_price), 0) as total_cost,
        COALESCE(AVG(grade), 0) as avg_grade,
        COALESCE(AVG(value), 0) as avg_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false`,
            [userId]
        ),

        // Breakdown by sport
        query(
            `SELECT 
        sport,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false
      GROUP BY sport
      ORDER BY total_value DESC`,
            [userId]
        ),

        // Breakdown by grade
        query(
            `SELECT 
        FLOOR(grade) as grade_bucket,
        COUNT(*) as count
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND grade IS NOT NULL
      GROUP BY FLOOR(grade)
      ORDER BY grade_bucket DESC`,
            [userId]
        ),

        // Breakdown by year (last 20 years)
        query(
            `SELECT 
        year,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 20`,
            [userId]
        ),

        // Top 10 most valuable cards
        query(
            `SELECT 
        id, player_name, team, year, grade, value, image_path
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND value IS NOT NULL
      ORDER BY value DESC
      LIMIT 10`,
            [userId]
        ),

        // 5 most recently added
        query(
            `SELECT 
        id, player_name, team, year, grade, value, image_path, created_at
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false
      ORDER BY created_at DESC
      LIMIT 5`,
            [userId]
        ),

        // Wishlist count
        query(
            `SELECT COUNT(*) as count FROM cards WHERE user_id = $1 AND is_wishlist = true`,
            [userId]
        ),
    ]);

    const stats = totalStats.rows[0];
    const totalValue = parseFloat(stats.total_value) || 0;
    const totalCost = parseFloat(stats.total_cost) || 0;

    res.json({
        overview: {
            totalCards: parseInt(stats.total_cards) || 0,
            totalValue,
            totalCost,
            profit: totalValue - totalCost,
            profitPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(1) : 0,
            avgGrade: parseFloat(stats.avg_grade).toFixed(1) || 0,
            avgValue: parseFloat(stats.avg_value).toFixed(2) || 0,
            wishlistCount: parseInt(wishlistCount.rows[0].count) || 0,
        },
        bySort: sportBreakdown.rows.map(row => ({
            sport: row.sport,
            count: parseInt(row.count),
            totalValue: parseFloat(row.total_value),
        })),
        byGrade: gradeBreakdown.rows.map(row => ({
            grade: parseInt(row.grade_bucket),
            count: parseInt(row.count),
        })),
        byYear: yearBreakdown.rows.map(row => ({
            year: parseInt(row.year),
            count: parseInt(row.count),
            totalValue: parseFloat(row.total_value),
        })),
        topCards: topCards.rows,
        recentCards: recentCards.rows,
    });
}));

/**
 * GET /api/stats/overview
 * Alias for GET /api/stats (for client compatibility)
 */
router.get('/overview', asyncHandler(async (req, res) => {
    const { userId } = req.user;

    // Execute all queries in parallel
    const [
        totalStats,
        sportBreakdown,
        gradeBreakdown,
        yearBreakdown,
        topCards,
        recentCards,
        wishlistCount,
    ] = await Promise.all([
        // Total collection stats
        query(
            `SELECT 
        COUNT(*) as total_cards,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(SUM(purchase_price), 0) as total_cost,
        COALESCE(AVG(grade), 0) as avg_grade,
        COALESCE(AVG(value), 0) as avg_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false`,
            [userId]
        ),

        // Breakdown by sport
        query(
            `SELECT 
        sport,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false
      GROUP BY sport
      ORDER BY total_value DESC`,
            [userId]
        ),

        // Breakdown by grade
        query(
            `SELECT 
        FLOOR(grade) as grade_bucket,
        COUNT(*) as count
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND grade IS NOT NULL
      GROUP BY FLOOR(grade)
      ORDER BY grade_bucket DESC`,
            [userId]
        ),

        // Breakdown by year (last 20 years)
        query(
            `SELECT 
        year,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total_value
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 20`,
            [userId]
        ),

        // Top 10 most valuable cards
        query(
            `SELECT 
        id, player_name, team, year, grade, value, image_path
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false AND value IS NOT NULL
      ORDER BY value DESC
      LIMIT 10`,
            [userId]
        ),

        // 5 most recently added
        query(
            `SELECT 
        id, player_name, team, year, grade, value, image_path, created_at
      FROM cards 
      WHERE user_id = $1 AND is_wishlist = false
      ORDER BY created_at DESC
      LIMIT 5`,
            [userId]
        ),

        // Wishlist count
        query(
            `SELECT COUNT(*) as count FROM cards WHERE user_id = $1 AND is_wishlist = true`,
            [userId]
        ),
    ]);

    const stats = totalStats.rows[0];
    const totalValue = parseFloat(stats.total_value) || 0;
    const totalCost = parseFloat(stats.total_cost) || 0;

    res.json({
        overview: {
            totalCards: parseInt(stats.total_cards) || 0,
            totalValue,
            totalCost,
            profit: totalValue - totalCost,
            profitPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(1) : 0,
            avgGrade: parseFloat(stats.avg_grade).toFixed(1) || 0,
            avgValue: parseFloat(stats.avg_value).toFixed(2) || 0,
            wishlistCount: parseInt(wishlistCount.rows[0].count) || 0,
        },
        bySort: sportBreakdown.rows.map(row => ({
            sport: row.sport,
            count: parseInt(row.count),
            totalValue: parseFloat(row.total_value),
        })),
        byGrade: gradeBreakdown.rows.map(row => ({
            grade: parseInt(row.grade_bucket),
            count: parseInt(row.count),
        })),
        byYear: yearBreakdown.rows.map(row => ({
            year: parseInt(row.year),
            count: parseInt(row.count),
            totalValue: parseFloat(row.total_value),
        })),
        topCards: topCards.rows,
        recentCards: recentCards.rows,
    });
}));

/**
 * GET /api/stats/value-history
 * Get portfolio value over time
 */
router.get('/value-history', asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { days = 30 } = req.query;

    // For now, we'll generate synthetic history based on current cards
    // In production, this would query the price_history table
    const result = await query(
        `SELECT 
      DATE(created_at) as date,
      SUM(value) OVER (ORDER BY DATE(created_at)) as cumulative_value,
      COUNT(*) OVER (ORDER BY DATE(created_at)) as cumulative_count
    FROM cards 
    WHERE user_id = $1 AND is_wishlist = false
    ORDER BY created_at`,
        [userId]
    );

    res.json({
        history: result.rows.map(row => ({
            date: row.date,
            value: parseFloat(row.cumulative_value) || 0,
            cardCount: parseInt(row.cumulative_count),
        })),
    });
}));

/**
 * GET /api/stats/usage
 * Get API and storage usage for cost monitoring
 */
router.get('/usage', asyncHandler(async (req, res) => {
    const visionUsage = await getApiUsage('google_vision');

    // Get storage usage
    const storageResult = await query(
        'SELECT current_bytes FROM storage_usage LIMIT 1'
    );

    const currentBytes = storageResult.rows[0]?.current_bytes || 0;
    const maxBytes = 1024 * 1024 * 1024; // 1GB
    const warningBytes = 800 * 1024 * 1024; // 800MB

    res.json({
        googleVision: {
            ...visionUsage,
            percentUsed: ((visionUsage.used / visionUsage.limit) * 100).toFixed(1),
        },
        storage: {
            used: currentBytes,
            usedMB: (currentBytes / (1024 * 1024)).toFixed(2),
            max: maxBytes,
            maxMB: (maxBytes / (1024 * 1024)).toFixed(0),
            warning: currentBytes > warningBytes,
            percentUsed: ((currentBytes / maxBytes) * 100).toFixed(1),
        },
    });
}));

export default router;
