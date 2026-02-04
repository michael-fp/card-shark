import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { CardFilters } from '../types';

interface FilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: CardFilters;
    onChange: (filters: CardFilters) => void;
    options?: {
        sports: string[];
        years: number[];
        teams: string[];
        grades: number[];
    };
}

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Date Added' },
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'player_name', label: 'Player Name' },
    { value: 'value', label: 'Value' },
    { value: 'grade', label: 'Grade' },
    { value: 'year', label: 'Year' },
];

export default function FilterSheet({ isOpen, onClose, filters, onChange, options }: FilterSheetProps) {
    const update = (key: keyof CardFilters, value: any) => {
        onChange({ ...filters, [key]: value || undefined });
    };

    const clearAll = () => {
        onChange({});
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-ig-background border-l border-ig-border"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-ig-border">
                            <h2 className="text-lg font-semibold text-ig-text">Filters</h2>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={clearAll}
                                    className="text-sm text-ig-primary hover:text-ig-primary-hover"
                                >
                                    Clear All
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-ig-surface rounded-full">
                                    <X className="w-5 h-5 text-ig-text-secondary" />
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-65px)]">
                            {/* Sport */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Sport</label>
                                <div className="flex flex-wrap gap-2">
                                    {options?.sports?.map((sport) => (
                                        <button
                                            key={sport}
                                            onClick={() => update('sport', filters.sport === sport ? undefined : sport)}
                                            className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.sport === sport
                                                ? 'bg-ig-primary text-white'
                                                : 'bg-ig-surface text-ig-text-secondary hover:bg-ig-elevated'
                                                }`}
                                        >
                                            {sport}
                                        </button>
                                    )) || (
                                            <>
                                                {['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer'].map((sport) => (
                                                    <button
                                                        key={sport}
                                                        onClick={() => update('sport', filters.sport === sport ? undefined : sport)}
                                                        className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.sport === sport
                                                            ? 'bg-ig-primary text-white'
                                                            : 'bg-ig-surface text-ig-text-secondary hover:bg-ig-elevated'
                                                            }`}
                                                    >
                                                        {sport}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                </div>
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Year</label>
                                <select
                                    value={filters.year || ''}
                                    onChange={(e) => update('year', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="select-ig"
                                >
                                    <option value="">All years</option>
                                    {options?.years?.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    )) || (
                                            Array.from({ length: 30 }, (_, i) => 2024 - i).map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))
                                        )}
                                </select>
                            </div>

                            {/* Team */}
                            {options?.teams && options.teams.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-ig-text mb-2">Team</label>
                                    <select
                                        value={filters.team || ''}
                                        onChange={(e) => update('team', e.target.value || undefined)}
                                        className="select-ig"
                                    >
                                        <option value="">All teams</option>
                                        {options.teams.map((team) => (
                                            <option key={team} value={team}>{team}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Grade Range */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Grade Range</label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={filters.gradeMin || ''}
                                        onChange={(e) => update('gradeMin', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="select-ig flex-1"
                                    >
                                        <option value="">Min</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                    <span className="text-ig-text-muted">to</span>
                                    <select
                                        value={filters.gradeMax || ''}
                                        onChange={(e) => update('gradeMax', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="select-ig flex-1"
                                    >
                                        <option value="">Max</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Value Range */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Value Range</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-muted">$</span>
                                        <input
                                            type="number"
                                            value={filters.valueMin || ''}
                                            onChange={(e) => update('valueMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="Min"
                                            className="input-ig pl-7"
                                        />
                                    </div>
                                    <span className="text-ig-text-muted">to</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-muted">$</span>
                                        <input
                                            type="number"
                                            value={filters.valueMax || ''}
                                            onChange={(e) => update('valueMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="Max"
                                            className="input-ig pl-7"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Favorites Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Favorites</label>
                                <button
                                    onClick={() => update('isFavorite', filters.isFavorite ? undefined : true)}
                                    className={`px-4 py-2 rounded-full text-sm transition-colors ${filters.isFavorite
                                        ? 'bg-ig-like text-white'
                                        : 'bg-ig-surface text-ig-text-secondary hover:bg-ig-elevated'
                                        }`}
                                >
                                    ❤️ Show Only Favorites
                                </button>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-sm font-medium text-ig-text mb-2">Sort By</label>
                                <div className="flex gap-2">
                                    <select
                                        value={filters.sort || 'created_at'}
                                        onChange={(e) => update('sort', e.target.value as CardFilters['sort'])}
                                        className="select-ig flex-1"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => update('order', filters.order === 'asc' ? 'desc' : 'asc')}
                                        className={`px-4 py-2 rounded-lg border transition-colors ${filters.order === 'asc'
                                            ? 'bg-ig-surface border-ig-border text-ig-text'
                                            : 'bg-ig-elevated border-ig-border text-ig-text-secondary'
                                            }`}
                                    >
                                        {filters.order === 'asc' ? '↑ Asc' : '↓ Desc'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
