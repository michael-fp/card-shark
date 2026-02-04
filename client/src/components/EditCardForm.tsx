import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Card } from '../types';

interface EditCardFormProps {
    card: Card;
    onClose: () => void;
    onSuccess: () => void;
}

interface EditFormData {
    player_name: string;
    team: string;
    year: number | '';
    sport: string;
    card_set: string;
    card_number: string;
    grade: number | '';
    purchase_price: number | '';
    value: number | '';
    description: string;
}

const SPORTS = ['Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer', 'Other'];

export default function EditCardForm({ card, onClose, onSuccess }: EditCardFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<EditFormData>({
        player_name: card.player_name || '',
        team: card.team || '',
        year: card.year || '',
        sport: card.sport || 'Football',
        card_set: card.card_set || '',
        card_number: card.card_number || '',
        grade: card.grade || '',
        purchase_price: card.purchase_price || '',
        value: card.value || '',
        description: card.description || '',
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Card>) => {
            const response = await api.put(`/api/cards/${card.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            onSuccess();
            onClose();
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updateData: Partial<Card> = {
            player_name: formData.player_name,
            team: formData.team || null,
            year: typeof formData.year === 'number' ? formData.year : null,
            sport: formData.sport,
            card_set: formData.card_set || null,
            card_number: formData.card_number || null,
            grade: typeof formData.grade === 'number' ? formData.grade : null,
            purchase_price: typeof formData.purchase_price === 'number' ? formData.purchase_price : null,
            value: typeof formData.value === 'number' ? formData.value : null,
            description: formData.description || null,
        };

        updateMutation.mutate(updateData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-ig-elevated rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-ig-border">
                    <h2 className="text-lg font-semibold text-ig-text">Edit Card</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-ig-surface transition-colors"
                    >
                        <X className="w-5 h-5 text-ig-text-secondary" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Player Name */}
                    <div>
                        <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                            Player Name *
                        </label>
                        <input
                            type="text"
                            name="player_name"
                            value={formData.player_name}
                            onChange={handleChange}
                            required
                            className="input-ig w-full"
                            placeholder="e.g., Patrick Mahomes"
                        />
                    </div>

                    {/* Team & Year Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Team
                            </label>
                            <input
                                type="text"
                                name="team"
                                value={formData.team}
                                onChange={handleChange}
                                className="input-ig w-full"
                                placeholder="e.g., Kansas City Chiefs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Year
                            </label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                min="1900"
                                max={new Date().getFullYear()}
                                className="input-ig w-full"
                                placeholder="2023"
                            />
                        </div>
                    </div>

                    {/* Sport & Card Set Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Sport
                            </label>
                            <select
                                name="sport"
                                value={formData.sport}
                                onChange={handleChange}
                                className="input-ig w-full"
                            >
                                {SPORTS.map(sport => (
                                    <option key={sport} value={sport}>{sport}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Card Set
                            </label>
                            <input
                                type="text"
                                name="card_set"
                                value={formData.card_set}
                                onChange={handleChange}
                                className="input-ig w-full"
                                placeholder="e.g., Panini Prizm"
                            />
                        </div>
                    </div>

                    {/* Card Number & Grade Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Card Number
                            </label>
                            <input
                                type="text"
                                name="card_number"
                                value={formData.card_number}
                                onChange={handleChange}
                                className="input-ig w-full"
                                placeholder="e.g., 269"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Grade (PSA/BGS)
                            </label>
                            <input
                                type="number"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                min="1"
                                max="10"
                                step="0.5"
                                className="input-ig w-full"
                                placeholder="e.g., 9.5"
                            />
                        </div>
                    </div>

                    {/* Purchase Price & Current Value Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Purchase Price ($)
                            </label>
                            <input
                                type="number"
                                name="purchase_price"
                                value={formData.purchase_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="input-ig w-full"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                                Current Value ($)
                            </label>
                            <input
                                type="number"
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="input-ig w-full"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-ig-text-secondary mb-1">
                            Description / Notes
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="input-ig w-full resize-none"
                            placeholder="Add any notes about this card..."
                        />
                    </div>

                    {/* Error display */}
                    {updateMutation.isError && (
                        <div className="p-3 bg-ig-like/10 border border-ig-like/30 rounded-lg">
                            <p className="text-sm text-ig-like">
                                Failed to update card. Please try again.
                            </p>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="p-4 border-t border-ig-border flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 btn-ig-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending || !formData.player_name}
                        className="flex-1 btn-ig-primary flex items-center justify-center gap-2"
                    >
                        {updateMutation.isPending ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
