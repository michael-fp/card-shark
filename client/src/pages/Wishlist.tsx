import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import api from '../services/api';
import type { Card } from '../types';
import CardGrid from '../components/CardGrid';
import CardModal from '../components/CardModal';
import { motion } from 'framer-motion';
import { useDemo } from '../context/DemoContext';

export default function Wishlist() {
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const { isDemoMode, demoCards } = useDemo();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const response = await api.get('/api/cards?isWishlist=true');
            return response.data;
        },
        enabled: !isDemoMode,
    });

    // Get wishlist cards in demo mode
    const demoWishlistCards = useMemo(() => {
        if (!isDemoMode) return [];
        return demoCards.filter(c => c.is_wishlist);
    }, [isDemoMode, demoCards]);

    const cards = isDemoMode ? demoWishlistCards : (data?.cards || []);

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ig-text flex items-center gap-2">
                    <Heart className="w-6 h-6 text-ig-like" />
                    Wishlist
                </h1>
                <p className="text-ig-text-secondary">Cards you're looking to add</p>
            </div>

            {/* Content */}
            {isLoading && !isDemoMode ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square skeleton" />
                    ))}
                </div>
            ) : cards.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-ig-surface flex items-center justify-center mb-4">
                        <Heart className="w-10 h-10 text-ig-text-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-ig-text mb-2">No Wishlist Cards</h3>
                    <p className="text-ig-text-secondary max-w-xs">
                        Tap the heart icon on any card to add it to your wishlist
                    </p>
                </motion.div>
            ) : (
                <>
                    <p className="text-sm text-ig-text-muted mb-4">
                        {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                    </p>
                    <CardGrid cards={cards} onCardClick={setSelectedCard} />
                </>
            )}

            {/* Card modal */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onUpdate={refetch}
                />
            )}
        </div>
    );
}
