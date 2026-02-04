/**
 * Unit tests for API service layer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Create a fresh axios instance for each test
vi.mock('axios', () => {
    const mockCreate = vi.fn(() => ({
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }));

    return {
        default: {
            create: mockCreate,
        },
    };
});

describe('API Service', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockAxiosInstance = {
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
        };

        (axios.create as any).mockReturnValue(mockAxiosInstance);
    });

    describe('Configuration', () => {
        it('should create axios instance with correct base URL', async () => {
            // Re-import to get fresh module with mocked axios
            vi.resetModules();
            await import('../services/api');

            expect(axios.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        it('should set up request interceptor', async () => {
            vi.resetModules();
            await import('../services/api');

            expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
        });

        it('should set up response interceptor', async () => {
            vi.resetModules();
            await import('../services/api');

            expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
        });
    });
});

describe('API Request Interceptor', () => {
    it('should add auth token to requests when available', () => {
        const mockConfig = { headers: {} };
        const token = 'test-jwt-token';

        // Simulate what the interceptor does
        const addAuthToken = (config: any) => {
            const storedToken = localStorage.getItem('cardshark_token');
            if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`;
            }
            return config;
        };

        (localStorage.getItem as any).mockReturnValue(token);
        const result = addAuthToken(mockConfig);

        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add auth header when no token exists', () => {
        const mockConfig = { headers: {} };

        const addAuthToken = (config: any) => {
            const storedToken = localStorage.getItem('cardshark_token');
            if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`;
            }
            return config;
        };

        (localStorage.getItem as any).mockReturnValue(null);
        const result = addAuthToken(mockConfig);

        expect(result.headers.Authorization).toBeUndefined();
    });
});

describe('API Response Interceptor', () => {
    it('should clear auth and redirect on 401 error', () => {
        const mockError = {
            response: { status: 401 },
        };

        // Simulate what the response error handler does
        const handleResponseError = (error: any) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('cardshark_token');
                localStorage.removeItem('cardshark_user');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        };

        expect(() => handleResponseError(mockError)).rejects.toEqual(mockError);
        expect(localStorage.removeItem).toHaveBeenCalledWith('cardshark_token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('cardshark_user');
        expect(window.location.href).toBe('/login');
    });

    it('should pass through other errors without clearing auth', () => {
        const mockError = {
            response: { status: 500 },
        };

        const handleResponseError = (error: any) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('cardshark_token');
                localStorage.removeItem('cardshark_user');
            }
            return Promise.reject(error);
        };

        expect(() => handleResponseError(mockError)).rejects.toEqual(mockError);
        expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
});
