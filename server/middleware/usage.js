import { query } from '../db/index.js';

// API limits (to stay under free tier)
const API_LIMITS = {
    google_vision: 900,  // Monthly limit (1000 free, 100 buffer)
};

/**
 * Check if an API call can be made (under limit)
 * @param {string} service - Service name (e.g., 'google_vision')
 * @returns {Promise<boolean>}
 */
export const canMakeApiCall = async (service) => {
    const limit = API_LIMITS[service];
    if (!limit) return true; // No limit configured

    const currentMonth = new Date().toISOString().slice(0, 7); // '2026-02'

    const result = await query(
        'SELECT call_count FROM api_usage WHERE service = $1 AND month = $2',
        [service, currentMonth]
    );

    if (result.rows.length === 0) {
        return true; // No usage yet this month
    }

    return result.rows[0].call_count < limit;
};

/**
 * Increment API call counter
 * @param {string} service - Service name
 */
export const incrementApiUsage = async (service) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    await query(
        `INSERT INTO api_usage (service, month, call_count, last_called)
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT (service, month) 
     DO UPDATE SET 
       call_count = api_usage.call_count + 1,
       last_called = NOW()`,
        [service, currentMonth]
    );
};

/**
 * Get current API usage for a service
 * @param {string} service - Service name
 * @returns {Promise<{used: number, limit: number, remaining: number}>}
 */
export const getApiUsage = async (service) => {
    const limit = API_LIMITS[service] || 0;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const result = await query(
        'SELECT call_count FROM api_usage WHERE service = $1 AND month = $2',
        [service, currentMonth]
    );

    const used = result.rows[0]?.call_count || 0;

    return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        month: currentMonth,
    };
};

/**
 * Middleware to check API limit before allowing request
 */
export const checkApiLimit = (service) => async (req, res, next) => {
    const canProceed = await canMakeApiCall(service);

    if (!canProceed) {
        return res.status(429).json({
            error: 'API limit reached',
            message: `Monthly ${service} limit reached. Please add card manually.`,
            usage: await getApiUsage(service),
        });
    }

    next();
};
