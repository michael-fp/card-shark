import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
    login: (credential: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
    token: 'cardshark_token',
    user: 'cardshark_user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Initialize auth state from localStorage
    useEffect(() => {
        const token = localStorage.getItem(STORAGE_KEYS.token);
        const userJson = localStorage.getItem(STORAGE_KEYS.user);

        if (token && userJson) {
            try {
                const user = JSON.parse(userJson) as User;
                setState({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
                // Verify token is still valid
                verifyToken(token);
            } catch {
                clearAuth();
            }
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const verifyToken = async (token: string) => {
        try {
            const response = await api.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setState({
                user: response.data.user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            clearAuth();
        }
    };

    const clearAuth = () => {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const login = useCallback(async (credential: string) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await api.post('/api/auth/google', { credential });
            const { token, user } = response.data;

            localStorage.setItem(STORAGE_KEYS.token, token);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

            setState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }, []);

    const logout = useCallback(() => {
        clearAuth();
    }, []);

    const refreshToken = useCallback(async () => {
        const currentToken = localStorage.getItem(STORAGE_KEYS.token);
        if (!currentToken) return;

        try {
            const response = await api.post('/api/auth/refresh', null, {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            const { token, user } = response.data;

            localStorage.setItem(STORAGE_KEYS.token, token);
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

            setState({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            clearAuth();
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
