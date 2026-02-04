import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Extract text from a card image using Google Cloud Vision OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string|null>} Extracted text or null
 */
export const extractCardText = async (imageBuffer) => {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ Google Cloud API key not configured');
        return null;
    }

    try {
        const base64Image = imageBuffer.toString('base64');

        const response = await axios.post(
            `${VISION_API_URL}?key=${apiKey}`,
            {
                requests: [
                    {
                        image: { content: base64Image },
                        features: [
                            { type: 'TEXT_DETECTION', maxResults: 10 },
                            { type: 'LOGO_DETECTION', maxResults: 5 },
                        ],
                    },
                ],
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        const result = response.data.responses[0];

        // Get full text annotation
        const fullText = result.fullTextAnnotation?.text || '';

        // Get detected logos (can help identify card brand)
        const logos = result.logoAnnotations?.map(l => l.description) || [];

        if (!fullText && logos.length === 0) {
            console.log('No text or logos detected in image');
            return null;
        }

        // Parse the extracted text to identify card details
        const parsedData = parseCardText(fullText, logos);

        console.log('📷 Vision API extracted:', {
            rawTextLength: fullText.length,
            logos,
            parsed: parsedData,
        });

        return parsedData;
    } catch (error) {
        console.error('Vision API error:', error.response?.data || error.message);
        throw new Error(`Vision API failed: ${error.message}`);
    }
};

/**
 * Parse raw OCR text to extract card details
 * @param {string} rawText - Raw OCR text
 * @param {string[]} logos - Detected logos
 * @returns {object} Parsed card data
 */
const parseCardText = (rawText, logos) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const text = rawText.toLowerCase();

    // Detect sport
    let sport = 'Unknown';
    if (text.includes('nba') || text.includes('basketball') || logos.includes('NBA')) {
        sport = 'Basketball';
    } else if (text.includes('nfl') || text.includes('football') || logos.includes('NFL')) {
        sport = 'Football';
    } else if (text.includes('mlb') || text.includes('baseball') || logos.includes('MLB')) {
        sport = 'Baseball';
    } else if (text.includes('nhl') || text.includes('hockey') || logos.includes('NHL')) {
        sport = 'Hockey';
    } else if (text.includes('soccer') || text.includes('fifa') || logos.includes('FIFA')) {
        sport = 'Soccer';
    }

    // Extract year (typically 4 digits between 1900-2030)
    const yearMatch = rawText.match(/\b(19[0-9]{2}|20[0-3][0-9])\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract card number (often preceded by # or 'No.')
    const cardNumberMatch = rawText.match(/(?:#|No\.?|Card)\s*(\d+)/i);
    const cardNumber = cardNumberMatch ? cardNumberMatch[1] : null;

    // Common card brands
    const brands = ['Topps', 'Panini', 'Upper Deck', 'Bowman', 'Fleer', 'Donruss', 'Score'];
    const detectedBrand = brands.find(b => text.includes(b.toLowerCase())) ||
        logos.find(l => brands.some(b => l.includes(b)));

    // Common card sets
    const sets = ['Prizm', 'Chrome', 'Optic', 'Select', 'Mosaic', 'National Treasures', 'Contenders'];
    const detectedSet = sets.find(s => text.includes(s.toLowerCase()));

    // Build search query (use first few meaningful lines)
    const meaningfulLines = lines
        .filter(l => l.length > 2 && !l.match(/^\d+$/))
        .slice(0, 5);

    return {
        rawText: rawText.substring(0, 500), // Truncate for storage
        sport,
        year,
        cardNumber,
        brand: detectedBrand,
        cardSet: detectedSet,
        searchQuery: meaningfulLines.join(' ').substring(0, 200),
        logos,
    };
};

export default { extractCardText };
