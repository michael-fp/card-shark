import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Allowed email addresses (whitelist)
const ALLOWED_EMAILS = [
    'masonwoollands@gmail.com',
    'michaelwoollands@gmail.com',
];

/**
 * Verify JWT token and check email whitelist
 */
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if email is in whitelist
        if (!ALLOWED_EMAILS.includes(decoded.email)) {
            console.warn(`⚠️ Unauthorized email attempt: ${decoded.email}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Your email is not authorized to access this application',
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Check if email is allowed (for login flow)
 */
export const isEmailAllowed = (email) => {
    return ALLOWED_EMAILS.includes(email);
};

/**
 * Get allowed emails (for debugging/admin)
 */
export const getAllowedEmails = () => ALLOWED_EMAILS;
