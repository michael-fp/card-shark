import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';
import type { Card, CardFilters } from '../types';
import CardGrid from '../components/CardGrid';
import CardModal from '../components/CardModal';
import FilterSheet from '../components/FilterSheet';

export default function Gallery() {
    const [filters, setFilters] = useState<CardFilters>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

    // Fetch cards
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['cards', filters, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.sport) params.append('sport', filters.sport);
            if (filters.year) params.append('year', String(filters.year));
            if (filters.team) params.append('team', filters.team);
            if (filters.gradeMin) params.append('gradeMin', String(filters.gradeMin));
            if (filters.gradeMax) params.append('gradeMax', String(filters.gradeMax));
            if (filters.valueMin) params.append('valueMin', String(filters.valueMin));
            if (filters.valueMax) params.append('valueMax', String(filters.valueMax));
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.order) params.append('order', filters.order);
            if (searchQuery) params.append('player', searchQuery);
            params.append('isWishlist', 'false');

            const response = await api.get(`/api/cards?${params.toString()}`);
            return response.data;
        },
    });

    // Fetch filter options
    const { data: filterOptions } = useQuery({
        queryKey: ['filterOptions'],
        queryFn: async () => {
            const response = await api.get('/api/cards/filters/options');
            return response.data;
        },
    });

    const cards = data?.cards || [];
    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen">
            {/* Search and filters bar */}
            <div className="sticky top-14 z-30 bg-ig-background border-b border-ig-border">
                <div className="max-w-screen-xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* Search input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-text-muted" />
                            <input
                                type="text"
                                placeholder="Search by player name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-ig pl-10 pr-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-ig-border rounded-full"
                                >
                                    <X className="w-4 h-4 text-ig-text-muted" />
                                </button>
                            )}
                        </div>

                        {/* Filter button */}
                        <button
                            onClick={() => setFilterSheetOpen(true)}
                            className="relative btn-ig-secondary flex items-center gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ig-primary text-white text-xs rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Active filters chips */}
                    {activeFilterCount > 0 && (
                        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
                            {filters.sport && (
                                <FilterChip
                                    label={filters.sport}
                                    onRemove={() => setFilters({ ...filters, sport: undefined })}
                                />
                            )}
                            {filters.year && (
                                <FilterChip
                                    label={`Year: ${filters.year}`}
                                    onRemove={() => setFilters({ ...filters, year: undefined })}
                                />
                            )}
                            {filters.team && (
                                <FilterChip
                                    label={filters.team}
                                    onRemove={() => setFilters({ ...filters, team: undefined })}
                                />
                            )}
                            {(filters.gradeMin || filters.gradeMax) && (
                                <FilterChip
                                    label={`Grade: ${filters.gradeMin || 1}-${filters.gradeMax || 10}`}
                                    onRemove={() => setFilters({ ...filters, gradeMin: undefined, gradeMax: undefined })}
                                />
                            )}
                            <button
                                onClick={clearFilters}
                                className="text-xs text-ig-primary hover:text-ig-primary-hover whitespace-nowrap"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Card grid */}
            <div className="max-w-screen-xl mx-auto px-4 py-4">
                {isLoading ? (
                    <CardGridSkeleton />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-ig-text-secondary mb-4">Failed to load cards</p>
                        <button onClick={() => refetch()} className="btn-ig-primary">
                            Try Again
                        </button>
                    </div>
                ) : cards.length === 0 ? (
                    <EmptyState hasFilters={activeFilterCount > 0 || !!searchQuery} />
                ) : (
                    <>
                        <p className="text-sm text-ig-text-muted mb-4">
                            {data?.pagination?.total || cards.length} cards
                        </p>
                        <CardGrid cards={cards} onCardClick={setSelectedCard} />
                    </>
                )}
            </div>

            {/* Card detail modal */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onUpdate={refetch}
                />
            )}

            {/* Filter sheet */}
            <FilterSheet
                isOpen={filterSheetOpen}
                onClose={() => setFilterSheetOpen(false)}
                filters={filters}
                onChange={setFilters}
                options={filterOptions}
            />
        </div>
    );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ig-surface border border-ig-border rounded-full text-sm">
            <span className="text-ig-text">{label}</span>
            <button
                onClick={onRemove}
                className="p-0.5 hover:bg-ig-border rounded-full"
            >
                <X className="w-3 h-3 text-ig-text-muted" />
            </button>
        </div>
    );
}

function CardGridSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square skeleton" />
            ))}
        </div>
    );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🦈</span>
            <h3 className="text-lg font-semibold text-ig-text mb-2">
                {hasFilters ? 'No cards found' : 'Start Your Collection'}
            </h3>
            <p className="text-ig-text-secondary max-w-xs">
                {hasFilters
                    ? 'Try adjusting your filters or search query'
                    : 'Tap the + button to add your first card'}
            </p>
        </div>
    );
}
