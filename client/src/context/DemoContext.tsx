import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { DEMO_CARDS, DEMO_USAGE, DEMO_USER } from '../data/demoData';
import type { Card, CollectionStats, User } from '../types';

interface DemoContextType {
    isDemoMode: boolean;
    enableDemoMode: () => void;
    disableDemoMode: () => void;
    toggleDemoMode: () => void;
    demoCards: Card[];
    demoStats: CollectionStats;
    demoUsage: typeof DEMO_USAGE;
    demoUser: User;
    // Demo CRUD operations
    addDemoCard: (card: Partial<Card>) => Card;
    updateDemoCard: (id: string, updates: Partial<Card>) => Card | null;
    deleteDemoCard: (id: string) => boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(() => {
        // Check localStorage for demo mode preference
        return localStorage.getItem('cardshark_demo_mode') === 'true';
    });

    const [demoCards, setDemoCards] = useState<Card[]>(DEMO_CARDS as Card[]);

    const enableDemoMode = useCallback(() => {
        localStorage.setItem('cardshark_demo_mode', 'true');
        setIsDemoMode(true);
        setDemoCards(DEMO_CARDS as Card[]);
    }, []);

    const disableDemoMode = useCallback(() => {
        localStorage.removeItem('cardshark_demo_mode');
        setIsDemoMode(false);
    }, []);

    const toggleDemoMode = useCallback(() => {
        if (isDemoMode) {
            disableDemoMode();
        } else {
            enableDemoMode();
        }
    }, [isDemoMode, enableDemoMode, disableDemoMode]);

    // Demo CRUD operations
    const addDemoCard = useCallback((card: Partial<Card>): Card => {
        const newCard: Card = {
            id: `demo-${Date.now()}`,
            image_path: card.image_path || '/api/demo/images/rookie-card.jpg',
            description: card.description || '',
            sport: card.sport || 'Football',
            year: card.year || new Date().getFullYear(),
            player_name: card.player_name || 'New Player',
            team: card.team || 'Unknown Team',
            card_number: card.card_number || null,
            card_set: card.card_set || 'Unknown Set',
            grade: card.grade || null,
            value: card.value || null,
            purchase_price: card.purchase_price || null,
            is_wishlist: card.is_wishlist || false,
            ebay_item_id: card.ebay_item_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setDemoCards(prev => [newCard, ...prev]);
        return newCard;
    }, []);

    const updateDemoCard = useCallback((id: string, updates: Partial<Card>): Card | null => {
        let updatedCard: Card | null = null;
        setDemoCards(prev => prev.map(card => {
            if (card.id === id) {
                updatedCard = { ...card, ...updates, updated_at: new Date().toISOString() };
                return updatedCard;
            }
            return card;
        }));
        return updatedCard;
    }, []);

    const deleteDemoCard = useCallback((id: string): boolean => {
        setDemoCards(prev => prev.filter(card => card.id !== id));
        return true;
    }, []);

    // Recalculate stats based on current demo cards
    const demoStats: CollectionStats = {
        overview: {
            totalCards: demoCards.filter(c => !c.is_wishlist).length,
            totalValue: demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.value || 0), 0),
            totalCost: demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.purchase_price || 0), 0),
            profit: demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.value || 0), 0) -
                demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.purchase_price || 0), 0),
            profitPercent: (() => {
                const cost = demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.purchase_price || 0), 0);
                const value = demoCards.filter(c => !c.is_wishlist).reduce((sum, c) => sum + (c.value || 0), 0);
                return cost > 0 ? ((value - cost) / cost) * 100 : 0;
            })(),
            avgGrade: (() => {
                const graded = demoCards.filter(c => c.grade && !c.is_wishlist);
                return graded.length > 0
                    ? graded.reduce((sum, c) => sum + c.grade!, 0) / graded.length
                    : 0;
            })(),
            avgValue: (() => {
                const valued = demoCards.filter(c => c.value && !c.is_wishlist);
                return valued.length > 0
                    ? valued.reduce((sum, c) => sum + c.value!, 0) / valued.length
                    : 0;
            })(),
            wishlistCount: demoCards.filter(c => c.is_wishlist).length,
        },
        bySport: (() => {
            const sports = new Map<string, { count: number; totalValue: number }>();
            demoCards.filter(c => !c.is_wishlist).forEach(card => {
                const existing = sports.get(card.sport) || { count: 0, totalValue: 0 };
                sports.set(card.sport, {
                    count: existing.count + 1,
                    totalValue: existing.totalValue + (card.value || 0),
                });
            });
            return Array.from(sports.entries()).map(([sport, data]) => ({
                sport,
                ...data,
            })).sort((a, b) => b.totalValue - a.totalValue);
        })(),
        byGrade: (() => {
            const grades = new Map<number, number>();
            demoCards.filter(c => c.grade && !c.is_wishlist).forEach(card => {
                const grade = Math.floor(card.grade!);
                grades.set(grade, (grades.get(grade) || 0) + 1);
            });
            return Array.from(grades.entries()).map(([grade, count]) => ({
                grade,
                count,
            })).sort((a, b) => a.grade - b.grade);
        })(),
        byYear: (() => {
            const years = new Map<number, { count: number; totalValue: number }>();
            demoCards.filter(c => c.year && !c.is_wishlist).forEach(card => {
                const existing = years.get(card.year!) || { count: 0, totalValue: 0 };
                years.set(card.year!, {
                    count: existing.count + 1,
                    totalValue: existing.totalValue + (card.value || 0),
                });
            });
            return Array.from(years.entries()).map(([year, data]) => ({
                year,
                ...data,
            })).sort((a, b) => b.year - a.year);
        })(),
        topCards: demoCards.filter(c => !c.is_wishlist)
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .slice(0, 5),
        recentCards: demoCards.filter(c => !c.is_wishlist)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5),
    };

    const value: DemoContextType = {
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        toggleDemoMode,
        demoCards,
        demoStats,
        demoUsage: DEMO_USAGE,
        demoUser: DEMO_USER as User,
        addDemoCard,
        updateDemoCard,
        deleteDemoCard,
    };

    return (
        <DemoContext.Provider value={value}>
            {children}
        </DemoContext.Provider>
    );
}

export function useDemo() {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemo must be used within a DemoProvider');
    }
    return context;
}
