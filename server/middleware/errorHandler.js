/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message,
        });
    }

    if (err.name === 'UnauthorizedError' || err.status === 401) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }

    if (err.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(409).json({
            error: 'Conflict',
            message: 'Resource already exists',
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * Async route wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
