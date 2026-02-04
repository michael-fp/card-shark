import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Edit, Trash2, Bell, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Card } from '../types';
import EditCardForm from './EditCardForm';
import { useDemo } from '../context/DemoContext';

interface CardModalProps {
    card: Card;
    onClose: () => void;
    onUpdate: () => void;
}

export default function CardModal({ card, onClose, onUpdate }: CardModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const queryClient = useQueryClient();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    useDemo(); // Called to ensure context is available
    const isDemo = card.id.startsWith('demo-');

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/api/cards/${card.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            onClose();
        },
    });

    // Toggle wishlist mutation
    const wishlistMutation = useMutation({
        mutationFn: async () => {
            await api.put(`/api/cards/${card.id}`, { isWishlist: !card.is_wishlist });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            onUpdate();
        },
    });

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    const formatCurrency = (value: number | null) => {
        if (!value) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 9) return 'text-emerald-500';
        if (grade >= 7) return 'text-sky-500';
        if (grade >= 5) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-overlay"
                onClick={onClose}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="modal-content flex flex-col md:flex-row"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Left side: Card image */}
                    <div className="md:w-1/2 bg-black flex items-center justify-center p-4">
                        <img
                            src={`${apiUrl}${card.image_path}`}
                            alt={card.player_name}
                            className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>

                    {/* Right side: Card details */}
                    <div className="md:w-1/2 flex flex-col max-h-[80vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-4 border-b border-ig-border">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-ig-text">{card.player_name}</h2>
                                    <p className="text-ig-text-secondary">
                                        {card.team} • {card.year}
                                    </p>
                                </div>
                                {card.grade && (
                                    <div className={`px-3 py-1 rounded-lg bg-ig-surface border border-ig-border ${getGradeColor(card.grade)}`}>
                                        <span className="text-lg font-bold">{card.grade}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 space-y-4">
                            {/* Value section */}
                            <div className="flex items-center justify-between p-4 bg-ig-surface rounded-xl">
                                <div>
                                    <p className="text-xs text-ig-text-muted uppercase tracking-wide">Current Value</p>
                                    <p className="text-2xl font-bold text-ig-success">{formatCurrency(card.value)}</p>
                                </div>
                                {card.purchase_price && (
                                    <div className="text-right">
                                        <p className="text-xs text-ig-text-muted uppercase tracking-wide">Cost</p>
                                        <p className="text-lg text-ig-text-secondary">{formatCurrency(card.purchase_price)}</p>
                                        {card.value && card.purchase_price && (
                                            <p className={`text-sm font-medium ${card.value > card.purchase_price ? 'text-ig-success' : 'text-ig-like'}`}>
                                                {card.value > card.purchase_price ? '+' : ''}
                                                {((card.value - card.purchase_price) / card.purchase_price * 100).toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {card.description && (
                                <div>
                                    <p className="text-xs text-ig-text-muted uppercase tracking-wide mb-1">Description</p>
                                    <p className="text-ig-text">{card.description}</p>
                                </div>
                            )}

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <DetailItem label="Sport" value={card.sport} />
                                <DetailItem label="Card Set" value={card.card_set} />
                                <DetailItem label="Card Number" value={card.card_number ? `#${card.card_number}` : null} />
                                <DetailItem
                                    label="Added"
                                    value={new Date(card.created_at).toLocaleDateString()}
                                />
                            </div>

                            {/* eBay link */}
                            {card.ebay_item_id && (
                                <a
                                    href={`https://www.ebay.com/itm/${card.ebay_item_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-ig-primary hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View on eBay
                                </a>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-ig-border">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => wishlistMutation.mutate()}
                                    disabled={wishlistMutation.isPending}
                                    className={`p-2 rounded-lg transition-colors ${card.is_wishlist
                                        ? 'bg-ig-like/20 text-ig-like'
                                        : 'bg-ig-surface text-ig-text-secondary hover:text-ig-like'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${card.is_wishlist ? 'fill-current' : ''}`} />
                                </button>

                                <button
                                    onClick={() => !isDemo && setIsEditing(true)}
                                    disabled={isDemo}
                                    title={isDemo ? 'Demo cards cannot be edited' : 'Edit card'}
                                    className={`p-2 rounded-lg bg-ig-surface transition-colors ${isDemo
                                        ? 'text-ig-text-muted cursor-not-allowed opacity-50'
                                        : 'text-ig-text-secondary hover:text-ig-text'
                                        }`}
                                >
                                    <Edit className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 rounded-lg bg-ig-surface text-ig-text-secondary hover:text-ig-like transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                <button className="flex-1 btn-ig-primary flex items-center justify-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Set Price Alert
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Delete confirmation modal */}
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <div
                            className="bg-ig-elevated rounded-xl p-6 max-w-sm w-full shadow-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-ig-text mb-2">Delete Card?</h3>
                            <p className="text-ig-text-secondary mb-6">
                                This will permanently delete "{card.player_name}" from your collection.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 btn-ig-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 btn-ig bg-ig-like text-white hover:bg-red-600"
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Edit Form Modal */}
            {isEditing && (
                <EditCardForm
                    card={card}
                    onClose={() => setIsEditing(false)}
                    onSuccess={onUpdate}
                />
            )}
        </AnimatePresence>
    );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
    if (!value) return null;

    return (
        <div className="p-3 bg-ig-surface rounded-lg">
            <p className="text-xs text-ig-text-muted uppercase tracking-wide">{label}</p>
            <p className="text-ig-text font-medium">{value}</p>
        </div>
    );
}
