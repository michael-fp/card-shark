import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../db/index.js';
import { isEmailAllowed } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

dotenv.config();

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Authenticate with Google OAuth token
 */
router.post('/google', asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if email is allowed
    if (!isEmailAllowed(email)) {
        console.warn(`⚠️ Blocked login attempt: ${email}`);
        return res.status(403).json({
            error: 'Access denied',
            message: 'Your email is not authorized to access CardShark',
        });
    }

    // Upsert user in database
    const result = await query(
        `INSERT INTO users (email, name, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) 
     DO UPDATE SET 
       name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()
     RETURNING id, email, name, avatar_url`,
        [email, name, picture]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            name: user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
        },
    });
}));

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await query(
            'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token (even if expired, within grace period)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

        // Check if user still exists and is allowed
        const result = await query(
            'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (!isEmailAllowed(user.email)) {
            return res.status(403).json({ error: 'Access revoked' });
        }

        // Generate new token
        const newToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token: newToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}));

export default router;
