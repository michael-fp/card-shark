// Card types
export interface Card {
    id: string;
    image_path: string;
    description: string | null;
    sport: string;
    year: number | null;
    player_name: string;
    team: string | null;
    card_number: string | null;
    card_set: string | null;
    grade: number | null;
    value: number | null;
    purchase_price: number | null;
    is_wishlist: boolean;
    ebay_item_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CardFormData {
    imagePath: string;
    description?: string;
    sport: string;
    year?: number;
    playerName: string;
    team?: string;
    cardNumber?: string;
    cardSet?: string;
    grade?: number;
    value?: number;
    purchasePrice?: number;
    isWishlist?: boolean;
    ebayItemId?: string;
}

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
}

// Auth types
export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Stats types
export interface CollectionStats {
    overview: {
        totalCards: number;
        totalValue: number;
        totalCost: number;
        profit: number;
        profitPercent: number;
        avgGrade: number;
        avgValue: number;
        wishlistCount: number;
    };
    bySport: Array<{
        sport: string;
        count: number;
        totalValue: number;
    }>;
    byGrade: Array<{
        grade: number;
        count: number;
    }>;
    byYear: Array<{
        year: number;
        count: number;
        totalValue: number;
    }>;
    topCards: Card[];
    recentCards: Card[];
}

// Alert types
export interface PriceAlert {
    id: string;
    target_price: number;
    direction: 'above' | 'below';
    is_triggered: boolean;
    triggered_at: string | null;
    created_at: string;
    card_id: string;
    player_name: string;
    team: string | null;
    year: number | null;
    current_value: number | null;
    image_path: string;
}

// Filter types
export interface CardFilters {
    sport?: string;
    year?: number;
    team?: string;
    player?: string;
    gradeMin?: number;
    gradeMax?: number;
    valueMin?: number;
    valueMax?: number;
    isWishlist?: boolean;
    sort?: 'created_at' | 'updated_at' | 'player_name' | 'value' | 'grade' | 'year';
    order?: 'asc' | 'desc';
}

// API response types
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// Card match types
export interface CardMatch {
    matched: boolean;
    confidence: number;
    matchedCard?: {
        playerName: string;
        sport: string;
        year: number | null;
        team: string | null;
        cardNumber: string | null;
        cardSet: string | null;
        value: number;
        ebayItemId: string;
        ebayTitle: string;
        ebayImageUrl: string;
    };
    extractedData: {
        playerName?: string | null;
        sport: string;
        team?: string | null;
        year: number | null;
        cardNumber: string | null;
        grade?: number | null;
        brand: string | null;
        cardSet: string | null;
        rawText?: string;
    };
    suggestions: Array<{
        title: string;
        price: number;
        imageUrl: string;
        score: number;
        matches: string[];
        ebayItemId: string;
    }>;
}

// Upload response
export interface UploadResponse {
    success: boolean;
    imagePath: string;
    imageSize: number;
    storageWarning: boolean;
    match: CardMatch | null;
}
