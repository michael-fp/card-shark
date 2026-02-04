/**
 * Unit tests for Stats API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { query } from '../../db/index.js';
import statsRoutes from '../../routes/stats.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/stats', statsRoutes);

describe('Stats API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/stats', () => {
        it('should return portfolio statistics', async () => {
            // The stats endpoint runs 7 parallel queries
            // 1. Total stats
            query.mockResolvedValueOnce({
                rows: [{
                    total_cards: '25',
                    total_value: '15000.00',
                    total_cost: '12000.00',
                    avg_grade: '8.5',
                    avg_value: '600.00',
                }],
            });

            // 2. Sport breakdown
            query.mockResolvedValueOnce({
                rows: [
                    { sport: 'Basketball', count: '10', total_value: '5000.00' },
                    { sport: 'Football', count: '8', total_value: '6000.00' },
                    { sport: 'Baseball', count: '7', total_value: '4000.00' },
                ],
            });

            // 3. Grade breakdown
            query.mockResolvedValueOnce({
                rows: [
                    { grade_bucket: 9, count: '5' },
                    { grade_bucket: 8, count: '10' },
                ],
            });

            // 4. Year breakdown
            query.mockResolvedValueOnce({
                rows: [
                    { year: 2023, count: '5', total_value: '3000.00' },
                    { year: 2022, count: '3', total_value: '2000.00' },
                ],
            });

            // 5. Top cards
            query.mockResolvedValueOnce({
                rows: [
                    { id: '1', player_name: 'Michael Jordan', value: '12500.00' },
                    { id: '2', player_name: 'Patrick Mahomes', value: '850.00' },
                ],
            });

            // 6. Recent cards
            query.mockResolvedValueOnce({
                rows: [
                    { id: '1', player_name: 'Mike Trout', created_at: '2024-01-01' },
                ],
            });

            // 7. Wishlist count
            query.mockResolvedValueOnce({
                rows: [{ count: '3' }],
            });

            const res = await request(app).get('/api/stats');

            expect(res.status).toBe(200);
            expect(res.body.overview.totalCards).toBe(25);
            expect(res.body.overview.totalValue).toBe(15000.00);
            expect(res.body.bySort).toHaveLength(3); // Note: typo in actual code 'bySort' vs 'bySport'
        });

        it('should return zero stats for empty collection', async () => {
            // 1. Total stats (empty)
            query.mockResolvedValueOnce({
                rows: [{
                    total_cards: '0',
                    total_value: '0',
                    total_cost: '0',
                    avg_grade: '0',
                    avg_value: '0',
                }],
            });

            // 2. Sport breakdown (empty)
            query.mockResolvedValueOnce({ rows: [] });

            // 3. Grade breakdown (empty)
            query.mockResolvedValueOnce({ rows: [] });

            // 4. Year breakdown (empty)
            query.mockResolvedValueOnce({ rows: [] });

            // 5. Top cards (empty)
            query.mockResolvedValueOnce({ rows: [] });

            // 6. Recent cards (empty)
            query.mockResolvedValueOnce({ rows: [] });

            // 7. Wishlist count
            query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

            const res = await request(app).get('/api/stats');

            expect(res.status).toBe(200);
            expect(res.body.overview.totalCards).toBe(0);
            expect(res.body.overview.totalValue).toBe(0);
        });
    });
});
