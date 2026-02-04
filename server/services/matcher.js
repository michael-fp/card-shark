/**
 * Card matching service
 * Orchestrates Vision OCR results with eBay search to find card matches
 */

/**
 * Match card data from Vision API with eBay search results
 * @param {object} visionData - Parsed card data from Vision API
 * @param {object[]} ebayResults - Search results from eBay
 * @returns {object} Match result with confidence score and suggestions
 */
export const matchCard = async (visionData, ebayResults) => {
    if (!visionData) {
        return {
            matched: false,
            confidence: 0,
            reason: 'No text extracted from image',
            suggestions: [],
        };
    }

    if (!ebayResults || ebayResults.length === 0) {
        return {
            matched: false,
            confidence: 0,
            reason: 'No matching cards found on eBay',
            extractedData: {
                playerName: visionData.playerName,
                sport: visionData.sport,
                team: visionData.team,
                year: visionData.year,
                cardNumber: visionData.cardNumber,
                grade: visionData.grade,
                brand: visionData.brand,
                cardSet: visionData.cardSet,
            },
            suggestions: [],
        };
    }

    // Score each eBay result against Vision data
    const scoredResults = ebayResults.map(result => {
        let score = 0;
        const matches = [];

        const titleLower = result.title.toLowerCase();

        // Year match (high value)
        if (visionData.year && titleLower.includes(visionData.year.toString())) {
            score += 30;
            matches.push('year');
        }

        // Brand match
        if (visionData.brand && titleLower.includes(visionData.brand.toLowerCase())) {
            score += 20;
            matches.push('brand');
        }

        // Card set match
        if (visionData.cardSet && titleLower.includes(visionData.cardSet.toLowerCase())) {
            score += 25;
            matches.push('cardSet');
        }

        // Card number match (very specific)
        if (visionData.cardNumber && titleLower.includes(`#${visionData.cardNumber}`)) {
            score += 35;
            matches.push('cardNumber');
        }

        // Sport match
        if (visionData.sport && visionData.sport !== 'Unknown') {
            const sportTerms = {
                'Basketball': ['basketball', 'nba'],
                'Football': ['football', 'nfl'],
                'Baseball': ['baseball', 'mlb'],
                'Hockey': ['hockey', 'nhl'],
                'Soccer': ['soccer', 'football', 'fifa'],
            };

            const terms = sportTerms[visionData.sport] || [];
            if (terms.some(t => titleLower.includes(t))) {
                score += 15;
                matches.push('sport');
            }
        }

        // Extract player name from eBay title (usually first few words)
        const playerName = extractPlayerName(result.title);

        return {
            ...result,
            score,
            matches,
            playerName,
        };
    });

    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);

    const topMatch = scoredResults[0];
    const confidence = Math.min(100, topMatch.score);

    // Consider it a match if score >= 50
    const isMatch = confidence >= 50;

    return {
        matched: isMatch,
        confidence,
        matchedCard: isMatch ? {
            // Prefer Vision's playerName, fall back to eBay extraction
            playerName: visionData.playerName || topMatch.playerName,
            sport: visionData.sport,
            year: visionData.year,
            // Prefer Vision's team detection
            team: visionData.team || null,
            cardNumber: visionData.cardNumber,
            cardSet: visionData.cardSet || visionData.brand,
            grade: visionData.grade,
            value: topMatch.price,
            ebayItemId: topMatch.ebayItemId,
            ebayTitle: topMatch.title,
            ebayImageUrl: topMatch.imageUrl,
        } : null,
        extractedData: {
            playerName: visionData.playerName,
            sport: visionData.sport,
            team: visionData.team,
            year: visionData.year,
            cardNumber: visionData.cardNumber,
            grade: visionData.grade,
            brand: visionData.brand,
            cardSet: visionData.cardSet,
            rawText: visionData.rawText,
        },
        suggestions: scoredResults.slice(0, 5).map(r => ({
            title: r.title,
            price: r.price,
            imageUrl: r.imageUrl,
            score: r.score,
            matches: r.matches,
            ebayItemId: r.ebayItemId,
        })),
    };
};

/**
 * Extract player name from eBay listing title
 * @param {string} title - eBay listing title
 * @returns {string} Extracted player name
 */
const extractPlayerName = (title) => {
    // Common patterns:
    // "2023 Panini Prizm Patrick Mahomes #123"
    // "Patrick Mahomes 2023 Topps Chrome"

    // Remove common card-related words
    const removePatterns = [
        /\b\d{4}\b/g,  // Years
        /#\d+/g,       // Card numbers
        /\bprizm\b/gi,
        /\bchrome\b/gi,
        /\bpanini\b/gi,
        /\btopps\b/gi,
        /\boptic\b/gi,
        /\bselect\b/gi,
        /\bmosaic\b/gi,
        /\brc\b/gi,    // Rookie Card
        /\brookie\b/gi,
        /\brefractor\b/gi,
        /\bauto\b/gi,
        /\bautograph\b/gi,
        /\bpsa\b/gi,
        /\bbgs\b/gi,
        /\bsgc\b/gi,
        /\bbase\b/gi,
        /\bparallel\b/gi,
        /\bsilver\b/gi,
        /\bgold\b/gi,
        /\bred\b/gi,
        /\bblue\b/gi,
        /\bgreen\b/gi,
        /\bpurple\b/gi,
        /\borange\b/gi,
        /\bnumbered\b/gi,
        /\/\d+/g,      // /99, /199, etc.
    ];

    let cleaned = title;
    removePatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, ' ');
    });

    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Take first 2-3 words as player name
    const words = cleaned.split(' ').filter(w => w.length > 1);
    return words.slice(0, 3).join(' ');
};

export default { matchCard };
