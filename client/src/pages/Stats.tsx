import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet, Star, Heart, BarChart3, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import type { CollectionStats } from '../types';
import { motion } from 'framer-motion';
import { useDemo } from '../context/DemoContext';

export default function Stats() {
    const { isDemoMode, demoStats, demoUsage } = useDemo();

    const { data: stats, isLoading, error } = useQuery<CollectionStats>({
        queryKey: ['stats'],
        queryFn: async () => {
            const response = await api.get('/api/stats/overview');
            return response.data;
        },
        enabled: !isDemoMode,
    });

    const { data: usage } = useQuery({
        queryKey: ['usage'],
        queryFn: async () => {
            const response = await api.get('/api/stats/usage');
            return response.data;
        },
        enabled: !isDemoMode,
    });

    // Use demo data in demo mode
    const displayStats = isDemoMode ? demoStats : stats;
    const displayUsage = isDemoMode ? demoUsage : usage;

    if (isLoading && !isDemoMode) {
        return (
            <div className="max-w-screen-xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-ig-text mb-6">Collection Stats</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 skeleton rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-4">
                    <div className="h-64 skeleton rounded-xl" />
                    <div className="h-48 skeleton rounded-xl" />
                </div>
            </div>
        );
    }

    if ((error || !displayStats) && !isDemoMode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-ig-text-secondary mb-4">Failed to load stats</p>
                <button className="btn-ig-primary">Try Again</button>
            </div>
        );
    }

    const { overview = {} as any, bySort = [] as Array<{ sport: string; count: number; totalValue: number }>, byGrade = [] as Array<{ grade: number; count: number }>, byYear = [] as Array<{ year: number; count: number; totalValue: number }>, topCards = [] } = displayStats || {};
    const bySport = bySort;

    // Safe defaults for overview
    const safeOverview = {
        totalValue: 0,
        totalCost: 0,
        profit: 0,
        profitPercent: 0,
        avgGrade: null,
        avgValue: 0,
        totalCards: 0,
        wishlistCount: 0,
        ...overview
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-ig-text">Collection Stats</h1>
                <p className="text-ig-text-secondary">Track your portfolio performance</p>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Wallet className="w-5 h-5" />}
                    label="Total Value"
                    value={`$${(safeOverview.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    color="text-ig-primary"
                    delay={0}
                />
                <StatCard
                    icon={safeOverview.profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    label="Profit/Loss"
                    value={`${safeOverview.profit >= 0 ? '+' : ''}$${Math.abs(safeOverview.profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    subvalue={`${safeOverview.profitPercent >= 0 ? '+' : ''}${(safeOverview.profitPercent || 0).toFixed(1)}%`}
                    color={safeOverview.profit >= 0 ? 'text-ig-success' : 'text-ig-like'}
                    delay={0.05}
                />
                <StatCard
                    icon={<Star className="w-5 h-5" />}
                    label="Avg Grade"
                    value={safeOverview.avgGrade != null ? String(typeof safeOverview.avgGrade === 'number' ? safeOverview.avgGrade.toFixed(1) : safeOverview.avgGrade) : '—'}
                    color="text-amber-500"
                    delay={0.1}
                />
                <StatCard
                    icon={<Heart className="w-5 h-5" />}
                    label="Total Cards"
                    value={safeOverview.totalCards.toString()}
                    subvalue={safeOverview.wishlistCount > 0 ? `${safeOverview.wishlistCount} wishlist` : undefined}
                    color="text-ig-like"
                    delay={0.15}
                />
            </div>

            {/* Usage warnings */}
            {displayUsage && (displayUsage.api?.approachingLimit || displayUsage.storage?.warning) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-ig-warning/10 border border-ig-warning/30 rounded-xl"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-ig-warning mt-0.5" />
                        <div>
                            <p className="font-medium text-ig-warning">Usage Warning</p>
                            <ul className="text-sm text-ig-text-secondary mt-1 space-y-1">
                                {displayUsage.api?.approachingLimit && (
                                    <li>• Vision API: {displayUsage.api.used}/{displayUsage.api.limit} calls this month</li>
                                )}
                                {displayUsage.storage?.warning && (
                                    <li>• Storage: {(displayUsage.storage.used / 1024 / 1024).toFixed(0)}MB / {(displayUsage.storage.limit / 1024 / 1024).toFixed(0)}MB</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* By Sport */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-ig-surface border border-ig-border rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-ig-text mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-ig-text-secondary" />
                        By Sport
                    </h3>
                    <div className="space-y-3">
                        {bySport.length > 0 ? (
                            bySport.map((item, i) => (
                                <div key={item.sport}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-ig-text">{item.sport}</span>
                                        <span className="text-ig-text-secondary">{item.count} cards</span>
                                    </div>
                                    <div className="h-2 bg-ig-elevated rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.count / safeOverview.totalCards) * 100}%` }}
                                            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-ig-gradient-start to-ig-gradient-end rounded-full"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-ig-text-muted text-sm">No data yet</p>
                        )}
                    </div>
                </motion.div>

                {/* By Grade */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-ig-surface border border-ig-border rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-ig-text mb-4">By Grade</h3>
                    <div className="flex items-end gap-2 h-32">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((grade) => {
                            const count = byGrade.find(g => g.grade === grade)?.count || 0;
                            const maxCount = Math.max(...byGrade.map(g => g.count), 1);
                            const height = (count / maxCount) * 100;

                            return (
                                <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(height, 4)}%` }}
                                        transition={{ delay: 0.4 + grade * 0.03, duration: 0.4 }}
                                        className={`w-full rounded-t-sm ${grade >= 9 ? 'bg-emerald-500' :
                                            grade >= 7 ? 'bg-sky-500' :
                                                grade >= 5 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ minHeight: count > 0 ? '8px' : '2px' }}
                                    />
                                    <span className="text-xs text-ig-text-muted">{grade}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Top Cards */}
            {topCards.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-ig-surface border border-ig-border rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-ig-text mb-4">Most Valuable Cards</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {topCards.slice(0, 5).map((card, i) => {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                            return (
                                <div key={card.id} className="text-center">
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ig-elevated mb-2 relative">
                                        {card.image_path && (
                                            <img
                                                src={`${apiUrl}${card.image_path}`}
                                                alt={card.player_name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">#{i + 1}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-ig-text truncate">{card.player_name}</p>
                                    <p className="text-sm text-ig-success">${card.value != null ? Number(card.value).toFixed(2) : '0.00'}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Value by Year */}
            {byYear.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-ig-surface border border-ig-border rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-ig-text mb-4">Value by Year</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {byYear.slice(0, 16).map((item) => (
                            <div
                                key={item.year}
                                className="p-3 bg-ig-elevated rounded-lg text-center"
                            >
                                <p className="text-xs text-ig-text-muted">{item.year}</p>
                                <p className="text-sm font-semibold text-ig-text">{item.count}</p>
                                <p className="text-xs text-ig-success">${item.totalValue != null ? Number(item.totalValue).toFixed(0) : '0'}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subvalue?: string;
    color: string;
    delay: number;
}

function StatCard({ icon, label, value, subvalue, color, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-ig-surface border border-ig-border rounded-xl p-4"
        >
            <div className={`${color} mb-2`}>{icon}</div>
            <p className="text-xs text-ig-text-muted uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            {subvalue && (
                <p className="text-xs text-ig-text-secondary">{subvalue}</p>
            )}
        </motion.div>
    );
}
