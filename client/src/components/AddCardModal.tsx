import { useState, useRef, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { CardFormData, UploadResponse, CardMatch } from '../types';

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'upload' | 'matching' | 'form' | 'success';

const SPORTS = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer'];

export default function AddCardModal({ isOpen, onClose }: AddCardModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<CardMatch | null>(null);
    const [formData, setFormData] = useState<Partial<CardFormData>>({});
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('runMatching', 'true');

            const response = await api.post<UploadResponse>('/api/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data) => {
            setImagePath(data.imagePath);

            if (data.match?.matched && data.match.matchedCard) {
                setMatchResult(data.match);
                setFormData({
                    imagePath: data.imagePath,
                    playerName: data.match.matchedCard.playerName,
                    sport: data.match.matchedCard.sport,
                    year: data.match.matchedCard.year || undefined,
                    team: data.match.matchedCard.team || undefined,
                    cardNumber: data.match.matchedCard.cardNumber || undefined,
                    cardSet: data.match.matchedCard.cardSet || undefined,
                    value: data.match.matchedCard.value,
                    ebayItemId: data.match.matchedCard.ebayItemId,
                });
            } else if (data.match?.extractedData) {
                setMatchResult(data.match);
                setFormData({
                    imagePath: data.imagePath,
                    sport: data.match.extractedData.sport !== 'Unknown' ? data.match.extractedData.sport : undefined,
                    year: data.match.extractedData.year || undefined,
                    cardNumber: data.match.extractedData.cardNumber || undefined,
                    cardSet: data.match.extractedData.cardSet || data.match.extractedData.brand || undefined,
                });
            } else {
                setFormData({ imagePath: data.imagePath });
            }

            setStep('form');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to upload image');
        },
    });

    // Create card mutation
    const createMutation = useMutation({
        mutationFn: async (data: CardFormData) => {
            const response = await api.post('/api/cards', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cards'] });
            setStep('success');
            setTimeout(() => {
                handleClose();
            }, 1500);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to add card');
        },
    });

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setStep('matching');
        setError(null);
        uploadMutation.mutate(file);
    };

    const handleSubmit = () => {
        if (!formData.playerName || !formData.sport || !imagePath) {
            setError('Please fill in the required fields');
            return;
        }

        createMutation.mutate({
            imagePath,
            playerName: formData.playerName,
            sport: formData.sport,
            year: formData.year,
            team: formData.team,
            cardNumber: formData.cardNumber,
            cardSet: formData.cardSet,
            grade: formData.grade,
            value: formData.value,
            purchasePrice: formData.purchasePrice,
            description: formData.description,
            ebayItemId: formData.ebayItemId,
        } as CardFormData);
    };

    const handleClose = () => {
        setStep('upload');
        setUploadedImage(null);
        setImagePath(null);
        setMatchResult(null);
        setFormData({});
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-overlay"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="modal-content max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-ig-border">
                        <h2 className="text-lg font-semibold text-ig-text">
                            {step === 'upload' && 'Add Card'}
                            {step === 'matching' && 'Analyzing Card...'}
                            {step === 'form' && (matchResult?.matched ? 'Confirm Card Details' : 'Enter Card Details')}
                            {step === 'success' && 'Card Added!'}
                        </h2>
                        <button onClick={handleClose} className="p-2 hover:bg-ig-surface rounded-full">
                            <X className="w-5 h-5 text-ig-text-secondary" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Upload step */}
                        {step === 'upload' && (
                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-photo bg-ig-surface border-2 border-dashed border-ig-border rounded-xl flex flex-col items-center justify-center gap-4 hover:border-ig-text-secondary transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-full bg-ig-elevated flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-ig-text-secondary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-ig-text font-medium">Take a photo or upload</p>
                                        <p className="text-sm text-ig-text-muted">CardShark will try to identify the card</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Matching step */}
                        {step === 'matching' && (
                            <div className="flex flex-col items-center py-12">
                                {uploadedImage && (
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded card"
                                        className="w-32 h-44 object-cover rounded-lg mb-6"
                                    />
                                )}
                                <Loader2 className="w-8 h-8 text-ig-primary animate-spin mb-4" />
                                <p className="text-ig-text-secondary">Analyzing your card...</p>
                                <p className="text-sm text-ig-text-muted">This may take a few seconds</p>
                            </div>
                        )}

                        {/* Form step */}
                        {step === 'form' && (
                            <div className="space-y-4">
                                {/* Match confidence indicator */}
                                {matchResult && (
                                    <div className={`p-3 rounded-lg flex items-center gap-3 ${matchResult.matched
                                        ? 'bg-ig-success/10 border border-ig-success/30'
                                        : 'bg-ig-warning/10 border border-ig-warning/30'
                                        }`}>
                                        {matchResult.matched ? (
                                            <Check className="w-5 h-5 text-ig-success" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-ig-warning" />
                                        )}
                                        <div>
                                            <p className={`text-sm font-medium ${matchResult.matched ? 'text-ig-success' : 'text-ig-warning'}`}>
                                                {matchResult.matched
                                                    ? `Match found (${matchResult.confidence}% confident)`
                                                    : 'No exact match found'}
                                            </p>
                                            <p className="text-xs text-ig-text-muted">
                                                {matchResult.matched
                                                    ? 'Please verify the details below'
                                                    : 'Please fill in the card details manually'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Image preview */}
                                {uploadedImage && (
                                    <div className="flex justify-center">
                                        <img
                                            src={uploadedImage}
                                            alt="Card preview"
                                            className="w-24 h-32 object-cover rounded-lg border border-ig-border"
                                        />
                                    </div>
                                )}

                                {/* Form fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-sm text-ig-text-secondary mb-1">Player Name *</label>
                                        <input
                                            type="text"
                                            value={formData.playerName || ''}
                                            onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                                            placeholder="e.g. Patrick Mahomes"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Sport *</label>
                                        <select
                                            value={formData.sport || ''}
                                            onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                                            className="select-ig"
                                        >
                                            <option value="">Select sport</option>
                                            {SPORTS.map((sport) => (
                                                <option key={sport} value={sport}>{sport}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Year</label>
                                        <input
                                            type="number"
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                                            placeholder="e.g. 2023"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Team</label>
                                        <input
                                            type="text"
                                            value={formData.team || ''}
                                            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                            placeholder="e.g. Chiefs"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Card Set</label>
                                        <input
                                            type="text"
                                            value={formData.cardSet || ''}
                                            onChange={(e) => setFormData({ ...formData, cardSet: e.target.value })}
                                            placeholder="e.g. Prizm"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Grade (1-10)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            value={formData.grade || ''}
                                            onChange={(e) => setFormData({ ...formData, grade: parseFloat(e.target.value) || undefined })}
                                            placeholder="e.g. 9.5"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Card #</label>
                                        <input
                                            type="text"
                                            value={formData.cardNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                                            placeholder="e.g. 123"
                                            className="input-ig"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Current Value</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-muted">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.value || ''}
                                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || undefined })}
                                                placeholder="0.00"
                                                className="input-ig pl-7"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-ig-text-secondary mb-1">Purchase Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-muted">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.purchasePrice || ''}
                                                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || undefined })}
                                                placeholder="0.00"
                                                className="input-ig pl-7"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm text-ig-text-secondary mb-1">Description</label>
                                        <textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Add notes about this card..."
                                            rows={2}
                                            className="input-ig resize-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-ig-like">{error}</p>
                                )}
                            </div>
                        )}

                        {/* Success step */}
                        {step === 'success' && (
                            <div className="flex flex-col items-center py-12">
                                <div className="w-16 h-16 rounded-full bg-ig-success/20 flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-ig-success" />
                                </div>
                                <p className="text-lg font-semibold text-ig-text">Card Added!</p>
                                <p className="text-sm text-ig-text-muted">Returning to your collection...</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step === 'form' && (
                        <div className="p-4 border-t border-ig-border">
                            <button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                                className="w-full btn-ig-primary flex items-center justify-center gap-2"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add to Collection'
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
