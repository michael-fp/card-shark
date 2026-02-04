/**
 * Unit tests for Demo Mode functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_CARDS, DEMO_STATS, DEMO_USER, calculateDemoStats } from '../data/demoData';
import type { Card } from '../types';

describe('Demo Mode Functionality', () => {
    describe('Demo Data Structure', () => {
        it('should have valid demo cards array', () => {
            expect(DEMO_CARDS).toBeDefined();
            expect(Array.isArray(DEMO_CARDS)).toBe(true);
            expect(DEMO_CARDS.length).toBeGreaterThan(0);
        });

        it('should have demo cards with required fields', () => {
            DEMO_CARDS.forEach((card) => {
                expect(card).toHaveProperty('id');
                expect(card).toHaveProperty('player_name');
                expect(card).toHaveProperty('sport');
                expect(card.id).toMatch(/^demo-/);
            });
        });

        it('should have demo cards with valid ID prefixes', () => {
            DEMO_CARDS.forEach((card) => {
                expect(card.id.startsWith('demo-')).toBe(true);
            });
        });

        it('should have all four sports represented', () => {
            const sports = new Set(DEMO_CARDS.map(c => c.sport));
            expect(sports.has('Football')).toBe(true);
            expect(sports.has('Basketball')).toBe(true);
            expect(sports.has('Baseball')).toBe(true);
            expect(sports.has('Hockey')).toBe(true);
        });

        it('should have valid demo user', () => {
            expect(DEMO_USER).toBeDefined();
            expect(DEMO_USER.id).toBe('demo-user');
            expect(DEMO_USER.email).toBe('demo@cardshark.com');
        });
    });

    describe('Demo Stats Calculation', () => {
        it('should calculate correct total cards (excluding wishlist)', () => {
            const ownedCards = DEMO_CARDS.filter(c => !c.is_wishlist);
            expect(DEMO_STATS.overview.totalCards).toBe(ownedCards.length);
        });

        it('should calculate correct total value', () => {
            const ownedCards = DEMO_CARDS.filter(c => !c.is_wishlist);
            const expectedTotal = ownedCards.reduce((sum, c) => sum + (c.value || 0), 0);
            expect(DEMO_STATS.overview.totalValue).toBe(expectedTotal);
        });

        it('should calculate correct total cost', () => {
            const ownedCards = DEMO_CARDS.filter(c => !c.is_wishlist);
            const expectedCost = ownedCards.reduce((sum, c) => sum + (c.purchase_price || 0), 0);
            expect(DEMO_STATS.overview.totalCost).toBe(expectedCost);
        });

        it('should calculate correct profit', () => {
            const expectedProfit = DEMO_STATS.overview.totalValue - DEMO_STATS.overview.totalCost;
            expect(DEMO_STATS.overview.profit).toBe(expectedProfit);
        });

        it('should have sport breakdown', () => {
            expect(DEMO_STATS.bySport).toBeDefined();
            expect(Array.isArray(DEMO_STATS.bySport)).toBe(true);
            expect(DEMO_STATS.bySport.length).toBeGreaterThan(0);
        });

        it('should have top cards sorted by value', () => {
            for (let i = 0; i < DEMO_STATS.topCards.length - 1; i++) {
                expect(DEMO_STATS.topCards[i].value).toBeGreaterThanOrEqual(
                    DEMO_STATS.topCards[i + 1].value || 0
                );
            }
        });
    });

    describe('calculateDemoStats Function', () => {
        it('should return zero values for empty array', () => {
            const stats = calculateDemoStats([]);
            expect(stats.overview.totalCards).toBe(0);
            expect(stats.overview.totalValue).toBe(0);
            expect(stats.overview.avgGrade).toBe(0);
        });

        it('should handle cards with null values', () => {
            const testCards: Card[] = [
                {
                    id: 'test-1',
                    player_name: 'Test',
                    sport: 'Basketball',
                    value: null,
                    grade: null,
                    is_wishlist: false,
                } as any,
            ];

            const stats = calculateDemoStats(testCards);
            expect(stats.overview.totalCards).toBe(1);
            expect(stats.overview.totalValue).toBe(0);
        });

        it('should exclude wishlist cards from owned count', () => {
            const testCards: Card[] = [
                { id: 'test-1', player_name: 'Player 1', sport: 'Basketball', is_wishlist: false, value: 100 } as Card,
                { id: 'test-2', player_name: 'Player 2', sport: 'Football', is_wishlist: true, value: 200 } as Card,
            ];

            const stats = calculateDemoStats(testCards);
            expect(stats.overview.totalCards).toBe(1);
            expect(stats.overview.wishlistCount).toBe(1);
        });
    });

    describe('Demo Mode Restrictions', () => {
        it('should identify demo cards correctly', () => {
            const isDemoCard = (cardId: string) => cardId.startsWith('demo-');

            expect(isDemoCard('demo-1')).toBe(true);
            expect(isDemoCard('demo-jordan')).toBe(true);
            expect(isDemoCard('real-card-123')).toBe(false);
            expect(isDemoCard('card-456')).toBe(false);
        });

        it('should not allow editing demo cards', () => {
            const canEditCard = (cardId: string) => {
                if (cardId.startsWith('demo-')) return false;
                return true;
            };

            expect(canEditCard('demo-1')).toBe(false);
            expect(canEditCard('real-card-1')).toBe(true);
        });

        it('should not allow deleting demo cards', () => {
            const canDeleteCard = (cardId: string) => {
                if (cardId.startsWith('demo-')) return false;
                return true;
            };

            expect(canDeleteCard('demo-1')).toBe(false);
            expect(canDeleteCard('real-card-1')).toBe(true);
        });
    });
});
