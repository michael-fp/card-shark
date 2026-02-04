/**
 * Test setup file for CardShark server tests
 * Runs before each test file
 */

import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.CLIENT_URL = 'http://localhost:5173';

// Mock the database module
vi.mock('../db/index.js', () => ({
    query: vi.fn(),
    pool: {
        connect: vi.fn(),
        end: vi.fn(),
    },
}));

// Mock the auth middleware to bypass JWT verification in tests
vi.mock('../middleware/auth.js', () => ({
    authenticate: (req, res, next) => {
        // Set mock user for all authenticated requests
        req.user = { userId: 'test-user-id', email: 'test@example.com' };
        next();
    },
    isEmailAllowed: (email) => true,
    getAllowedEmails: () => ['test@example.com'],
}));

// Mock the usage middleware
vi.mock('../middleware/usage.js', () => ({
    canMakeApiCall: vi.fn().mockResolvedValue(true),
    incrementApiUsage: vi.fn().mockResolvedValue(undefined),
    getApiUsage: vi.fn().mockResolvedValue({
        used: 50,
        limit: 900,
        remaining: 850,
        month: '2026-02',
    }),
    checkApiLimit: () => (req, res, next) => next(),
}));

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
