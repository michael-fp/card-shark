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

    // Full team names with city for better matching (maps to display name and sport)
    const fullTeamNames = {
        // NHL
        'detroit red wings': { display: 'Detroit Red Wings', sport: 'Hockey' },
        'boston bruins': { display: 'Boston Bruins', sport: 'Hockey' },
        'chicago blackhawks': { display: 'Chicago Blackhawks', sport: 'Hockey' },
        'montreal canadiens': { display: 'Montreal Canadiens', sport: 'Hockey' },
        'toronto maple leafs': { display: 'Toronto Maple Leafs', sport: 'Hockey' },
        'new york rangers': { display: 'New York Rangers', sport: 'Hockey' },
        'pittsburgh penguins': { display: 'Pittsburgh Penguins', sport: 'Hockey' },
        'philadelphia flyers': { display: 'Philadelphia Flyers', sport: 'Hockey' },
        'edmonton oilers': { display: 'Edmonton Oilers', sport: 'Hockey' },
        'colorado avalanche': { display: 'Colorado Avalanche', sport: 'Hockey' },
        'tampa bay lightning': { display: 'Tampa Bay Lightning', sport: 'Hockey' },
        'vegas golden knights': { display: 'Vegas Golden Knights', sport: 'Hockey' },
        'carolina hurricanes': { display: 'Carolina Hurricanes', sport: 'Hockey' },
        'washington capitals': { display: 'Washington Capitals', sport: 'Hockey' },
        'florida panthers': { display: 'Florida Panthers', sport: 'Hockey' },
        // MLB
        'boston red sox': { display: 'Boston Red Sox', sport: 'Baseball' },
        'new york yankees': { display: 'New York Yankees', sport: 'Baseball' },
        'los angeles dodgers': { display: 'Los Angeles Dodgers', sport: 'Baseball' },
        'chicago cubs': { display: 'Chicago Cubs', sport: 'Baseball' },
        'san francisco giants': { display: 'San Francisco Giants', sport: 'Baseball' },
        'st. louis cardinals': { display: 'St. Louis Cardinals', sport: 'Baseball' },
        'atlanta braves': { display: 'Atlanta Braves', sport: 'Baseball' },
        'houston astros': { display: 'Houston Astros', sport: 'Baseball' },
        'philadelphia phillies': { display: 'Philadelphia Phillies', sport: 'Baseball' },
        'texas rangers': { display: 'Texas Rangers', sport: 'Baseball' },
        'new york mets': { display: 'New York Mets', sport: 'Baseball' },
        'chicago white sox': { display: 'Chicago White Sox', sport: 'Baseball' },
        // NBA
        'los angeles lakers': { display: 'Los Angeles Lakers', sport: 'Basketball' },
        'boston celtics': { display: 'Boston Celtics', sport: 'Basketball' },
        'chicago bulls': { display: 'Chicago Bulls', sport: 'Basketball' },
        'golden state warriors': { display: 'Golden State Warriors', sport: 'Basketball' },
        'miami heat': { display: 'Miami Heat', sport: 'Basketball' },
        'san antonio spurs': { display: 'San Antonio Spurs', sport: 'Basketball' },
        'milwaukee bucks': { display: 'Milwaukee Bucks', sport: 'Basketball' },
        'phoenix suns': { display: 'Phoenix Suns', sport: 'Basketball' },
        'dallas mavericks': { display: 'Dallas Mavericks', sport: 'Basketball' },
        'brooklyn nets': { display: 'Brooklyn Nets', sport: 'Basketball' },
        'denver nuggets': { display: 'Denver Nuggets', sport: 'Basketball' },
        // NFL
        'dallas cowboys': { display: 'Dallas Cowboys', sport: 'Football' },
        'new england patriots': { display: 'New England Patriots', sport: 'Football' },
        'green bay packers': { display: 'Green Bay Packers', sport: 'Football' },
        'pittsburgh steelers': { display: 'Pittsburgh Steelers', sport: 'Football' },
        'kansas city chiefs': { display: 'Kansas City Chiefs', sport: 'Football' },
        'san francisco 49ers': { display: 'San Francisco 49ers', sport: 'Football' },
        'philadelphia eagles': { display: 'Philadelphia Eagles', sport: 'Football' },
        'buffalo bills': { display: 'Buffalo Bills', sport: 'Football' },
        'baltimore ravens': { display: 'Baltimore Ravens', sport: 'Football' },
    };

    // Function to find best team match from a string, returns { team, sport, score }
    const findBestTeamMatch = (inputStr) => {
        if (!inputStr) return null;
        const input = inputStr.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [teamKey, info] of Object.entries(fullTeamNames)) {
            // Check if input contains the full team name (best match)
            if (input.includes(teamKey)) {
                const score = teamKey.length; // Longer match = better score
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { team: info.display, sport: info.sport, score };
                }
            }
            // Check if team name contains input (partial match)
            else if (teamKey.includes(input) && input.length > 3) {
                const score = input.length * 0.8; // Slightly lower score for partial
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { team: info.display, sport: info.sport, score };
                }
            }
        }
        return bestMatch;
    };

    // Find best match from OCR text
    const ocrMatch = findBestTeamMatch(text);

    // Find best match from logos
    let logoMatch = null;
    if (logos && logos.length > 0) {
        for (const logo of logos) {
            const match = findBestTeamMatch(logo);
            if (match && (!logoMatch || match.score > logoMatch.score)) {
                logoMatch = match;
            }
        }
    }

    // Compare OCR and logo matches, pick the one with highest score
    let bestTeamMatch = null;
    if (ocrMatch && logoMatch) {
        bestTeamMatch = ocrMatch.score >= logoMatch.score ? ocrMatch : logoMatch;
        console.log(`🏆 Team match: OCR score=${ocrMatch.score}, Logo score=${logoMatch.score}, Using: ${bestTeamMatch.team}`);
    } else {
        bestTeamMatch = logoMatch || ocrMatch;
    }

    // Apply the best team match
    if (bestTeamMatch) {
        detectedTeam = bestTeamMatch.team;
        if (sport === 'Unknown') {
            sport = bestTeamMatch.sport;
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
