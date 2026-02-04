import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

// Google Identity Services script
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function Login() {
    const { login, isLoading } = useAuth();
    const { enableDemoMode } = useDemo();
    const navigate = useNavigate();

    const handleCredentialResponse = useCallback(
        async (response: { credential: string }) => {
            try {
                await login(response.credential);
            } catch (error: any) {
                console.error('Login error:', error.message);
                // Show error toast here
            }
        },
        [login]
    );

    useEffect(() => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                });

                const buttonDiv = document.getElementById('google-signin-button');
                if (buttonDiv) {
                    window.google.accounts.id.renderButton(buttonDiv, {
                        theme: 'filled_black',
                        size: 'large',
                        shape: 'rectangular',
                        text: 'signin_with',
                        width: 280,
                    });
                }
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [handleCredentialResponse]);

    return (
        <div className="min-h-screen bg-ig-background flex flex-col items-center justify-center px-4">
            {/* Background gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-ig-gradient-start/20 via-ig-gradient-middle/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-shark-500/20 via-shark-600/10 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <span className="text-6xl">🦈</span>
                    <div>
                        <h1 className="text-4xl font-bold text-ig-text tracking-tight">
                            CardShark
                        </h1>
                        <p className="text-ig-text-secondary text-sm">
                            Track your sports card collection
                        </p>
                    </div>
                </motion.div>

                {/* Login card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm bg-ig-surface border border-ig-border rounded-2xl p-8"
                >
                    <h2 className="text-xl font-semibold text-ig-text text-center mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-ig-text-muted text-sm text-center mb-8">
                        Sign in to access your collection
                    </p>

                    {/* Google Sign-In Button */}
                    <div className="flex justify-center mb-6">
                        {isLoading ? (
                            <div className="w-70 h-10 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-ig-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div id="google-signin-button" />
                        )}
                    </div>

                    {/* Info text */}
                    <p className="text-xs text-ig-text-muted text-center">
                        Only authorized accounts can access CardShark.
                        <br />
                        Contact the admin if you need access.
                    </p>
                </motion.div>

                {/* Demo Mode Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-sm mt-4"
                >
                    <button
                        onClick={() => {
                            enableDemoMode();
                            navigate('/');
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-shark-500 to-shark-600 text-white font-medium flex items-center justify-center gap-2 hover:from-shark-600 hover:to-shark-700 transition-all shadow-lg"
                    >
                        <Play className="w-5 h-5" />
                        Try Demo Mode
                    </button>
                    <p className="text-xs text-ig-text-muted text-center mt-2">
                        Explore with sample card data
                    </p>
                </motion.div>

                {/* Features preview */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 flex gap-8 text-center"
                >
                    {[
                        { icon: '📸', label: 'AI Recognition' },
                        { icon: '📊', label: 'Portfolio Tracking' },
                        { icon: '💰', label: 'Price Alerts' },
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <span className="text-2xl">{feature.icon}</span>
                            <span className="text-xs text-ig-text-secondary">{feature.label}</span>
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
