/**
 * Unit tests for Cards API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { query } from '../../db/index.js';
import cardsRoutes from '../../routes/cards.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/cards', cardsRoutes);

describe('Cards API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/cards', () => {
        it('should return cards for authenticated user', async () => {
            const mockCards = [
                {
                    id: 'card-1',
                    player_name: 'Patrick Mahomes',
                    sport: 'Football',
                    year: 2018,
                    team: 'Kansas City Chiefs',
                    value: 850.00,
                    grade: 9.5,
                    is_wishlist: false,
                    is_favorite: true,
                },
                {
                    id: 'card-2',
                    player_name: 'Michael Jordan',
                    sport: 'Basketball',
                    year: 1986,
                    team: 'Chicago Bulls',
                    value: 12500.00,
                    grade: 8.0,
                    is_wishlist: false,
                    is_favorite: false,
                },
            ];

            query.mockResolvedValueOnce({ rows: mockCards });
            query.mockResolvedValueOnce({ rows: [{ total: '2' }] });

            const res = await request(app).get('/api/cards');

            expect(res.status).toBe(200);
            expect(res.body.cards).toHaveLength(2);
            expect(res.body.cards[0].player_name).toBe('Patrick Mahomes');
            expect(res.body.pagination.total).toBe(2);
        });

        it('should filter cards by sport', async () => {
            const mockCards = [
                { id: 'card-1', player_name: 'Patrick Mahomes', sport: 'Football' },
            ];

            query.mockResolvedValueOnce({ rows: mockCards });
            query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

            const res = await request(app).get('/api/cards?sport=Football');

            expect(res.status).toBe(200);
            expect(res.body.cards).toHaveLength(1);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('sport = $2'),
                expect.arrayContaining(['test-user-id', 'Football'])
            );
        });

        it('should filter cards by year', async () => {
            query.mockResolvedValueOnce({ rows: [] });
            query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

            const res = await request(app).get('/api/cards?year=2020');

            expect(res.status).toBe(200);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('year = $'),
                expect.arrayContaining([2020])
            );
        });

        it('should filter cards by value range', async () => {
            query.mockResolvedValueOnce({ rows: [] });
            query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

            const res = await request(app).get('/api/cards?valueMin=100&valueMax=500');

            expect(res.status).toBe(200);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('value >='),
                expect.arrayContaining([100, 500])
            );
        });

        it('should return empty array when no cards found', async () => {
            query.mockResolvedValueOnce({ rows: [] });
            query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

            const res = await request(app).get('/api/cards');

            expect(res.status).toBe(200);
            expect(res.body.cards).toHaveLength(0);
            expect(res.body.pagination.total).toBe(0);
        });

        it('should filter cards by favorites', async () => {
            const mockFavorites = [
                { id: 'card-1', player_name: 'Patrick Mahomes', is_favorite: true },
            ];

            query.mockResolvedValueOnce({ rows: mockFavorites });
            query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

            const res = await request(app).get('/api/cards?isFavorite=true');

            expect(res.status).toBe(200);
            expect(res.body.cards).toHaveLength(1);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('is_favorite = $'),
                expect.arrayContaining([true])
            );
        });
    });

    describe('GET /api/cards/:id', () => {
        it('should return a single card by ID', async () => {
            const mockCard = {
                id: 'card-123',
                player_name: 'Mike Trout',
                sport: 'Baseball',
                year: 2011,
                value: 5000.00,
            };

            query.mockResolvedValueOnce({ rows: [mockCard] });

            const res = await request(app).get('/api/cards/card-123');

            expect(res.status).toBe(200);
            expect(res.body.card.player_name).toBe('Mike Trout');
        });

        it('should return 404 when card not found', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/cards/non-existent');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Card not found');
        });
    });

    describe('POST /api/cards', () => {
        it('should create a new card', async () => {
            const newCard = {
                imagePath: '/uploads/card-image.jpg',
                sport: 'Basketball',
                playerName: 'Jayson Tatum',
                team: 'Boston Celtics',
                year: 2017,
                value: 350.00,
            };

            const createdCard = {
                id: 'new-card-id',
                ...newCard,
                player_name: newCard.playerName,
                image_path: newCard.imagePath,
            };

            // Mock duplicate check (no duplicates)
            query.mockResolvedValueOnce({ rows: [] });
            // Mock insert
            query.mockResolvedValueOnce({ rows: [createdCard] });

            const res = await request(app)
                .post('/api/cards')
                .send(newCard);

            expect(res.status).toBe(201);
            expect(res.body.card.id).toBe('new-card-id');
            expect(res.body.duplicate).toBeNull();
        });

        it('should return validation error for missing required fields', async () => {
            const incompleteCard = {
                playerName: 'Test Player',
                // Missing imagePath and sport
            };

            const res = await request(app)
                .post('/api/cards')
                .send(incompleteCard);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });

        it('should warn about potential duplicates', async () => {
            const newCard = {
                imagePath: '/uploads/card.jpg',
                sport: 'Football',
                playerName: 'Patrick Mahomes',
                year: 2018,
            };

            // Mock duplicate found
            query.mockResolvedValueOnce({
                rows: [{ id: 'existing-id', player_name: 'Patrick Mahomes', year: 2018 }],
            });
            // Mock insert
            query.mockResolvedValueOnce({ rows: [{ id: 'new-id', ...newCard }] });

            const res = await request(app)
                .post('/api/cards')
                .send(newCard);

            expect(res.status).toBe(201);
            expect(res.body.duplicate).not.toBeNull();
            expect(res.body.duplicate.existingId).toBe('existing-id');
        });
    });

    describe('PUT /api/cards/:id', () => {
        it('should update an existing card', async () => {
            // Mock ownership check
            query.mockResolvedValueOnce({ rows: [{ id: 'card-123' }] });
            // Mock update
            query.mockResolvedValueOnce({
                rows: [{ id: 'card-123', value: 600.00, player_name: 'Test Player' }],
            });

            const res = await request(app)
                .put('/api/cards/card-123')
                .send({ value: 600.00 });

            expect(res.status).toBe(200);
            expect(res.body.card.value).toBe(600.00);
        });

        it('should return 404 when updating non-existent card', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/cards/non-existent')
                .send({ value: 100.00 });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Card not found');
        });
    });

    describe('DELETE /api/cards/:id', () => {
        it('should delete a card', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 'card-123', image_path: '/uploads/card.jpg' }],
            });

            const res = await request(app).delete('/api/cards/card-123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.deleted).toBe('card-123');
        });

        it('should return 404 when deleting non-existent card', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).delete('/api/cards/non-existent');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Card not found');
        });
    });
});
