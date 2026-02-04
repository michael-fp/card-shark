import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Card } from '../types';

interface CardGridProps {
    cards: Card[];
    onCardClick: (card: Card) => void;
    pageSize?: number; // Cards per page for infinite scroll
}

const INITIAL_LOAD = 12;

export default function CardGrid({ cards, onCardClick, pageSize = 12 }: CardGridProps) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
    const [isLoading, setIsLoading] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Reset visible count when cards change
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD);
    }, [cards.length]);

    // Infinite scroll with IntersectionObserver
    const loadMore = useCallback(() => {
        if (visibleCount >= cards.length || isLoading) return;

        setIsLoading(true);
        // Simulate network delay for smooth UX
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + pageSize, cards.length));
            setIsLoading(false);
        }, 300);
    }, [visibleCount, cards.length, pageSize, isLoading]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    // Helper to get the correct image URL
    const getImageUrl = (card: Card) => {
        // Demo cards use paths starting with /demo-cards which are served from public/
        if (card.image_path.startsWith('/demo-cards/')) {
            return card.image_path;
        }
        // API uploaded images need the API URL prefix
        return `${apiUrl}${card.image_path}`;
    };

    const visibleCards = cards.slice(0, visibleCount);
    const hasMore = visibleCount < cards.length;

    return (
        <div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {visibleCards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className="card-thumbnail group"
                        onClick={() => onCardClick(card)}
                    >
                        {/* Card image */}
                        <img
                            src={getImageUrl(card)}
                            alt={card.player_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                                <p className="font-semibold text-sm line-clamp-1">{card.player_name}</p>
                                {card.value && (
                                    <p className="text-xs opacity-80">${Number(card.value).toFixed(2)}</p>
                                )}
                            </div>
                        </div>

                        {/* Grade badge */}
                        {card.grade && (
                            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold grade-${Math.floor(card.grade)}`}>
                                {card.grade}
                            </div>
                        )}

                        {/* Description overlay (shown on bottom) */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            {card.description && (
                                <p className="text-xs text-white/80 line-clamp-2">{card.description}</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Load more trigger */}
            {hasMore && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {isLoading ? (
                        <div className="flex gap-2">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-3 h-3 rounded-full bg-ig-primary animate-bounce"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    ) : (
                        <span className="text-ig-text-muted text-sm">Scroll for more...</span>
                    )}
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && cards.length > INITIAL_LOAD && (
                <div className="py-6 text-center">
                    <p className="text-ig-text-muted text-sm">
                        ✓ Showing all {cards.length} cards
                    </p>
                </div>
            )}
        </div>
    );
}
