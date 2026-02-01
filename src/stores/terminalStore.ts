
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
    exitPosition: (symbol: string) => void;
    exitAllPositions: () => void;
    addWatchlistSection: (watchlistId: string, sectionName: string) => void;
    reorderWatchlist: (watchlistId: string, newOrder: WatchlistItem[]) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
    activeSymbol: 'NIFTY',
    activeWatchlistId: 'default',
    watchlists: [
        {
            id: 'default',
            name: 'Indices',
            items: []
        },
        {
            id: 'stocks',
            name: 'Stocks',
            items: []
        }
    ],
    positions: [],
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

    exitPosition: (symbol) => set((state) => {
        const position = state.positions.find(p => p.symbol === symbol);
        if (!position) return state;

        const exitOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: position.symbol,
            type: position.type === 'BUY' ? 'SELL' : 'BUY',
            instrumentType: 'EQUITY',
            product: 'MIS',
            orderType: 'MARKET',
            qty: position.qty,
            price: position.currentPrice,
            status: 'EXECUTED',
            timestamp: Date.now()
        };

        const releaseMargin = position.currentPrice * position.qty;

        return {
            orders: [exitOrder, ...state.orders],
            positions: state.positions.filter(p => p.symbol !== symbol),
            marginAvailable: state.marginAvailable + releaseMargin,
            marginUsed: Math.max(0, state.marginUsed - releaseMargin)
        };
    }),
    exitAllPositions: () => set((state) => {
        if (state.positions.length === 0) return state;

        const exitOrders: Order[] = state.positions.map(position => ({
            id: Math.random().toString(36).substr(2, 9),
            symbol: position.symbol,
            type: position.type === 'BUY' ? 'SELL' : 'BUY',
            instrumentType: 'EQUITY',
            product: 'MIS',
            orderType: 'MARKET',
            qty: position.qty,
            price: position.currentPrice,
            status: 'EXECUTED',
            timestamp: Date.now()
        }));

        let totalReleaseMargin = 0;
        state.positions.forEach(p => {
            totalReleaseMargin += p.currentPrice * p.qty;
        });

        return {
            orders: [...exitOrders, ...state.orders],
            positions: [],
            marginAvailable: state.marginAvailable + totalReleaseMargin,
            marginUsed: 0
        };
    }),
    addWatchlistSection: (watchlistId, sectionName) => set((state) => ({
        watchlists: state.watchlists.map(w => {
            if (w.id !== watchlistId) return w;
            return {
                ...w,
                items: [
                    ...w.items,
                    {
                        id: `section-${Math.random()}`,
                        type: 'SECTION',
                        sectionLabel: sectionName,
                        symbol: '', // Dummy values to satisfy interface
                        price: 0,
                        change: 0,
                        changePercent: 0,
                        exchange: '',
                        isUp: false
                    }
                ]
            };
        })
    })),
    reorderWatchlist: (watchlistId, newOrder) => set((state) => ({
        watchlists: state.watchlists.map(w =>
            w.id === watchlistId ? { ...w, items: newOrder } : w
        )
    }))
}));
