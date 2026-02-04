/**
 * Unit tests for Card type and utilities
 */

import { describe, it, expect } from 'vitest';

// Test card utility functions
describe('Card Utilities', () => {
    describe('Card Value Formatting', () => {
        it('should format currency values correctly', () => {
            const formatCurrency = (value: number): string => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(value);
            };

            expect(formatCurrency(1234.56)).toBe('$1,234.56');
            expect(formatCurrency(0)).toBe('$0.00');
            expect(formatCurrency(1000000)).toBe('$1,000,000.00');
        });

        it('should calculate profit/loss correctly', () => {
            const calculateProfit = (currentValue: number, purchasePrice: number): number => {
                return currentValue - purchasePrice;
            };

            const calculateProfitPercent = (currentValue: number, purchasePrice: number): number => {
                if (purchasePrice === 0) return 0;
                return ((currentValue - purchasePrice) / purchasePrice) * 100;
            };

            expect(calculateProfit(500, 400)).toBe(100);
            expect(calculateProfit(300, 400)).toBe(-100);
            expect(calculateProfitPercent(500, 400)).toBe(25);
            expect(calculateProfitPercent(200, 400)).toBe(-50);
        });
    });

    describe('Card Filtering', () => {
        const testCards = [
            { id: '1', player_name: 'Michael Jordan', sport: 'Basketball', year: 1986, value: 12500, is_favorite: true, is_wishlist: false },
            { id: '2', player_name: 'Patrick Mahomes', sport: 'Football', year: 2018, value: 850, is_favorite: false, is_wishlist: false },
            { id: '3', player_name: 'Mike Trout', sport: 'Baseball', year: 2011, value: 5000, is_favorite: true, is_wishlist: false },
            { id: '4', player_name: 'LeBron James', sport: 'Basketball', year: 2003, value: 8000, is_favorite: false, is_wishlist: true },
        ];

        it('should filter cards by sport', () => {
            const filterBySport = (cards: any[], sport: string) => {
                return cards.filter(card => card.sport === sport);
            };

            const basketballCards = filterBySport(testCards, 'Basketball');
            expect(basketballCards).toHaveLength(2);
            expect(basketballCards[0].player_name).toBe('Michael Jordan');
        });

        it('should filter cards by year range', () => {
            const filterByYearRange = (cards: any[], minYear: number, maxYear: number) => {
                return cards.filter(card => card.year >= minYear && card.year <= maxYear);
            };

            const cards2000s = filterByYearRange(testCards, 2000, 2009);
            expect(cards2000s).toHaveLength(1);
            expect(cards2000s[0].player_name).toBe('LeBron James');
        });

        it('should filter cards by value range', () => {
            const filterByValueRange = (cards: any[], minValue: number, maxValue: number) => {
                return cards.filter(card => card.value >= minValue && card.value <= maxValue);
            };

            const midValueCards = filterByValueRange(testCards, 1000, 10000);
            expect(midValueCards).toHaveLength(2);
        });

        it('should search cards by player name', () => {
            const searchByPlayer = (cards: any[], query: string) => {
                const lowerQuery = query.toLowerCase();
                return cards.filter(card =>
                    card.player_name.toLowerCase().includes(lowerQuery)
                );
            };

            const mikeCards = searchByPlayer(testCards, 'mike');
            expect(mikeCards).toHaveLength(1);
            expect(mikeCards[0].player_name).toBe('Mike Trout');
        });

        it('should filter cards by favorites', () => {
            const filterByFavorites = (cards: any[]) => {
                return cards.filter(card => card.is_favorite === true);
            };

            const favoriteCards = filterByFavorites(testCards);
            expect(favoriteCards).toHaveLength(2);
            expect(favoriteCards[0].player_name).toBe('Michael Jordan');
            expect(favoriteCards[1].player_name).toBe('Mike Trout');
        });

        it('should filter cards by wishlist', () => {
            const filterByWishlist = (cards: any[]) => {
                return cards.filter(card => card.is_wishlist === true);
            };

            const wishlistCards = filterByWishlist(testCards);
            expect(wishlistCards).toHaveLength(1);
            expect(wishlistCards[0].player_name).toBe('LeBron James');
        });
    });

    describe('Card Sorting', () => {
        const testCards = [
            { id: '1', player_name: 'Michael Jordan', value: 12500, created_at: '2024-01-01' },
            { id: '2', player_name: 'Patrick Mahomes', value: 850, created_at: '2024-02-15' },
            { id: '3', player_name: 'Mike Trout', value: 5000, created_at: '2024-01-20' },
        ];

        it('should sort cards by value descending', () => {
            const sortByValue = (cards: any[], order: 'asc' | 'desc' = 'desc') => {
                return [...cards].sort((a, b) =>
                    order === 'desc' ? b.value - a.value : a.value - b.value
                );
            };

            const sorted = sortByValue(testCards);
            expect(sorted[0].player_name).toBe('Michael Jordan');
            expect(sorted[2].player_name).toBe('Patrick Mahomes');
        });

        it('should sort cards by value ascending', () => {
            const sortByValue = (cards: any[], order: 'asc' | 'desc' = 'desc') => {
                return [...cards].sort((a, b) =>
                    order === 'desc' ? b.value - a.value : a.value - b.value
                );
            };

            const sorted = sortByValue(testCards, 'asc');
            expect(sorted[0].player_name).toBe('Patrick Mahomes');
            expect(sorted[2].player_name).toBe('Michael Jordan');
        });

        it('should sort cards by player name alphabetically', () => {
            const sortByName = (cards: any[]) => {
                return [...cards].sort((a, b) =>
                    a.player_name.localeCompare(b.player_name)
                );
            };

            const sorted = sortByName(testCards);
            expect(sorted[0].player_name).toBe('Michael Jordan');
            expect(sorted[1].player_name).toBe('Mike Trout');
            expect(sorted[2].player_name).toBe('Patrick Mahomes');
        });
    });

    describe('Card Validation', () => {
        it('should validate required card fields', () => {
            const validateCard = (card: any): { valid: boolean; errors: string[] } => {
                const errors: string[] = [];

                if (!card.player_name?.trim()) {
                    errors.push('Player name is required');
                }
                if (!card.sport?.trim()) {
                    errors.push('Sport is required');
                }
                if (!card.image_path?.trim()) {
                    errors.push('Image is required');
                }

                return { valid: errors.length === 0, errors };
            };

            const validCard = {
                player_name: 'Test Player',
                sport: 'Basketball',
                image_path: '/uploads/test.jpg',
            };

            const invalidCard = {
                player_name: '',
                sport: 'Basketball',
            };

            expect(validateCard(validCard).valid).toBe(true);
            expect(validateCard(invalidCard).valid).toBe(false);
            expect(validateCard(invalidCard).errors).toContain('Player name is required');
        });

        it('should validate grade is within range', () => {
            const validateGrade = (grade: number | null): boolean => {
                if (grade === null) return true; // Grade is optional
                return grade >= 1 && grade <= 10;
            };

            expect(validateGrade(9.5)).toBe(true);
            expect(validateGrade(1)).toBe(true);
            expect(validateGrade(10)).toBe(true);
            expect(validateGrade(0)).toBe(false);
            expect(validateGrade(11)).toBe(false);
            expect(validateGrade(null)).toBe(true);
        });
    });
});
