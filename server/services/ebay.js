import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// eBay Browse API endpoints
const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1';
const EBAY_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

// Cache token in memory
let accessToken = null;
let tokenExpiry = null;

/**
 * Get eBay OAuth access token
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('⚠️ eBay API credentials not configured');
        return null;
    }

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(
            EBAY_AUTH_URL,
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 5000,
            }
        );

        accessToken = response.data.access_token;
        // Set expiry 5 minutes before actual expiry for safety
        tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

        return accessToken;
    } catch (error) {
        console.error('eBay auth error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with eBay');
    }
};

/**
 * Search eBay for sports cards matching the query
 * @param {object} parsedCardData - Parsed card data from Vision API
 * @returns {Promise<object[]>} Array of matching cards with prices
 */
export const searchCards = async (parsedCardData) => {
    const token = await getAccessToken();

    if (!token) {
        return [];
    }

    try {
        // Build clean search query from structured form fields only
        // Avoid using raw searchQuery which has partial/redundant text
        const queryParts = [];

        // Year first (most specific)
        if (parsedCardData.year) {
            queryParts.push(parsedCardData.year);
        }

        // Player name (primary identifier)
        if (parsedCardData.playerName) {
            queryParts.push(parsedCardData.playerName);
        }

        // Grade (important for pricing)
        if (parsedCardData.grade) {
            // Format grade with PSA prefix for better eBay matches
            // Grade 10 = "PSA 10 GEM MT" (Gem Mint is highest standard)
            // Other grades = "PSA {grade}"
            const grade = parseFloat(parsedCardData.grade);
            if (grade === 10) {
                queryParts.push('PSA 10 GEM MT');
            } else {
                queryParts.push(`PSA ${parsedCardData.grade}`);
            }
        }

        // Brand/Set (e.g. "Donruss Magicians")
        if (parsedCardData.brand) {
            queryParts.push(parsedCardData.brand);
        }
        if (parsedCardData.cardSet && parsedCardData.cardSet !== parsedCardData.brand) {
            queryParts.push(parsedCardData.cardSet);
        }

        // Build final query - deduplicated
        const searchQuery = [...new Set(queryParts.map(p => String(p).trim()).filter(Boolean))].join(' ');

        // Add sport category filter
        const categoryMap = {
            'Basketball': '214',   // Sports Trading Cards > Basketball
            'Football': '215',     // Sports Trading Cards > Football
            'Baseball': '213',     // Sports Trading Cards > Baseball
            'Hockey': '216',       // Sports Trading Cards > Hockey
            'Soccer': '217',       // Sports Trading Cards > Soccer
        };

        const categoryId = categoryMap[parsedCardData.sport] || '212'; // Default: Sports Trading Cards

        console.log('🔍 eBay search query:', searchQuery);

        const response = await axios.get(`${EBAY_API_URL}/item_summary/search`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            },
            params: {
                q: searchQuery.trim().substring(0, 200),
                category_ids: categoryId,
                filter: 'buyingOptions:{FIXED_PRICE}',
                sort: 'price',
                limit: 10,
            },
            timeout: 10000,
        });

        const items = response.data.itemSummaries || [];

        return items.map(item => ({
            ebayItemId: item.itemId,
            title: item.title,
            price: parseFloat(item.price?.value) || 0,
            currency: item.price?.currency || 'USD',
            imageUrl: item.image?.imageUrl,
            itemUrl: item.itemWebUrl,
            condition: item.condition,
            seller: item.seller?.username,
        }));
    } catch (error) {
        console.error('eBay search error:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Get current market value for a card (average of recent sales)
 * @param {string} searchQuery - Search query for the card
 * @returns {Promise<{avgPrice: number, minPrice: number, maxPrice: number}>}
 */
export const getMarketValue = async (searchQuery) => {
    const token = await getAccessToken();

    if (!token) {
        return { avgPrice: 0, minPrice: 0, maxPrice: 0 };
    }

    try {
        const response = await axios.get(`${EBAY_API_URL}/item_summary/search`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            },
            params: {
                q: searchQuery,
                category_ids: '212', // Sports Trading Cards
                filter: 'buyingOptions:{FIXED_PRICE}',
                sort: 'price',
                limit: 20,
            },
            timeout: 10000,
        });

        const items = response.data.itemSummaries || [];
        const prices = items
            .map(item => parseFloat(item.price?.value) || 0)
            .filter(p => p > 0);

        if (prices.length === 0) {
            return { avgPrice: 0, minPrice: 0, maxPrice: 0 };
        }

        // Remove outliers (top and bottom 10%)
        const sorted = prices.sort((a, b) => a - b);
        const trimCount = Math.floor(sorted.length * 0.1);
        const trimmed = sorted.slice(trimCount, sorted.length - trimCount || undefined);

        const sum = trimmed.reduce((a, b) => a + b, 0);

        return {
            avgPrice: Math.round((sum / trimmed.length) * 100) / 100,
            minPrice: sorted[0],
            maxPrice: sorted[sorted.length - 1],
            sampleSize: prices.length,
        };
    } catch (error) {
        console.error('eBay market value error:', error.message);
        return { avgPrice: 0, minPrice: 0, maxPrice: 0 };
    }
};

export default { searchCards, getMarketValue };
