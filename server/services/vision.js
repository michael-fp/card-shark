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

    // Known team names for sport detection
    const nbaTeams = ['spurs', 'lakers', 'celtics', 'warriors', 'heat', 'bulls', 'nets', 'knicks', 'suns', 'mavericks', 'nuggets', 'clippers', 'bucks', 'sixers', '76ers', 'raptors', 'thunder', 'jazz', 'blazers', 'kings', 'pelicans', 'grizzlies', 'hawks', 'hornets', 'magic', 'pacers', 'pistons', 'cavaliers', 'timberwolves', 'rockets', 'wizards'];
    const nflTeams = ['chiefs', 'eagles', 'cowboys', 'bills', 'dolphins', 'patriots', 'jets', 'ravens', 'bengals', 'browns', 'steelers', 'texans', 'colts', 'jaguars', 'titans', 'broncos', 'chargers', 'raiders', 'seahawks', '49ers', 'cardinals', 'rams', 'bears', 'lions', 'packers', 'vikings', 'falcons', 'panthers', 'saints', 'buccaneers', 'commanders', 'giants'];
    const mlbTeams = ['yankees', 'red sox', 'dodgers', 'cubs', 'giants', 'cardinals', 'braves', 'mets', 'phillies', 'astros', 'rangers', 'padres', 'mariners', 'angels', 'athletics', 'twins', 'brewers', 'reds', 'pirates', 'tigers', 'indians', 'guardians', 'royals', 'white sox', 'orioles', 'blue jays', 'rays', 'marlins', 'nationals', 'rockies', 'diamondbacks'];
    const nhlTeams = ['bruins', 'canadiens', 'maple leafs', 'blackhawks', 'red wings', 'rangers', 'flyers', 'penguins', 'capitals', 'lightning', 'panthers', 'hurricanes', 'blue jackets', 'devils', 'islanders', 'senators', 'sabres', 'jets', 'predators', 'blues', 'stars', 'avalanche', 'wild', 'oilers', 'flames', 'canucks', 'kraken', 'sharks', 'kings', 'ducks', 'coyotes', 'golden knights'];

    // Detect sport (check logos first, then keywords, then team names)
    let sport = 'Unknown';
    let detectedTeam = null;

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
    } else {
        // Try to detect sport from team names
        const textLower = text.toLowerCase();

        for (const team of nbaTeams) {
            if (textLower.includes(team)) {
                sport = 'Basketball';
                detectedTeam = team.charAt(0).toUpperCase() + team.slice(1);
                break;
            }
        }
        if (sport === 'Unknown') {
            for (const team of nflTeams) {
                if (textLower.includes(team)) {
                    sport = 'Football';
                    detectedTeam = team.charAt(0).toUpperCase() + team.slice(1);
                    break;
                }
            }
        }
        if (sport === 'Unknown') {
            for (const team of mlbTeams) {
                if (textLower.includes(team)) {
                    sport = 'Baseball';
                    detectedTeam = team.charAt(0).toUpperCase() + team.slice(1);
                    break;
                }
            }
        }
        if (sport === 'Unknown') {
            for (const team of nhlTeams) {
                if (textLower.includes(team)) {
                    sport = 'Hockey';
                    detectedTeam = team.charAt(0).toUpperCase() + team.slice(1);
                    break;
                }
            }
        }
    }

    // Extract year (typically 4 digits between 1900-2030)
    const yearMatch = rawText.match(/\b(19[0-9]{2}|20[0-3][0-9])\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract card number (often preceded by # or 'No.')
    const cardNumberMatch = rawText.match(/(?:#|No\.?|Card)\s*(\d+)/i);
    const cardNumber = cardNumberMatch ? cardNumberMatch[1] : null;

    // Extract grade (PSA, BGS, SGC formats)
    let grade = null;
    const gradeMatch = rawText.match(/(?:PSA|BGS|SGC|GEM\s*MT)\s*(\d+(?:\.\d+)?)/i);
    if (gradeMatch) {
        grade = parseFloat(gradeMatch[1]);
    } else if (text.includes('gem mt') || text.includes('gem mint')) {
        grade = 10;
    }

    // Common card brands
    const brands = ['Topps', 'Panini', 'Upper Deck', 'Bowman', 'Fleer', 'Donruss', 'Score'];
    const detectedBrand = brands.find(b => text.includes(b.toLowerCase())) ||
        logos.find(l => brands.some(b => l.includes(b)));

    // Common card sets
    const sets = ['Prizm', 'Chrome', 'Optic', 'Select', 'Mosaic', 'National Treasures', 'Contenders', 'Magicians', 'Allure', 'Finest', 'Heritage', 'Archives', 'Stadium Club'];
    const detectedSet = sets.find(s => text.includes(s.toLowerCase()));

    // Try to extract team from logos (logos often contain full team names like "Detroit Red Wings")
    // Logos are more reliable than OCR text, so always check them and let them override
    if (logos && logos.length > 0) {
        // Map of logo names to team names and sports
        const logoTeamMap = {
            // NHL
            'Detroit Red Wings': { team: 'Red Wings', sport: 'Hockey' },
            'Boston Bruins': { team: 'Bruins', sport: 'Hockey' },
            'Chicago Blackhawks': { team: 'Blackhawks', sport: 'Hockey' },
            'Montreal Canadiens': { team: 'Canadiens', sport: 'Hockey' },
            'Toronto Maple Leafs': { team: 'Maple Leafs', sport: 'Hockey' },
            'New York Rangers': { team: 'Rangers', sport: 'Hockey' },
            'Pittsburgh Penguins': { team: 'Penguins', sport: 'Hockey' },
            'Philadelphia Flyers': { team: 'Flyers', sport: 'Hockey' },
            'Edmonton Oilers': { team: 'Oilers', sport: 'Hockey' },
            'Colorado Avalanche': { team: 'Avalanche', sport: 'Hockey' },
            'Tampa Bay Lightning': { team: 'Lightning', sport: 'Hockey' },
            'Vegas Golden Knights': { team: 'Golden Knights', sport: 'Hockey' },
            // MLB
            'Boston Red Sox': { team: 'Red Sox', sport: 'Baseball' },
            'New York Yankees': { team: 'Yankees', sport: 'Baseball' },
            'Los Angeles Dodgers': { team: 'Dodgers', sport: 'Baseball' },
            'Chicago Cubs': { team: 'Cubs', sport: 'Baseball' },
            'San Francisco Giants': { team: 'Giants', sport: 'Baseball' },
            'St. Louis Cardinals': { team: 'Cardinals', sport: 'Baseball' },
            'Atlanta Braves': { team: 'Braves', sport: 'Baseball' },
            'Houston Astros': { team: 'Astros', sport: 'Baseball' },
            'Philadelphia Phillies': { team: 'Phillies', sport: 'Baseball' },
            'Texas Rangers': { team: 'Rangers', sport: 'Baseball' },
            // NBA
            'Los Angeles Lakers': { team: 'Lakers', sport: 'Basketball' },
            'Boston Celtics': { team: 'Celtics', sport: 'Basketball' },
            'Chicago Bulls': { team: 'Bulls', sport: 'Basketball' },
            'Golden State Warriors': { team: 'Warriors', sport: 'Basketball' },
            'Miami Heat': { team: 'Heat', sport: 'Basketball' },
            'San Antonio Spurs': { team: 'Spurs', sport: 'Basketball' },
            'Milwaukee Bucks': { team: 'Bucks', sport: 'Basketball' },
            'Phoenix Suns': { team: 'Suns', sport: 'Basketball' },
            'Dallas Mavericks': { team: 'Mavericks', sport: 'Basketball' },
            // NFL
            'Dallas Cowboys': { team: 'Cowboys', sport: 'Football' },
            'New England Patriots': { team: 'Patriots', sport: 'Football' },
            'Green Bay Packers': { team: 'Packers', sport: 'Football' },
            'Pittsburgh Steelers': { team: 'Steelers', sport: 'Football' },
            'Kansas City Chiefs': { team: 'Chiefs', sport: 'Football' },
            'San Francisco 49ers': { team: '49ers', sport: 'Football' },
            'Philadelphia Eagles': { team: 'Eagles', sport: 'Football' },
        };

        for (const logo of logos) {
            // Check for exact match first
            if (logoTeamMap[logo]) {
                detectedTeam = logoTeamMap[logo].team;
                if (sport === 'Unknown') {
                    sport = logoTeamMap[logo].sport;
                }
                break;
            }

            // Try partial match - logo might contain team name
            for (const [logoName, info] of Object.entries(logoTeamMap)) {
                if (logo.toLowerCase().includes(logoName.toLowerCase()) ||
                    logoName.toLowerCase().includes(logo.toLowerCase())) {
                    detectedTeam = info.team;
                    if (sport === 'Unknown') {
                        sport = info.sport;
                    }
                    break;
                }
            }
            if (detectedTeam) break;
        }
    }

    // Extract player name - look for lines that look like names (2+ capital words)
    let playerName = null;

    // Filter out common non-name lines
    const nonNamePatterns = [
        /^\d+$/, // Just numbers
        /^#\d+/, // Card numbers
        /^psa|bgs|sgc|gem|mt|mint/i, // Grades
        /^rc$|^rookie$/i, // RC labels
        /^\d{4}$/, // Years
        /^topps|panini|upper|bowman|fleer|donruss|score|prizm|chrome|optic|select|mosaic/i, // Brands
    ];

    for (const line of lines) {
        // Skip short lines or lines matching non-name patterns
        if (line.length < 3) continue;
        if (nonNamePatterns.some(p => p.test(line))) continue;

        // Look for lines that look like player names (mostly uppercase, 2+ parts)
        const words = line.split(/\s+/);
        const isLikelyName = words.length >= 2 &&
            words.every(w => /^[A-Z][A-Za-z'-]*$/.test(w) || /^[A-Z]+$/.test(w)) &&
            !brands.some(b => line.toLowerCase().includes(b.toLowerCase())) &&
            line.length > 5 && line.length < 50;

        if (isLikelyName) {
            // Title case the name
            playerName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            break;
        }
    }

    // Build search query (use first few meaningful lines)
    const meaningfulLines = lines
        .filter(l => l.length > 2 && !l.match(/^\d+$/))
        .slice(0, 5);

    // Combine brand and cardSet for display (e.g., "Donruss Magicians", "Topps Chrome")
    let combinedCardSet = null;
    if (detectedBrand && detectedSet) {
        // Only combine if they're different
        if (detectedBrand.toLowerCase() !== detectedSet.toLowerCase()) {
            combinedCardSet = `${detectedBrand} ${detectedSet}`;
        } else {
            combinedCardSet = detectedBrand;
        }
    } else {
        combinedCardSet = detectedSet || detectedBrand || null;
    }

    return {
        rawText: rawText.substring(0, 500), // Truncate for storage
        playerName,
        sport,
        team: detectedTeam,
        year,
        cardNumber,
        grade,
        brand: detectedBrand,
        cardSet: combinedCardSet,
        searchQuery: meaningfulLines.join(' ').substring(0, 200),
        logos,
    };
};

export default { extractCardText };
