import type { Card, CollectionStats, User } from '../types';

// Demo card data with real card images
export const DEMO_CARDS: Card[] = [
    // Football Cards
    {
        id: 'demo-1',
        player_name: 'Patrick Mahomes',
        year: 2017,
        card_set: 'Panini Prizm',
        card_number: '269',
        team: 'Kansas City Chiefs',
        sport: 'Football',
        grade: 10,
        purchase_price: 8500,
        value: 45000,
        image_path: '/api/demo/images/mahomes.jpg',
        description: 'MVP Rookie Card - Gem Mint 10',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-15T12:00:00Z',
        updated_at: '2024-01-15T12:00:00Z'
    },
    {
        id: 'demo-2',
        player_name: 'Tom Brady',
        year: 2000,
        card_set: 'Playoff Contenders',
        card_number: '144',
        team: 'New England Patriots',
        sport: 'Football',
        grade: 9,
        purchase_price: 15000,
        value: 85000,
        image_path: '/api/demo/images/brady.jpg',
        description: 'Championship Ticket Auto RC - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-16T12:00:00Z',
        updated_at: '2024-01-16T12:00:00Z'
    },
    {
        id: 'demo-3',
        player_name: 'Joe Burrow',
        year: 2020,
        card_set: 'Panini Mosaic',
        card_number: '261',
        team: 'Cincinnati Bengals',
        sport: 'Football',
        grade: 9.5,
        purchase_price: 450,
        value: 1200,
        image_path: '/api/demo/images/burrow.jpg',
        description: 'Heisman Winner Mosaic Prizm - PSA 9.5',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-17T12:00:00Z'
    },
    {
        id: 'demo-4',
        player_name: 'Travis Kelce',
        year: 2013,
        card_set: 'Topps Chrome',
        card_number: '238',
        team: 'Kansas City Chiefs',
        sport: 'Football',
        grade: 10,
        purchase_price: 200,
        value: 850,
        image_path: '/api/demo/images/kelce.jpg',
        description: 'Chrome Refractor RC - Gem Mint 10',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-02-01T12:00:00Z',
        updated_at: '2024-02-01T12:00:00Z'
    },

    // Basketball Cards
    {
        id: 'demo-5',
        player_name: 'Michael Jordan',
        year: 1986,
        card_set: 'Fleer',
        card_number: '57',
        team: 'Chicago Bulls',
        sport: 'Basketball',
        grade: 9,
        purchase_price: 12000,
        value: 42000,
        image_path: '/api/demo/images/jordan.jpg',
        description: 'The GOAT Rookie Card - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-18T12:00:00Z',
        updated_at: '2024-01-18T12:00:00Z'
    },
    {
        id: 'demo-6',
        player_name: 'LeBron James',
        year: 2003,
        card_set: 'Topps Chrome',
        card_number: '111',
        team: 'Cleveland Cavaliers',
        sport: 'Basketball',
        grade: 9.5,
        purchase_price: 8500,
        value: 35000,
        image_path: '/api/demo/images/lebron.jpg',
        description: 'Refractor Rookie Card - PSA 9.5',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-19T12:00:00Z',
        updated_at: '2024-01-19T12:00:00Z'
    },
    {
        id: 'demo-7',
        player_name: 'Stephen Curry',
        year: 2009,
        card_set: 'Panini National Treasures',
        card_number: '106',
        team: 'Golden State Warriors',
        sport: 'Basketball',
        grade: 9,
        purchase_price: 5000,
        value: 18500,
        image_path: '/api/demo/images/curry.jpg',
        description: 'Patch Auto RC /99 - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-20T12:00:00Z',
        updated_at: '2024-01-20T12:00:00Z'
    },
    {
        id: 'demo-8',
        player_name: 'Victor Wembanyama',
        year: 2023,
        card_set: 'Donruss Rated Rookie',
        card_number: '1',
        team: 'San Antonio Spurs',
        sport: 'Basketball',
        grade: null,
        purchase_price: 150,
        value: 380,
        image_path: '/api/demo/images/wembanyama.jpg',
        description: 'Raw - To Be Graded',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-21T12:00:00Z',
        updated_at: '2024-01-21T12:00:00Z'
    },
    {
        id: 'demo-9',
        player_name: 'Jayson Tatum',
        year: 2017,
        card_set: 'Panini Prizm',
        card_number: '25',
        team: 'Boston Celtics',
        sport: 'Basketball',
        grade: 9.5,
        purchase_price: 600,
        value: 2200,
        image_path: '/api/demo/images/tatum.jpg',
        description: 'Silver Prizm RC - PSA 9.5',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-02-02T12:00:00Z',
        updated_at: '2024-02-02T12:00:00Z'
    },

    // Baseball Cards
    {
        id: 'demo-10',
        player_name: 'Mike Trout',
        year: 2011,
        card_set: 'Topps Update',
        card_number: 'US175',
        team: 'Los Angeles Angels',
        sport: 'Baseball',
        grade: 10,
        purchase_price: 3500,
        value: 12000,
        image_path: '/api/demo/images/trout.jpg',
        description: 'Gem Mint 10 - Low Pop',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-22T12:00:00Z',
        updated_at: '2024-01-22T12:00:00Z'
    },
    {
        id: 'demo-11',
        player_name: 'Shohei Ohtani',
        year: 2018,
        card_set: 'Bowman Chrome',
        card_number: 'RC1',
        team: 'Los Angeles Angels',
        sport: 'Baseball',
        grade: 9,
        purchase_price: 800,
        value: 2800,
        image_path: '/api/demo/images/ohtani.jpg',
        description: 'Japanese Rising Star RC - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-23T12:00:00Z',
        updated_at: '2024-01-23T12:00:00Z'
    },
    {
        id: 'demo-12',
        player_name: 'Derek Jeter',
        year: 1993,
        card_set: 'SP Foil',
        card_number: '279',
        team: 'New York Yankees',
        sport: 'Baseball',
        grade: 8.5,
        purchase_price: 1200,
        value: 4500,
        image_path: '/api/demo/images/jeter.jpg',
        description: 'Captain Clutch Vintage RC - PSA 8.5',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-24T12:00:00Z',
        updated_at: '2024-01-24T12:00:00Z'
    },
    {
        id: 'demo-13',
        player_name: 'Ronald Acuña Jr.',
        year: 2018,
        card_set: 'Topps Update',
        card_number: 'US250',
        team: 'Atlanta Braves',
        sport: 'Baseball',
        grade: 9,
        purchase_price: 350,
        value: 1100,
        image_path: '/api/demo/images/acuna.jpg',
        description: 'Bat Down Photo Variation - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-02-03T12:00:00Z',
        updated_at: '2024-02-03T12:00:00Z'
    },

    // Hockey Cards
    {
        id: 'demo-14',
        player_name: 'Wayne Gretzky',
        year: 1979,
        card_set: 'O-Pee-Chee',
        card_number: '18',
        team: 'Edmonton Oilers',
        sport: 'Hockey',
        grade: 7,
        purchase_price: 8000,
        value: 25000,
        image_path: '/api/demo/images/gretzky.jpg',
        description: 'The Great One - Vintage RC - PSA 7',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-25T12:00:00Z',
        updated_at: '2024-01-25T12:00:00Z'
    },
    {
        id: 'demo-15',
        player_name: 'Connor McDavid',
        year: 2015,
        card_set: 'Upper Deck Young Guns',
        card_number: '201',
        team: 'Edmonton Oilers',
        sport: 'Hockey',
        grade: 10,
        purchase_price: 2000,
        value: 8500,
        image_path: '/api/demo/images/mcdavid.jpg',
        description: 'Young Guns RC - Gem Mint 10',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-26T12:00:00Z',
        updated_at: '2024-01-26T12:00:00Z'
    },
    {
        id: 'demo-16',
        player_name: 'Sidney Crosby',
        year: 2005,
        card_set: 'Upper Deck Young Guns',
        card_number: '720',
        team: 'Pittsburgh Penguins',
        sport: 'Hockey',
        grade: 9,
        purchase_price: 1500,
        value: 5200,
        image_path: '/api/demo/images/crosby.jpg',
        description: 'Sid the Kid Rookie - PSA 9',
        is_wishlist: false,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-02-04T12:00:00Z',
        updated_at: '2024-02-04T12:00:00Z'
    },

    // Wishlist Items (cards to acquire)
    {
        id: 'demo-wishlist-1',
        player_name: 'Luka Dončić',
        year: 2018,
        card_set: 'Panini Prizm',
        card_number: '280',
        team: 'Dallas Mavericks',
        sport: 'Basketball',
        grade: null,
        purchase_price: null,
        value: 8500,
        image_path: '',
        description: 'Target: PSA 10 Silver Prizm RC',
        is_wishlist: true,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-27T12:00:00Z',
        updated_at: '2024-01-27T12:00:00Z'
    },
    {
        id: 'demo-wishlist-2',
        player_name: 'Ken Griffey Jr.',
        year: 1989,
        card_set: 'Upper Deck',
        card_number: '1',
        team: 'Seattle Mariners',
        sport: 'Baseball',
        grade: null,
        purchase_price: null,
        value: 2500,
        image_path: '',
        description: 'The Kid - Looking for PSA 9+',
        is_wishlist: true,
        is_favorite: false,
        ebay_item_id: null,
        created_at: '2024-01-28T12:00:00Z',
        updated_at: '2024-01-28T12:00:00Z'
    }
];

// Demo usage data
export const DEMO_USAGE = {
    api_calls_today: 15,
    api_calls_limit: 100,
    uploads_today: 3,
    uploads_limit: 20,
    last_reset: new Date().toISOString()
};

// Demo user data
export const DEMO_USER: User = {
    id: 'demo-user',
    email: 'demo@cardshark.com',
    name: 'Demo Collector',
    avatarUrl: null
};

// Calculate demo stats dynamically from demo cards (excluding wishlist)
export function calculateDemoStats(cards: Card[]): CollectionStats {
    const ownedCards = cards.filter(c => !c.is_wishlist);

    const totalValue = ownedCards.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalCost = ownedCards.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
    const profit = totalValue - totalCost;

    const gradedCards = ownedCards.filter(c => c.grade !== null);
    const avgGrade = gradedCards.length > 0
        ? gradedCards.reduce((sum, c) => sum + (c.grade || 0), 0) / gradedCards.length
        : 0;
    const avgValue = ownedCards.length > 0 ? totalValue / ownedCards.length : 0;

    // Group by sport
    const sportMap = new Map<string, { count: number; totalValue: number }>();
    ownedCards.forEach(card => {
        if (card.sport) {
            const existing = sportMap.get(card.sport) || { count: 0, totalValue: 0 };
            sportMap.set(card.sport, {
                count: existing.count + 1,
                totalValue: existing.totalValue + (card.value || 0)
            });
        }
    });
    const bySport = Array.from(sportMap.entries()).map(([sport, data]) => ({
        sport,
        count: data.count,
        totalValue: data.totalValue
    }));

    // Group by grade
    const gradeMap = new Map<number, number>();
    gradedCards.forEach(card => {
        if (card.grade !== null) {
            const gradeKey = Math.floor(card.grade);
            gradeMap.set(gradeKey, (gradeMap.get(gradeKey) || 0) + 1);
        }
    });
    const byGrade = Array.from(gradeMap.entries())
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => b.grade - a.grade);

    // Group by year
    const yearMap = new Map<number, { count: number; totalValue: number }>();
    ownedCards.forEach(card => {
        if (card.year) {
            const existing = yearMap.get(card.year) || { count: 0, totalValue: 0 };
            yearMap.set(card.year, {
                count: existing.count + 1,
                totalValue: existing.totalValue + (card.value || 0)
            });
        }
    });
    const byYear = Array.from(yearMap.entries())
        .map(([year, data]) => ({ year, count: data.count, totalValue: data.totalValue }))
        .sort((a, b) => b.year - a.year);

    // Top cards by value
    const topCards = [...ownedCards]
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5);

    // Recent cards
    const recentCards = [...ownedCards]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return {
        overview: {
            totalCards: ownedCards.length,
            totalValue,
            totalCost,
            profit,
            profitPercent: totalCost > 0 ? (profit / totalCost) * 100 : 0,
            avgGrade: Math.round(avgGrade * 10) / 10,
            avgValue: Math.round(avgValue),
            wishlistCount: cards.filter(c => c.is_wishlist).length
        },
        bySport,
        byGrade,
        byYear,
        topCards,
        recentCards
    };
}

// Initial demo stats
export const DEMO_STATS: CollectionStats = calculateDemoStats(DEMO_CARDS);
