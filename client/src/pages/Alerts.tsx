import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, AlertCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Card } from '../types';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { useDemo } from '../context/DemoContext';

interface PriceAlert {
    id: string;
    card_id: string;
    user_id: string;
    target_price: number;
    alert_type: 'above' | 'below';
    is_active: boolean;
    created_at: string;
    last_triggered_at: string | null;
    card?: Card;
}

interface AlertFormData {
    card_id: string;
    target_price: number;
    alert_type: 'above' | 'below';
}

// Demo alerts data
const DEMO_ALERTS: PriceAlert[] = [
    {
        id: 'demo-alert-1',
        card_id: 'demo-5',
        user_id: 'demo-user',
        target_price: 50000,
        alert_type: 'above',
        is_active: true,
        created_at: '2024-01-20T12:00:00Z',
        last_triggered_at: null,
    },
    {
        id: 'demo-alert-2',
        card_id: 'demo-1',
        user_id: 'demo-user',
        target_price: 40000,
        alert_type: 'below',
        is_active: true,
        created_at: '2024-01-22T12:00:00Z',
        last_triggered_at: null,
    },
];

export default function Alerts() {
    const queryClient = useQueryClient();
    const { isDemoMode, demoCards } = useDemo();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [formData, setFormData] = useState<AlertFormData>({
        card_id: '',
        target_price: 0,
        alert_type: 'above',
    });

    // Fetch alerts
    const { data: alertsData, isLoading } = useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            if (isDemoMode) {
                // Return demo alerts with card data attached
                return DEMO_ALERTS.map(alert => ({
                    ...alert,
                    card: demoCards.find((c: Card) => c.id === alert.card_id),
                }));
            }
            const response = await api.get('/api/alerts');
            return response.data;
        },
    });

    // Fetch user's cards for the dropdown
    const { data: cardsData } = useQuery({
        queryKey: ['cards'],
        queryFn: async () => {
            if (isDemoMode) return demoCards.filter((c: Card) => !c.is_wishlist);
            const response = await api.get('/api/cards');
            return response.data;
        },
    });

    // Create alert mutation
    const createMutation = useMutation({
        mutationFn: async (data: AlertFormData) => {
            if (isDemoMode) {
                // Simulate creating an alert in demo mode
                return { success: true };
            }
            const response = await api.post('/api/alerts', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            setShowCreateModal(false);
            resetForm();
        },
    });

    // Delete alert mutation
    const deleteMutation = useMutation({
        mutationFn: async (alertId: string) => {
            if (isDemoMode) {
                return { success: true };
            }
            await api.delete(`/api/alerts/${alertId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });

    // Toggle alert mutation
    const toggleMutation = useMutation({
        mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
            if (isDemoMode) {
                return { success: true };
            }
            await api.put(`/api/alerts/${alertId}`, { isActive: !isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });

    const alerts: PriceAlert[] = alertsData || [];
    const cards: Card[] = cardsData || [];

    const resetForm = () => {
        setFormData({ card_id: '', target_price: 0, alert_type: 'above' });
        setSelectedCard(null);
    };

    const handleCardSelect = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        setSelectedCard(card || null);
        setFormData(prev => ({
            ...prev,
            card_id: cardId,
            target_price: card?.value || 0,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.card_id || formData.target_price <= 0) return;
        createMutation.mutate(formData);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-ig-background pb-20">
            <Header />

            {/* Demo Mode Banner */}
            {isDemoMode && (
                <div className="bg-ig-primary/10 border-b border-ig-primary/30 px-4 py-2">
                    <p className="text-center text-sm text-ig-primary">
                        📊 Demo Mode - Sample price alerts
                    </p>
                </div>
            )}

            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-ig-text">Price Alerts</h1>
                        <p className="text-ig-text-secondary text-sm">
                            Get notified when card prices change
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-ig-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Alert
                    </button>
                </div>

                {/* Alerts List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-ig-primary border-t-transparent rounded-full" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell className="w-16 h-16 mx-auto text-ig-text-muted mb-4" />
                        <h2 className="text-xl font-semibold text-ig-text mb-2">No Alerts Yet</h2>
                        <p className="text-ig-text-secondary mb-6">
                            Create price alerts to track your cards' value.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-ig-primary"
                        >
                            Create Your First Alert
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-ig-elevated rounded-xl p-4 border ${alert.is_active ? 'border-ig-border' : 'border-ig-border/50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Alert Type Icon */}
                                    <div className={`p-3 rounded-full ${alert.alert_type === 'above'
                                        ? 'bg-ig-success/20 text-ig-success'
                                        : 'bg-ig-like/20 text-ig-like'
                                        }`}>
                                        {alert.alert_type === 'above'
                                            ? <TrendingUp className="w-5 h-5" />
                                            : <TrendingDown className="w-5 h-5" />
                                        }
                                    </div>

                                    {/* Alert Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-ig-text">
                                                    {alert.card?.player_name || 'Unknown Card'}
                                                </h3>
                                                <p className="text-sm text-ig-text-secondary">
                                                    {alert.card?.card_set} • {alert.card?.year}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Toggle Active */}
                                                <button
                                                    onClick={() => toggleMutation.mutate({
                                                        alertId: alert.id,
                                                        isActive: alert.is_active
                                                    })}
                                                    className={`p-2 rounded-lg transition-colors ${alert.is_active
                                                        ? 'bg-ig-success/20 text-ig-success'
                                                        : 'bg-ig-surface text-ig-text-muted'
                                                        }`}
                                                    title={alert.is_active ? 'Disable alert' : 'Enable alert'}
                                                >
                                                    <Bell className="w-4 h-4" />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => deleteMutation.mutate(alert.id)}
                                                    className="p-2 rounded-lg bg-ig-surface text-ig-text-muted hover:text-ig-like transition-colors"
                                                    title="Delete alert"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price Target */}
                                        <div className="mt-3 flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="w-4 h-4 text-ig-text-muted" />
                                                <span className="text-ig-text-secondary">Current:</span>
                                                <span className="font-medium text-ig-text">
                                                    {formatCurrency(alert.card?.value || 0)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <AlertCircle className="w-4 h-4 text-ig-text-muted" />
                                                <span className="text-ig-text-secondary">
                                                    Alert {alert.alert_type === 'above' ? 'above' : 'below'}:
                                                </span>
                                                <span className={`font-medium ${alert.alert_type === 'above' ? 'text-ig-success' : 'text-ig-like'
                                                    }`}>
                                                    {formatCurrency(alert.target_price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Alert Modal */}
            {showCreateModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowCreateModal(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-ig-elevated rounded-2xl w-full max-w-md shadow-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-ig-border">
                            <h2 className="text-lg font-semibold text-ig-text">Create Price Alert</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-full hover:bg-ig-surface transition-colors"
                            >
                                <X className="w-5 h-5 text-ig-text-secondary" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Card Selection */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                    Select Card
                                </label>
                                <select
                                    value={formData.card_id}
                                    onChange={(e) => handleCardSelect(e.target.value)}
                                    required
                                    className="input-ig w-full"
                                >
                                    <option value="">Choose a card...</option>
                                    {cards.map(card => (
                                        <option key={card.id} value={card.id}>
                                            {card.player_name} - {card.card_set} ({card.year})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selected Card Preview */}
                            {selectedCard && (
                                <div className="p-3 bg-ig-surface rounded-lg">
                                    <p className="text-sm text-ig-text-secondary">Current Value</p>
                                    <p className="text-lg font-bold text-ig-success">
                                        {formatCurrency(selectedCard.value || 0)}
                                    </p>
                                </div>
                            )}

                            {/* Alert Type */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text-secondary mb-2">
                                    Alert When Price Goes
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, alert_type: 'above' }))}
                                        className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${formData.alert_type === 'above'
                                            ? 'bg-ig-success text-white'
                                            : 'bg-ig-surface text-ig-text-secondary'
                                            }`}
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        Above
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, alert_type: 'below' }))}
                                        className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${formData.alert_type === 'below'
                                            ? 'bg-ig-like text-white'
                                            : 'bg-ig-surface text-ig-text-secondary'
                                            }`}
                                    >
                                        <TrendingDown className="w-4 h-4" />
                                        Below
                                    </button>
                                </div>
                            </div>

                            {/* Target Price */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                    Target Price ($)
                                </label>
                                <input
                                    type="number"
                                    value={formData.target_price || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        target_price: parseFloat(e.target.value) || 0
                                    }))}
                                    required
                                    min="0"
                                    step="1"
                                    className="input-ig w-full"
                                    placeholder="Enter target price"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!formData.card_id || formData.target_price <= 0 || createMutation.isPending}
                                className="w-full btn-ig-primary flex items-center justify-center gap-2"
                            >
                                {createMutation.isPending ? (
                                    'Creating...'
                                ) : (
                                    <>
                                        <Bell className="w-4 h-4" />
                                        Create Alert
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            <BottomNav />
        </div>
    );
}
