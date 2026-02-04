import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { User, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-ig-background border-b border-ig-border">
            <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl">🦈</span>
                    <span className="text-xl font-semibold text-ig-text tracking-tight">
                        CardShark
                    </span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `transition-colors ${isActive
                                ? 'text-ig-text font-medium'
                                : 'text-ig-text-secondary hover:text-ig-text'}`
                        }
                    >
                        Collection
                    </NavLink>
                    <NavLink
                        to="/stats"
                        className={({ isActive }) =>
                            `transition-colors ${isActive
                                ? 'text-ig-text font-medium'
                                : 'text-ig-text-secondary hover:text-ig-text'}`
                        }
                    >
                        Stats
                    </NavLink>
                    <NavLink
                        to="/wishlist"
                        className={({ isActive }) =>
                            `transition-colors ${isActive
                                ? 'text-ig-text font-medium'
                                : 'text-ig-text-secondary hover:text-ig-text'}`
                        }
                    >
                        Wishlist
                    </NavLink>
                </nav>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 p-1 rounded-full hover:bg-ig-surface transition-colors"
                    >
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-ig-surface flex items-center justify-center">
                                <User className="w-5 h-5 text-ig-text-secondary" />
                            </div>
                        )}
                    </button>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                        {menuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setMenuOpen(false)}
                                />

                                {/* Menu */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-56 z-50 bg-ig-elevated rounded-xl border border-ig-border shadow-ig-elevated overflow-hidden"
                                >
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-ig-border">
                                        <p className="text-sm font-medium text-ig-text truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-ig-text-muted truncate">
                                            {user?.email}
                                        </p>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-1">
                                        <Link
                                            to="/stats"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ig-text hover:bg-ig-surface transition-colors"
                                        >
                                            <BarChart3 className="w-4 h-4 text-ig-text-secondary" />
                                            Portfolio Stats
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setMenuOpen(false);
                                                logout();
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ig-like hover:bg-ig-surface transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
