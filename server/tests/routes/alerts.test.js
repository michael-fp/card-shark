/**
 * Unit tests for Alerts API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { query } from '../../db/index.js';
import alertsRoutes from '../../routes/alerts.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/alerts', alertsRoutes);

describe('Alerts API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/alerts', () => {
        it('should return user alerts with card info', async () => {
            const mockAlerts = [
                {
                    id: 'alert-1',
                    card_id: 'card-1',
                    target_price: 500.00,
                    direction: 'above',
                    is_triggered: false,
                    player_name: 'LeBron James',
                    current_value: 450.00,
                },
            ];

            query.mockResolvedValueOnce({ rows: mockAlerts });

            const res = await request(app).get('/api/alerts');

            expect(res.status).toBe(200);
            expect(res.body.alerts).toHaveLength(1);
            expect(res.body.alerts[0].target_price).toBe(500.00);
        });

        it('should return empty array when no alerts exist', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/alerts');

            expect(res.status).toBe(200);
            expect(res.body.alerts).toHaveLength(0);
        });
    });

    describe('POST /api/alerts', () => {
        it('should create a new alert', async () => {
            const newAlert = {
                cardId: 'card-123',
                targetPrice: 600.00,
                direction: 'above',
            };

            // 1. Mock card ownership check
            query.mockResolvedValueOnce({
                rows: [{ id: 'card-123', player_name: 'Test Player' }],
            });

            // 2. Mock existing alert check (no existing alerts)
            query.mockResolvedValueOnce({ rows: [] });

            // 3. Mock alert creation
            query.mockResolvedValueOnce({
                rows: [{
                    id: 'new-alert-id',
                    card_id: 'card-123',
                    target_price: 600.00,
                    direction: 'above',
                    is_triggered: false,
                }],
            });

            const res = await request(app)
                .post('/api/alerts')
                .send(newAlert);

            expect(res.status).toBe(201);
            expect(res.body.alert.id).toBe('new-alert-id');
        });

        it('should reject alert for non-owned card', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/alerts')
                .send({
                    cardId: 'someone-elses-card',
                    targetPrice: 100.00,
                    direction: 'below',
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Card not found');
        });

        it('should reject invalid direction', async () => {
            const res = await request(app)
                .post('/api/alerts')
                .send({
                    cardId: 'card-123',
                    targetPrice: 100.00,
                    direction: 'invalid',
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Direction must be "above" or "below"');
        });

        it('should reject duplicate alert on same card/direction', async () => {
            // 1. Card ownership check passes
            query.mockResolvedValueOnce({
                rows: [{ id: 'card-123', player_name: 'Test Player' }],
            });

            // 2. Existing alert found
            query.mockResolvedValueOnce({
                rows: [{ id: 'existing-alert' }],
            });

            const res = await request(app)
                .post('/api/alerts')
                .send({
                    cardId: 'card-123',
                    targetPrice: 600.00,
                    direction: 'above',
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Alert already exists');
        });
    });

    describe('DELETE /api/alerts/:id', () => {
        it('should delete an alert', async () => {
            query.mockResolvedValueOnce({
                rows: [{ id: 'alert-123' }],
            });

            const res = await request(app).delete('/api/alerts/alert-123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.deleted).toBe('alert-123');
        });

        it('should return 404 for non-existent alert', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).delete('/api/alerts/non-existent');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Alert not found');
        });
    });
});
