import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Demo card data
const DEMO_CARDS = [
    {
        id: 'demo-1',
        image_path: '/api/demo/images/mahomes.jpg',
        description: 'Rookie card in excellent condition, PSA 10 gem mint',
        sport: 'Football',
        year: 2017,
        player_name: 'Patrick Mahomes',
        team: 'Kansas City Chiefs',
        card_number: '327',
        card_set: 'Panini Prizm',
        grade: 10,
        value: 8500.00,
        purchase_price: 450.00,
        is_wishlist: false,
        ebay_item_id: null,
        created_at: '2024-06-15T10:30:00Z',
        updated_at: '2024-12-01T14:20:00Z',
    },
    {
        id: 'demo-2',
        image_path: '/api/demo/images/jordan.jpg',
        description: 'Iconic rookie card, well-centered',
        sport: 'Basketball',
        year: 1986,
        player_name: 'Michael Jordan',
        team: 'Chicago Bulls',
        card_number: '57',
        card_set: 'Fleer',
        grade: 8,
        value: 45000.00,
        purchase_price: 12000.00,
        is_wishlist: false,
    },
    {
        id: 'demo-3',
        image_path: '/api/demo/images/trout.jpg',
        description: 'Chrome refractor, serial numbered /250',
        sport: 'Baseball',
        year: 2011,
        player_name: 'Mike Trout',
        team: 'Los Angeles Angels',
        card_number: '175',
        card_set: 'Topps Chrome',
        grade: 9.5,
        value: 6800.00,
        purchase_price: 1200.00,
        is_wishlist: false,
    },
    {
        id: 'demo-4',
        image_path: '/api/demo/images/ohtani.jpg',
        description: 'First Bowman Chrome Auto, rising star',
        sport: 'Baseball',
        year: 2018,
        player_name: 'Shohei Ohtani',
        team: 'Los Angeles Angels',
        card_number: 'BCP1',
        card_set: 'Bowman Chrome',
        grade: 9,
        value: 2500.00,
        purchase_price: 800.00,
        is_wishlist: false,
    },
    {
        id: 'demo-5',
        image_path: '/api/demo/images/curry.jpg',
        description: 'National Treasures patch auto, /99',
        sport: 'Basketball',
        year: 2009,
        player_name: 'Stephen Curry',
        team: 'Golden State Warriors',
        card_number: '206',
        card_set: 'National Treasures',
        grade: 9,
        value: 15000.00,
        purchase_price: 3500.00,
        is_wishlist: false,
    },
    {
        id: 'demo-6',
        image_path: '/api/demo/images/mcdavid.jpg',
        description: 'Young Guns RC, future HOF',
        sport: 'Hockey',
        year: 2015,
        player_name: 'Connor McDavid',
        team: 'Edmonton Oilers',
        card_number: '201',
        card_set: 'Upper Deck',
        grade: 10,
        value: 3200.00,
        purchase_price: 500.00,
        is_wishlist: false,
    },
    {
        id: 'demo-7',
        image_path: '/api/demo/images/burrow.jpg',
        description: 'Mosaic Prizm RC, sharp corners',
        sport: 'Football',
        year: 2020,
        player_name: 'Joe Burrow',
        team: 'Cincinnati Bengals',
        card_number: '201',
        card_set: 'Panini Mosaic',
        grade: 9.5,
        value: 650.00,
        purchase_price: 125.00,
        is_wishlist: false,
    },
    {
        id: 'demo-8',
        image_path: '/api/demo/images/wembanyama.jpg',
        description: 'Rated Rookie, first NBA card',
        sport: 'Basketball',
        year: 2023,
        player_name: 'Victor Wembanyama',
        team: 'San Antonio Spurs',
        card_number: '201',
        card_set: 'Donruss',
        grade: null,
        value: 180.00,
        purchase_price: 50.00,
        is_wishlist: false,
    },
    {
        id: 'demo-9',
        image_path: '/api/demo/images/gretzky.jpg',
        description: 'The Great One, iconic vintage card',
        sport: 'Hockey',
        year: 1979,
        player_name: 'Wayne Gretzky',
        team: 'Edmonton Oilers',
        card_number: '18',
        card_set: 'O-Pee-Chee',
        grade: 7,
        value: 25000.00,
        purchase_price: 8000.00,
        is_wishlist: false,
    },
    {
        id: 'demo-10',
        image_path: '/api/demo/images/jeter.jpg',
        description: 'SP Foil rookie, Captain Clutch',
        sport: 'Baseball',
        year: 1993,
        player_name: 'Derek Jeter',
        team: 'New York Yankees',
        card_number: '279',
        card_set: 'SP',
        grade: 8.5,
        value: 4200.00,
        purchase_price: 1500.00,
        is_wishlist: false,
    },
    {
        id: 'demo-11',
        image_path: '/api/demo/images/brady.jpg',
        description: 'Contenders RC Auto, GOAT signature',
        sport: 'Football',
        year: 2000,
        player_name: 'Tom Brady',
        team: 'New England Patriots',
        card_number: '144',
        card_set: 'Contenders',
        grade: 9,
        value: 85000.00,
        purchase_price: 15000.00,
        is_wishlist: false,
    },
    {
        id: 'demo-12',
        image_path: '/api/demo/images/lebron.jpg',
        description: 'Chrome RC, King James rookie',
        sport: 'Basketball',
        year: 2003,
        player_name: 'LeBron James',
        team: 'Cleveland Cavaliers',
        card_number: '111',
        card_set: 'Topps Chrome',
        grade: 9.5,
        value: 55000.00,
        purchase_price: 8500.00,
        is_wishlist: false,
    },
];

// Placeholder SVG generator for demo cards
function generateCardSvg(playerName, sport, team, grade, year) {
    const sportColors = {
        'Football': { bg: '#2d5016', accent: '#4ade80' },
        'Basketball': { bg: '#7c2d12', accent: '#fb923c' },
        'Baseball': { bg: '#1e3a5f', accent: '#60a5fa' },
        'Hockey': { bg: '#312e81', accent: '#a78bfa' },
    };

    const colors = sportColors[sport] || { bg: '#374151', accent: '#9ca3af' };

    return `
<svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.1" />
      <stop offset="50%" style="stop-color:white;stop-opacity:0" />
      <stop offset="100%" style="stop-color:white;stop-opacity:0.05" />
    </linearGradient>
  </defs>
  
  <!-- Card background -->
  <rect width="300" height="420" rx="12" fill="url(#cardGrad)"/>
  
  <!-- Border -->
  <rect x="8" y="8" width="284" height="404" rx="8" fill="none" stroke="${colors.accent}" stroke-width="2" opacity="0.5"/>
  
  <!-- Top banner -->
  <rect x="15" y="15" width="270" height="40" rx="4" fill="${colors.accent}" opacity="0.2"/>
  <text x="150" y="42" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${colors.accent}" text-anchor="middle">${year} ${sport.toUpperCase()}</text>
  
  <!-- Player silhouette area -->
  <rect x="30" y="70" width="240" height="200" rx="8" fill="rgba(0,0,0,0.4)"/>
  <circle cx="150" cy="150" r="60" fill="rgba(255,255,255,0.1)"/>
  <text x="150" y="165" font-family="Arial, sans-serif" font-size="60" fill="rgba(255,255,255,0.3)" text-anchor="middle">🏆</text>
  
  <!-- Player name -->
  <text x="150" y="310" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${playerName}</text>
  
  <!-- Team -->
  <text x="150" y="340" font-family="Arial, sans-serif" font-size="14" fill="${colors.accent}" text-anchor="middle">${team}</text>
  
  <!-- Grade badge -->
  ${grade ? `
  <circle cx="260" cy="380" r="25" fill="${colors.accent}"/>
  <text x="260" y="386" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${grade}</text>
  ` : ''}
  
  <!-- Shine overlay -->
  <rect width="300" height="420" rx="12" fill="url(#shine)"/>
</svg>`;
}

// Serve demo card images
router.get('/images/:name', (req, res) => {
    const { name } = req.params;
    const baseName = name.replace('.jpg', '').replace('.png', '');

    // Find the card data
    const card = DEMO_CARDS.find(c => c.image_path.includes(baseName));

    if (card) {
        const svg = generateCardSvg(
            card.player_name,
            card.sport,
            card.team,
            card.grade,
            card.year
        );

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } else {
        // Generic placeholder
        const svg = generateCardSvg('Demo Card', 'Football', 'Demo Team', null, 2024);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    }
});

// Get demo cards
router.get('/cards', (req, res) => {
    const { isWishlist, sport, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let cards = [...DEMO_CARDS];

    // Filter by wishlist
    if (isWishlist === 'true') {
        cards = cards.filter(c => c.is_wishlist);
    } else if (isWishlist === 'false') {
        cards = cards.filter(c => !c.is_wishlist);
    }

    // Filter by sport
    if (sport) {
        cards = cards.filter(c => c.sport === sport);
    }

    // Search
    if (search) {
        const searchLower = search.toLowerCase();
        cards = cards.filter(c =>
            c.player_name.toLowerCase().includes(searchLower) ||
            c.team.toLowerCase().includes(searchLower) ||
            c.card_set.toLowerCase().includes(searchLower)
        );
    }

    // Sort
    cards.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (typeof aVal === 'string') {
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    res.json({
        cards,
        total: cards.length,
        page: 1,
        limit: cards.length,
    });
});

// Get demo stats
router.get('/stats', (req, res) => {
    const cards = DEMO_CARDS.filter(c => !c.is_wishlist);

    const totalValue = cards.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalCost = cards.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
    const profit = totalValue - totalCost;

    const gradedCards = cards.filter(c => c.grade);
    const avgGrade = gradedCards.length > 0
        ? gradedCards.reduce((sum, c) => sum + c.grade, 0) / gradedCards.length
        : 0;

    // By sport
    const sportMap = new Map();
    cards.forEach(c => {
        const existing = sportMap.get(c.sport) || { count: 0, totalValue: 0 };
        sportMap.set(c.sport, {
            count: existing.count + 1,
            totalValue: existing.totalValue + (c.value || 0),
        });
    });
    const bySport = Array.from(sportMap.entries()).map(([sport, data]) => ({
        sport,
        ...data,
    }));

    // By grade
    const gradeMap = new Map();
    gradedCards.forEach(c => {
        const grade = Math.floor(c.grade);
        gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
    });
    const byGrade = Array.from(gradeMap.entries()).map(([grade, count]) => ({
        grade,
        count,
    })).sort((a, b) => a.grade - b.grade);

    // By year
    const yearMap = new Map();
    cards.forEach(c => {
        if (c.year) {
            const existing = yearMap.get(c.year) || { count: 0, totalValue: 0 };
            yearMap.set(c.year, {
                count: existing.count + 1,
                totalValue: existing.totalValue + (c.value || 0),
            });
        }
    });
    const byYear = Array.from(yearMap.entries()).map(([year, data]) => ({
        year,
        ...data,
    })).sort((a, b) => b.year - a.year);

    res.json({
        overview: {
            totalCards: cards.length,
            totalValue,
            totalCost,
            profit,
            profitPercent: totalCost > 0 ? (profit / totalCost) * 100 : 0,
            avgGrade,
            avgValue: cards.length > 0 ? totalValue / cards.length : 0,
            wishlistCount: DEMO_CARDS.filter(c => c.is_wishlist).length,
        },
        bySport,
        byGrade,
        byYear,
        topCards: cards.sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
        recentCards: cards.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5),
    });
});

export default router;
