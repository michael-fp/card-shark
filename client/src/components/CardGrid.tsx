import { motion } from 'framer-motion';
import type { Card } from '../types';

interface CardGridProps {
    cards: Card[];
    onCardClick: (card: Card) => void;
}

export default function CardGrid({ cards, onCardClick }: CardGridProps) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    return (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {cards.map((card, index) => (
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
                        src={`${apiUrl}${card.image_path}`}
                        alt={card.player_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center text-white">
                            <p className="font-semibold text-sm line-clamp-1">{card.player_name}</p>
                            {card.value && (
                                <p className="text-xs opacity-80">${card.value.toFixed(2)}</p>
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
    );
}
