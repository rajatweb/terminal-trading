
import { create } from 'zustand';
import { TerminalState, WatchlistGroup, Position, OptionStrike, WatchlistItem, OrderModalState, Order } from '@/types/terminal';

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
    placeOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void;
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
    orders: [],
    marginAvailable: 145200.00,
    marginUsed: 12400.00,
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
    placeOrder: (orderRequest) => set((state) => {
        const orderValue = orderRequest.qty * orderRequest.price;
        // Simple margin calc: deduct for buy, add for sell (simplified)
        const newMarginAvailable = state.marginAvailable + (orderRequest.type === 'BUY' ? -orderValue : orderValue);
        const newMarginUsed = state.marginUsed + (orderRequest.type === 'BUY' ? orderValue : -orderValue);

        const newOrder: Order = {
            ...orderRequest,
            id: Math.random().toString(36).substr(2, 9),
            status: 'EXECUTED',
            timestamp: Date.now(),
        };

        let newPositions = [...state.positions];
        const existingPosIndex = newPositions.findIndex(p => p.symbol === orderRequest.symbol);

        if (existingPosIndex > -1) {
            const pos = newPositions[existingPosIndex];
            if (orderRequest.type === pos.type) {
                const newQty = pos.qty + orderRequest.qty;
                const newAvg = ((pos.qty * pos.entryPrice) + (orderRequest.qty * orderRequest.price)) / newQty;
                newPositions[existingPosIndex] = { ...pos, qty: newQty, entryPrice: newAvg };
            } else {
                if (orderRequest.qty <= pos.qty) {
                    const newQty = pos.qty - orderRequest.qty;
                    if (newQty === 0) {
                        newPositions = newPositions.filter((_, i) => i !== existingPosIndex);
                    } else {
                        newPositions[existingPosIndex] = { ...pos, qty: newQty };
                    }
                } else {
                    newPositions = newPositions.filter((_, i) => i !== existingPosIndex);
                    newPositions.push({
                        symbol: orderRequest.symbol,
                        qty: orderRequest.qty - pos.qty,
                        entryPrice: orderRequest.price,
                        currentPrice: orderRequest.price,
                        pnl: 0,
                        pnlPercent: 0,
                        type: orderRequest.type,
                        status: 'ACTIVE'
                    });
                }
            }
        } else {
            newPositions.push({
                symbol: orderRequest.symbol,
                qty: orderRequest.qty,
                entryPrice: orderRequest.price,
                currentPrice: orderRequest.price,
                pnl: 0,
                pnlPercent: 0,
                type: orderRequest.type,
                status: 'ACTIVE'
            });
        }

        return {
            orders: [newOrder, ...state.orders],
            marginAvailable: newMarginAvailable,
            marginUsed: newMarginUsed,
            positions: newPositions
        };
    }),
}));
