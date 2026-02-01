
import { create } from 'zustand';
import { TerminalState, WatchlistGroup, Position, OptionStrike, WatchlistItem, OrderModalState } from '@/types/terminal';

interface TerminalStore extends TerminalState {
    setSymbol: (symbol: string) => void;
    addWatchlist: (group: WatchlistGroup) => void;
    setActiveWatchlist: (id: string) => void;
    updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => void;
    addPosition: (position: Position) => void;
    setPositions: (positions: Position[]) => void;
    updateOptionChain: (data: OptionStrike[]) => void;
    openOrderModal: (config: Omit<OrderModalState, 'isOpen'>) => void;
    closeOrderModal: () => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
    activeSymbol: 'NIFTY',
    activeWatchlistId: 'default',
    watchlists: [
        {
            id: 'default',
            name: 'Indices',
            items: [
                { symbol: 'NIFTY', price: 21750.40, change: 125.20, changePercent: 0.58, exchange: 'NSE', isUp: true },
                { symbol: 'BANKNIFTY', price: 45600.15, change: -45.60, changePercent: -0.10, exchange: 'NSE', isUp: false },
                { symbol: 'FINNIFTY', price: 20400.00, change: 12.00, changePercent: 0.06, exchange: 'NSE', isUp: true },
            ]
        },
        {
            id: 'stocks',
            name: 'Stocks',
            items: [
                { symbol: 'RELIANCE', price: 2950.00, change: 15.40, changePercent: 0.52, exchange: 'NSE', isUp: true },
                { symbol: 'HDFCBANK', price: 1450.80, change: -12.30, changePercent: -0.84, exchange: 'NSE', isUp: false },
                { symbol: 'TCS', price: 3800.00, change: 45.00, changePercent: 1.20, exchange: 'NSE', isUp: true },
            ]
        }
    ],
    positions: [
        { symbol: 'RELIANCE', qty: 10, entryPrice: 2900, currentPrice: 2950, pnl: 500, pnlPercent: 1.72, type: 'BUY', status: 'ACTIVE' }
    ],
    optionChain: [],
    orderModal: {
        isOpen: false,
        symbol: '',
        type: 'BUY',
        instrumentType: 'EQUITY',
        price: 0,
        ltp: 0,
    },

    setSymbol: (symbol) => set({ activeSymbol: symbol }),

    addWatchlist: (group) => set((state) => ({
        watchlists: [...state.watchlists, group]
    })),

    setActiveWatchlist: (id) => set({ activeWatchlistId: id }),

    updateWatchlistItem: (symbol, updates) => set((state) => ({
        watchlists: state.watchlists.map(w => ({
            ...w,
            items: w.items.map(i => i.symbol === symbol ? { ...i, ...updates } : i)
        }))
    })),

    addPosition: (pos) => set((state) => ({
        positions: [...state.positions, pos]
    })),

    setPositions: (positions) => set({ positions }),

    updateOptionChain: (data) => set({ optionChain: data }),

    openOrderModal: (config) => set({ orderModal: { ...config, isOpen: true } }),
    closeOrderModal: () => set((state) => ({ orderModal: { ...state.orderModal, isOpen: false } })),
}));
