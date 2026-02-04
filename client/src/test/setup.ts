/**
 * Test setup file for CardShark client tests
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock environment variables
vi.stubGlobal('import.meta', {
    env: {
        VITE_API_URL: 'http://localhost:3001',
    },
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.location
const locationMock = {
    href: 'http://localhost:5173',
    assign: vi.fn(),
    reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
});

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
});
