
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { soundManager } from '../stores/sound';

import { BrokerName, DhanConfig, GrowwConfig } from '@/types/broker';
import { WatchlistGroup, OptionStrike, OrderModalState, WatchlistItem } from '@/types/terminal';
import { getSymbolConfig, SYMBOL_MAP } from '@/lib/dhan/symbols';
import { ChartSettings, DEFAULT_CHART_SETTINGS } from '@/types/chart';


// ============================================
// TYPES & INTERFACES
// ============================================



export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
export type ProductType = 'CNC' | 'MIS' | 'NRML';

export interface Order {
    orderId: string;
    securityId: string;
    symbol: string;
    exchange: string;
    segment: string;
    side: OrderSide;
    orderType: OrderType;
    productType: ProductType;
    quantity: number;
    price: number; // Limit/SL price
    triggerPrice?: number; // For SL orders
    status: OrderStatus;
    filledQty: number;
    avgPrice: number;
    timestamp: number;
    executedAt?: number;
    rejectionReason?: string;
    marginBlocked?: number;
}

export interface Position {
    securityId: string;
    symbol: string;
    exchange: string;
    segment: string;
    productType: ProductType;
    quantity: number; // Net quantity (actual units, lots * lotSize for F&O)
    buyQty: number;   // Actual units
    sellQty: number;  // Actual units
    avgBuyPrice: number;
    avgSellPrice: number;
    ltp: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;
    lotSize: number; // Stored lot size
    marginUsed: number; // Margin blocked for this position
    isHedged?: boolean; // Indicates if the position is part of a hedge
}

export interface TradeLog {
    id: string;
    symbol: string;
    exchange: string;
    segment: string;
    productType: ProductType;
    quantity: number; // lots or shares
    lotSize: number;
    buyPrice: number;
    sellPrice: number;
    realizedPnl: number;
    charges?: number;
    netPnl?: number;
    timestamp: number;
    type: 'LONG_CLOSE' | 'SHORT_CLOSE';
}

export interface DailyStats {
    date: string; // YYYY-MM-DD
    realizedPnl: number;
    tradeCount: number;
}

export interface MarginRequirement {
    securityId: string;
    symbol: string;
    orderType: OrderType;
    productType: ProductType;
    quantity: number;
    price: number;
    requiredMargin: number;
    availableMargin: number;
    sufficient: boolean;
    isHedged?: boolean; // New field to indicate hedge benefit
}

export interface AccountSummary {
    totalCapital: number;
    availableMargin: number;
    usedMargin: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;
    marginUtilization: number; // Percentage
}

export interface BasketItem {
    id: string; // Unique ID for the item in basket
    securityId: string;
    symbol: string;
    exchange: string;
    segment: string;
    side: 'BUY' | 'SELL';
    productType: ProductType;
    orderType: OrderType;
    quantity: number; // In lots
    price: number;
    ltp: number;
}

// ============================================
// LOT SIZE MAPPING (F&O Contracts)
// ============================================

// Lot sizes for different F&O instruments (Updated as of 2026)
const LOT_SIZE_MAP: Record<string, number> = {
    // Index Options (NSE)
    'NIFTY': 65,
    'BANKNIFTY': 30,
    'FINNIFTY': 40,
    'MIDCPNIFTY': 75,
    'SENSEX': 20,
    'BANKEX': 15,

    // Commodity Options (MCX)
    'CRUDEOIL': 100,
    'NATURALGAS': 1250,
    'GOLD': 100,
    'GOLDM': 10,
    'SILVER': 30,
    'SILVERM': 5,
    'COPPER': 1000,
    'ZINC': 5000,
    'LEAD': 5000,
    'ALUMINIUM': 5000,
    'NICKEL': 250,
};

// Helper function to get lot size
export const getLotSize = (symbol: string, segment: string): number => {
    // For equity, lot size is 1
    if (segment.includes('_EQ') || segment === 'NSE_EQ' || segment === 'BSE_EQ') {
        return 1;
    }

    const baseSymbol = symbol.toUpperCase(); // Ensure uppercase

    // Check in lot size map - sort by key length desc to avoid partial matches (e.g. NIFTY matching BANKNIFTY)
    const sortedKeys = Object.keys(LOT_SIZE_MAP).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
        if (baseSymbol.includes(key)) {
            return LOT_SIZE_MAP[key];
        }
    }

    // Default lot size for unknown F&O contracts
    return 1;
};

// Helper to get instrument details
export const getInstrumentDetails = (symbol: string, segment: string) => {
    const lotSize = getLotSize(symbol, segment);
    const isEquity = segment.includes('_EQ');
    const isOptions = segment.includes('_FNO') || segment.includes('NFO') || segment.includes('BFO');
    const isFutures = segment.includes('_FUT');
    const isCommodity = segment.includes('MCX');

    return {
        lotSize,
        isEquity,
        isOptions,
        isFutures,
        isCommodity,
        contractType: isEquity ? 'Equity' : isOptions ? 'Options' : isFutures ? 'Futures' : 'Commodity'
    };
};

export interface TerminalSettings {
    interval: string;
    fromDate: string;
    toDate: string;
}

// ============================================
// STORE INTERFACE
// ============================================

export type FeedStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface TradingStore {
    // Watchlist
    watchlist: WatchlistItem[];
    addToWatchlist: (item: WatchlistItem) => void;
    removeFromWatchlist: (securityId: string) => void;
    updateWatchlistPrices: (updates: Partial<WatchlistItem>[]) => void;
    reorderWatchlist: (items: WatchlistItem[]) => void;

    // Orders
    orders: Order[];
    placeOrder: (order: Omit<Order, 'orderId' | 'timestamp' | 'status' | 'filledQty' | 'avgPrice'>) => string;
    cancelOrder: (orderId: string) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus, filledQty?: number, avgPrice?: number) => void;
    getOrdersByStatus: (status: OrderStatus) => Order[];
    getPendingOrders: () => Order[];
    checkAndTriggerSLOrders: () => void;

    // Positions
    positions: Position[];
    tradeHistory: TradeLog[];
    dailyStats: DailyStats[];
    updatePosition: (securityId: string, ltp: number) => void;
    closePosition: (securityId: string) => void;
    getPositionBySecurityId: (securityId: string) => Position | undefined;
    convertPosition: (securityId: string, toProductType: ProductType) => void;
    exitAllPositions: () => void;

    // Basket
    basket: BasketItem[];
    addToBasket: (item: BasketItem) => void;
    removeFromBasket: (id: string) => void;
    updateBasketItem: (id: string, updates: Partial<BasketItem>) => void;
    clearBasket: () => void;

    // Account & Margin
    account: AccountSummary;
    calculateMargin: (order: Omit<Order, 'orderId' | 'timestamp' | 'status' | 'filledQty' | 'avgPrice'>) => MarginRequirement;
    updateAccountSummary: () => void;

    // Broker Connection
    isConnected: boolean;
    feedStatus: FeedStatus;
    brokerCredentials: { clientId: string; accessToken: string } | null;
    connectBroker: (clientId: string, accessToken: string) => void;
    disconnectBroker: () => void;
    setFeedStatus: (status: FeedStatus) => void;

    // Utilities
    reset: () => void;
    addFunds: (amount: number) => void;
    checkAutoSquareOff: () => void;
    getInstrumentDetails: (symbol: string, segment: string) => ReturnType<typeof getInstrumentDetails>;

    // Settlement
    lastSettlementDate: string;
    performDailySettlement: () => void;

    // Charges
    getEstimatedCharges: (params: {
        symbol: string;
        segment: string;
        productType: string;
        orderType: string;
        quantity: number;
        price: number;
        side: 'BUY' | 'SELL';
        exchange?: string;
    }) => {
        total: number;
        brokerage: number;
        stt: number;
        exchangeTxn: number;
        gst: number;
        sebi: number;
        stampDuty: number;
    };

    // Internal
    executeOrder: (order: Order) => void;

    // Terminal / UI specific
    activeSymbol: string;
    setSymbol: (symbol: string) => void;
    activeExpiry: string;
    expiries: string[];
    activeWatchlistId: string;
    watchlists: WatchlistGroup[];
    optionChain: OptionStrike[];
    orderModal: OrderModalState;
    activeBroker: BrokerName | null;
    dhanConfig: DhanConfig | null;
    growwConfig: GrowwConfig | null;
    isAuthenticated: boolean;

    addWatchlistGroup: (group: WatchlistGroup) => void;
    setActiveWatchlist: (id: string) => void;
    updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => void;
    addSection: (name: string) => void;
    addSymbolToWatchlist: (item: WatchlistItem) => void;
    removeSymbolFromWatchlist: (index: number) => void;
    reorderWatchlistGroup: (startIndex: number, endIndex: number) => void;
    updateOptionChain: (data: OptionStrike[]) => void;
    openOrderModal: (config: Omit<OrderModalState, 'isOpen'>) => void;
    closeOrderModal: () => void;
    fetchOptionChain: (expiry?: string) => Promise<void>;

    // Terminal Settings
    terminalSettings: TerminalSettings;
    updateTerminalSettings: (settings: Partial<TerminalSettings>) => void;

    // Chart Settings
    chartSettings: ChartSettings;
    updateChartSettings: (settings: Partial<ChartSettings>) => void;
}



// ============================================
// INITIAL STATE
// ============================================

const initialAccount: AccountSummary = {
    totalCapital: 500000, // Default paper trading capital
    availableMargin: 500000,
    usedMargin: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    totalPnl: 0,
    marginUtilization: 0
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

// ============================================
// CHARGES CALCULATOR
// ============================================

// Internal helper for single leg calculation
const calculateLegCharges = (
    price: number,
    quantity: number,
    productType: string,
    segment: string,
    side: 'BUY' | 'SELL',
    exchange: string = 'NSE',
    instrumentType: { isEquity: boolean; isFutures: boolean; isOptions: boolean }
) => {
    let brokerage = 0;
    let stt = 0;
    let exchangeTxn = 0;
    let stampDuty = 0;

    const turnover = price * quantity;
    const { isEquity, isFutures, isOptions } = instrumentType;

    // 1. BROKERAGE (Flat ₹20 per executed order, free for Equity Delivery)
    if (productType === 'CNC' && isEquity) {
        brokerage = 0;
    } else {
        brokerage = 20;
    }

    // 2. STT (Securities Transaction Tax)
    if (isEquity) {
        if (productType === 'CNC') {
            // Delivery: 0.1% on Buy & Sell
            stt = turnover * 0.001;
        } else {
            // Intraday: 0.025% on Sell only
            if (side === 'SELL') stt = turnover * 0.00025;
        }
    } else if (isFutures) {
        // Futures: 0.02% on Sell (Updated 2025)
        if (side === 'SELL') stt = turnover * 0.0002;
    } else if (isOptions) {
        // Options: 0.1% on Sell of Premium (Updated 2025)
        if (side === 'SELL') stt = turnover * 0.001;
    }

    // 3. EXCHANGE TRANSACTION CHARGES
    if (isEquity) {
        exchangeTxn = turnover * 0.0000325; // NSE Equity
    } else if (isFutures) {
        exchangeTxn = turnover * 0.00002; // NSE Futures
    } else if (isOptions) {
        exchangeTxn = turnover * 0.00053; // NSE Options (on Premium)
    } else if (exchange === 'MCX') {
        exchangeTxn = turnover * 0.000026; // MCX approx
    }

    // 4. SEBI CHARGES (₹10 per crore = 0.0001%)
    const sebi = turnover * 0.000001;

    // 5. STAMP DUTY (Buy only)
    if (side === 'BUY') {
        if (isEquity && productType === 'CNC') {
            stampDuty = turnover * 0.00015; // Delivery 0.015%
        } else if (isEquity) {
            stampDuty = turnover * 0.00003; // Intraday 0.003%
        } else if (isOptions) {
            stampDuty = turnover * 0.00003; // Options 0.003%
        } else if (isFutures) {
            stampDuty = turnover * 0.00002; // Futures 0.002%
        } else {
            stampDuty = turnover * 0.00003; // Default
        }
    }

    // 6. GST (18% on Brokerage + Exchange Txn + SEBI)
    const gst = (brokerage + exchangeTxn + sebi) * 0.18;

    const total = brokerage + stt + exchangeTxn + gst + sebi + stampDuty;

    return {
        total,
        brokerage,
        stt,
        exchangeTxn,
        gst,
        sebi,
        stampDuty
    };
};

// Calculate total charges for a closed trade (Buy + Sell legs)
const calculateCharges = (trade: TradeLog): number => {
    // Determine instrument type
    const isEquity = trade.segment.includes('_EQ') || trade.segment === 'NSE_EQ' || trade.segment === 'BSE_EQ';
    const isFutures = trade.segment.includes('FUT') || trade.symbol.endsWith('FUT');

    // Fallback: If not equity or futures, assume options (simplification for Dhan NSE_FNO)
    const isOptions = !isEquity && !isFutures;

    const instrumentType = { isEquity, isFutures, isOptions };

    const quantityInUnits = trade.quantity * (trade.lotSize || 1);

    const buyLeg = calculateLegCharges(trade.buyPrice, quantityInUnits, trade.productType, trade.segment, 'BUY', trade.exchange, instrumentType);
    const sellLeg = calculateLegCharges(trade.sellPrice, quantityInUnits, trade.productType, trade.segment, 'SELL', trade.exchange, instrumentType);

    return buyLeg.total + sellLeg.total;
};

export const useTradingStore = create<TradingStore>()(
    persist(
        (set, get) => ({
            // Initial State
            watchlist: [],
            orders: [],
            positions: [],
            basket: [],
            tradeHistory: [],
            dailyStats: [],
            account: initialAccount,
            isConnected: false,
            feedStatus: 'DISCONNECTED',
            brokerCredentials: null,
            lastSettlementDate: '1970-01-01', // Force settlement on first run

            activeSymbol: 'NIFTY',
            activeExpiry: '',
            expiries: [],
            activeWatchlistId: 'default',
            watchlists: [
                {
                    id: 'default',
                    name: 'Indices',
                    items: [
                        { symbol: 'NIFTY', price: 21750.40, change: 125.20, changePercent: 0.58, exchange: 'NSE', isUp: true, securityId: '13', segment: 'IDX_I', instrumentType: 'INDEX' },
                        { symbol: 'BANKNIFTY', price: 45600.15, change: -45.60, changePercent: -0.10, exchange: 'NSE', isUp: false, securityId: '25', segment: 'IDX_I', instrumentType: 'INDEX' },
                        { symbol: 'FINNIFTY', price: 20400.00, change: 12.00, changePercent: 0.06, exchange: 'NSE', isUp: true, securityId: '27', segment: 'IDX_I', instrumentType: 'INDEX' },
                    ]
                },
                {
                    id: 'stocks',
                    name: 'Stocks',
                    items: [
                        { symbol: 'RELIANCE', price: 2950.00, change: 15.40, changePercent: 0.52, exchange: 'NSE', isUp: true },
                        { symbol: 'HDFCBANK', price: 1450.80, change: -12.30, changePercent: -0.84, exchange: 'NSE', isUp: false },
                        { symbol: 'TCS', price: 3800.00, change: 45.00, changePercent: 1.20, exchange: 'NSE', isUp: true },
                        { symbol: 'INFY', price: 1620.00, change: 12.00, changePercent: 0.74, exchange: 'NSE', isUp: true },
                        { symbol: 'ICICIBANK', price: 1050.00, change: -5.00, changePercent: -0.47, exchange: 'NSE', isUp: false },
                        { symbol: 'SBIN', price: 760.00, change: 8.00, changePercent: 1.06, exchange: 'NSE', isUp: true },
                    ]
                }
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
            activeBroker: null,
            dhanConfig: null,
            growwConfig: null,
            isAuthenticated: false,

            terminalSettings: {
                interval: '1m',
                fromDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                toDate: new Date().toISOString().split('T')[0],
            },

            updateTerminalSettings: (settings: Partial<TerminalSettings>) => set((state) => ({
                terminalSettings: { ...state.terminalSettings, ...settings }
            })),

            chartSettings: DEFAULT_CHART_SETTINGS,

            updateChartSettings: (updates: Partial<ChartSettings>) => set((state) => ({
                chartSettings: {
                    ...state.chartSettings,
                    ...updates,
                    symbol: updates.symbol ? { ...state.chartSettings.symbol, ...updates.symbol } : state.chartSettings.symbol,
                    appearance: updates.appearance ? { ...state.chartSettings.appearance, ...updates.appearance } : state.chartSettings.appearance,
                    scales: updates.scales ? { ...state.chartSettings.scales, ...updates.scales } : state.chartSettings.scales,
                    indicators: updates.indicators ? {
                        ...(state.chartSettings.indicators || DEFAULT_CHART_SETTINGS.indicators),
                        ...updates.indicators,
                        adr: updates.indicators.adr ? {
                            ...((state.chartSettings.indicators?.adr) || DEFAULT_CHART_SETTINGS.indicators.adr),
                            ...updates.indicators.adr
                        } : (state.chartSettings.indicators?.adr || DEFAULT_CHART_SETTINGS.indicators.adr)
                    } : state.chartSettings.indicators,
                }
            })),



            // ============================================
            // TERMINAL UI ACTIONS
            // ============================================

            setSymbol: (symbol: string) => {
                set({ activeSymbol: symbol });
            },

            addWatchlistGroup: (group: WatchlistGroup) => set((state) => {
                if (state.watchlists.some(w => w.id === group.id || w.name === group.name)) {
                    return {};
                }
                return { watchlists: [...state.watchlists, group] };
            }),

            addSection: (name: string) => set((state) => ({
                watchlists: state.watchlists.map(w => w.id === state.activeWatchlistId ? {
                    ...w,
                    items: [...w.items, {
                        symbol: name,
                        price: 0,
                        change: 0,
                        changePercent: 0,
                        exchange: '',
                        isUp: true,
                        type: 'SECTION'
                    }]
                } : w)
            })),

            addSymbolToWatchlist: (item: WatchlistItem) => set((state) => {
                const newItem = { ...item, type: 'SYMBOL' as const };
                // Also add to underlying flat watchlist for ticker updates
                if (item.securityId && item.segment) {
                    if (!state.watchlist.find((w: any) => w.securityId === item.securityId)) {
                        state.addToWatchlist({
                            securityId: item.securityId,
                            symbol: item.symbol,
                            exchange: (item.exchange === 'NSE' || item.exchange === 'BSE' || item.exchange === 'MCX') ? item.exchange as any : 'NSE',
                            segment: item.segment,
                            ltp: item.price as number,
                            change: item.change,
                            changePercent: item.changePercent,
                            isIndex: item.instrumentType === 'INDEX'
                        });
                    }
                }

                return {
                    watchlists: state.watchlists.map(w => w.id === state.activeWatchlistId ? {
                        ...w,
                        items: [...w.items, newItem]
                    } : w)
                };
            }),

            removeSymbolFromWatchlist: (index: number) => set((state) => {
                const watchlistIndex = state.watchlists.findIndex(w => w.id === state.activeWatchlistId);
                if (watchlistIndex === -1) return state;

                const newWatchlists = [...state.watchlists];
                const items = [...newWatchlists[watchlistIndex].items];
                items.splice(index, 1);

                newWatchlists[watchlistIndex] = {
                    ...newWatchlists[watchlistIndex],
                    items
                };

                return { watchlists: newWatchlists };
            }),

            reorderWatchlistGroup: (startIndex: number, endIndex: number) => set((state) => {
                const watchlistIndex = state.watchlists.findIndex(w => w.id === state.activeWatchlistId);
                if (watchlistIndex === -1) return state;

                const newWatchlists = [...state.watchlists];
                const items = [...newWatchlists[watchlistIndex].items];
                const [removed] = items.splice(startIndex, 1);
                items.splice(endIndex, 0, removed);

                newWatchlists[watchlistIndex] = {
                    ...newWatchlists[watchlistIndex],
                    items
                };

                return { watchlists: newWatchlists };
            }),

            setActiveWatchlist: (id: string) => set({ activeWatchlistId: id }),

            updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => set((state) => ({
                watchlists: state.watchlists.map(w => ({
                    ...w,
                    items: w.items.map(i => i.symbol === symbol ? { ...i, ...updates } : i)
                }))
            })),

            updateOptionChain: (data: OptionStrike[]) => set({ optionChain: data }),

            openOrderModal: (config: Omit<OrderModalState, 'isOpen'>) => set({ orderModal: { ...config, isOpen: true } }),
            closeOrderModal: () => set((state) => ({ orderModal: { ...state.orderModal, isOpen: false } })),

            fetchOptionChain: async (expiry?: string) => {
                const state = get() as unknown as TradingStore;
                if (!state.isAuthenticated || state.activeBroker !== 'dhan' || !state.dhanConfig || !state.activeSymbol) return;

                try {
                    const symbolConfig = getSymbolConfig(state.activeSymbol);
                    if (!symbolConfig) return;

                    const res = await fetch('/api/dhan/option-chain', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId: state.dhanConfig.clientId,
                            accessToken: state.dhanConfig.accessToken,
                            underlyingScrip: symbolConfig.id,
                            underlyingSeg: symbolConfig.segment === 'IDX_I' ? 'IDX_I' : 'NSE_EQ',
                            expiry: expiry
                        })
                    });

                    const json = await res.json();
                    if (json.success) {
                        if (json.type === 'expiry_list') {
                            set({ expiries: json.data });
                            if (json.data && json.data.length > 0) {
                                if (!expiry) set({ activeExpiry: json.data[0] });
                                state.fetchOptionChain(expiry || json.data[0]);
                            }
                        } else if (json.type === 'chain_data') {
                            if (expiry) set({ activeExpiry: expiry });
                            // Transform to OptionStrike[] format
                            const oc = json.data.oc;
                            const strikes = Object.entries(oc).map(([strike, data]: any) => ({
                                strike: parseFloat(strike),
                                ce: {
                                    ltp: data.ce?.last_price || 0,
                                    change: data.ce?.change_percent || 0,
                                    oi: data.ce?.oi || 0,
                                    volume: data.ce?.volume || 0,
                                    iv: data.ce?.implied_volatility || 0
                                },
                                pe: {
                                    ltp: data.pe?.last_price || 0,
                                    change: data.pe?.change_percent || 0,
                                    oi: data.pe?.oi || 0,
                                    volume: data.pe?.volume || 0,
                                    iv: data.pe?.implied_volatility || 0
                                }
                            })).sort((a: any, b: any) => a.strike - b.strike);
                            set({ optionChain: strikes });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch option chain:", error);
                }
            },
            // ============================================
            // WATCHLIST ACTIONS
            // ============================================

            addToWatchlist: (item: WatchlistItem) => {
                const { watchlist } = get();
                if (!watchlist.find(w => w.securityId === item.securityId)) {
                    set({ watchlist: [...watchlist, item] });
                }
            },

            removeFromWatchlist: (securityId: string) => {
                set((state) => ({
                    watchlist: state.watchlist.filter(w => w.securityId !== securityId)
                }));
            },

            updateWatchlistPrices: (updates: Partial<WatchlistItem>[]) => {
                set((state) => {
                    const priceMap = new Map<string, number>();

                    // 1. Update Watchlist
                    const newWatchlist = state.watchlist.map(item => {
                        const update = updates.find(u => String(u.securityId) === String(item.securityId));
                        if (update && update.ltp) {
                            priceMap.set(String(item.securityId), update.ltp);
                            const newLtp = update.ltp;
                            const prevClose = update.prevClose || item.prevClose || newLtp;
                            const change = newLtp - prevClose;
                            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                            return {
                                ...item,
                                ...update,
                                ltp: newLtp,
                                change,
                                changePercent,
                                prevClose
                            };
                        }
                        return item;
                    });

                    // 1b. Update UI watchlists
                    const newWatchlists = state.watchlists.map(w => ({
                        ...w,
                        items: w.items.map(item => {
                            const itemSecurityId = item.securityId || getSymbolConfig(item.symbol)?.id;
                            const update = updates.find(u => String(u.securityId) === String(itemSecurityId));
                            if (update && update.ltp) {
                                const newLtp = update.ltp;
                                const prevClose = update.prevClose || item.price || newLtp;
                                const change = newLtp - prevClose;
                                const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
                                return {
                                    ...item,
                                    price: newLtp,
                                    change,
                                    changePercent,
                                    isUp: newLtp >= prevClose
                                };
                            }
                            return item;
                        })
                    }));



                    // 2. Update Positions (Live MTM)
                    const newPositions = state.positions.map(pos => {
                        const ltp = priceMap.get(String(pos.securityId)) ||
                            updates.find(u => String(u.securityId) === String(pos.securityId))?.ltp;

                        if (!ltp) return pos;

                        // IF POSITION IS CLOSED, UPDATE LTP BUT NOT P&L
                        if (pos.quantity === 0) {
                            return { ...pos, ltp };
                        }

                        const unrealizedPnl = pos.quantity > 0
                            ? (ltp - pos.avgBuyPrice) * pos.quantity
                            : (pos.avgSellPrice - ltp) * Math.abs(pos.quantity);

                        return {
                            ...pos,
                            ltp,
                            unrealizedPnl,
                            totalPnl: (pos.realizedPnl || 0) + unrealizedPnl
                        };
                    });

                    const newBasket = state.basket.map(item => {
                        const ltp = priceMap.get(String(item.securityId)) ||
                            updates.find(u => String(u.securityId) === String(item.securityId))?.ltp;

                        if (ltp) {
                            return { ...item, ltp };
                        }
                        return item;
                    });

                    return {
                        watchlist: newWatchlist,
                        watchlists: newWatchlists,
                        positions: newPositions,
                        basket: newBasket
                    };
                });

                // Trigger SL check and account summary update
                get().checkAndTriggerSLOrders();
                get().updateAccountSummary();
            },

            reorderWatchlist: (items: WatchlistItem[]) => {
                set({ watchlist: items });
            },

            performDailySettlement: () => {
                const state = get();
                const now = new Date();
                const currentHour = now.getHours();
                const todayStr = now.toISOString().split('T')[0];

                // Rule: Settlement runs only after 6:00 AM
                // If we already settled today, don't run.
                // If it's before 6 AM, don't run (wait for 6 AM).
                if (state.lastSettlementDate === todayStr) return;
                if (currentHour < 6) return;

                console.log('[Settlement] Running daily settlement...');

                // Calculate charges for all unsettled trades (trades after the last settlement date)
                // We compare timestamps to find trades that happened after the last run but before "today's session" (technically yesterday's trades)

                const tradesToSettle = state.tradeHistory.filter(trade => {
                    const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
                    // Settle any trade that is NOT today (since today's session is active or hasn't started)
                    // and hasn't been settled (implied by filtering against lastSettlementDate if we tracked it strictly)
                    // For this simple store, we settle everything that is < Today.
                    // This assumes previous settlements cleared everything before them.
                    return tradeDate < todayStr;
                });

                // However, we don't want to double-charge if lastSettlementDate was yesterday.
                // We should only charge trades that happened matching the period we missed.
                // Simpler Logic:
                // We settle trades where Date(trade) > Date(lastSettlementDate) AND Date(trade) < todayStr.

                const settleableTrades = tradesToSettle.filter(trade => {
                    const tradeDate = new Date(trade.timestamp);
                    // Just strictly compare date strings to avoid timezone mess for now
                    const tradeDateStr = tradeDate.toISOString().split('T')[0];
                    return tradeDateStr > state.lastSettlementDate && tradeDateStr < todayStr;
                });

                let totalCharges = 0;
                settleableTrades.forEach(trade => {
                    totalCharges += calculateCharges(trade);
                });

                // Clear Closed Positions AND MIS positions
                // We remove them from the 'positions' array
                const activePositions = state.positions.filter(pos => {
                    // Always keep open Delivery/Normal positions
                    if (pos.quantity !== 0 && pos.productType !== 'MIS') return true;
                    return false;
                });

                const newAccount = {
                    ...state.account,
                    totalCapital: state.account.totalCapital - totalCharges,
                    availableMargin: state.account.availableMargin - totalCharges,
                };

                console.log(`[Settlement] Deducted ₹${totalCharges.toFixed(2)} charges. Cleared ${state.positions.length - activePositions.length} positions.`);

                set({
                    positions: activePositions,
                    account: newAccount,
                    lastSettlementDate: todayStr
                });
            },

            // ============================================
            // ORDER ACTIONS
            // ============================================

            placeOrder: (orderData: Omit<Order, 'orderId' | 'timestamp' | 'status' | 'filledQty' | 'avgPrice'>) => {
                const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                const newOrder: Order = {
                    ...orderData,
                    orderId,
                    timestamp: Date.now(),
                    status: 'PENDING',
                    filledQty: 0,
                    avgPrice: 0
                };

                // Check margin
                const marginCheck = get().calculateMargin(orderData);
                if (!marginCheck.sufficient) {
                    // Reject order due to insufficient margin
                    newOrder.status = 'REJECTED';
                    newOrder.rejectionReason = 'Insufficient margin';
                    set((state) => ({ orders: [...state.orders, newOrder] }));
                    soundManager.play('error'); // ERROR SOUND
                    return orderId;
                }

                // Add marginBlocked to order
                newOrder.marginBlocked = marginCheck.requiredMargin;

                // Deduct margin from available balance (block it)
                if (marginCheck.requiredMargin > 0) {
                    set(state => {
                        const newUsed = state.account.usedMargin + marginCheck.requiredMargin;
                        return {
                            account: {
                                ...state.account,
                                availableMargin: state.account.totalCapital - newUsed, // Recalculate based on total - used
                                usedMargin: newUsed,
                                marginUtilization: state.account.totalCapital > 0
                                    ? (newUsed / state.account.totalCapital) * 100
                                    : 0
                            }
                        };
                    });
                }

                soundManager.play('placed'); // PLACED SOUND

                // For paper trading, execute market orders immediately
                if (orderData.orderType === 'MARKET') {
                    const watchlistItem = get().watchlist.find(w => w.securityId === orderData.securityId);
                    // Use live LTP from watchlist if available, else use the price passed (which is usually last known LTP)
                    const executionPrice = watchlistItem?.ltp || orderData.price;

                    newOrder.status = 'EXECUTED';
                    newOrder.filledQty = orderData.quantity;
                    newOrder.avgPrice = executionPrice;
                    newOrder.executedAt = Date.now();

                    // Update position
                    get().executeOrder(newOrder);
                } else {
                    // Limit/SL orders remain open
                    newOrder.status = 'OPEN';
                }

                set((state) => ({ orders: [...state.orders, newOrder] }));
                // get().updateAccountSummary();

                return orderId;
            },

            cancelOrder: (orderId: string) => {
                const orderToCancel = get().orders.find(o => o.orderId === orderId);

                // If cancelling a pending/open order, release the blocked margin
                if (orderToCancel && (orderToCancel.status === 'PENDING' || orderToCancel.status === 'OPEN')) {
                    const blockedMargin = orderToCancel.marginBlocked || 0;
                    if (blockedMargin > 0) {
                        set(state => {
                            const newUsed = state.account.usedMargin - blockedMargin;
                            return {
                                account: {
                                    ...state.account,
                                    availableMargin: state.account.totalCapital - newUsed,
                                    usedMargin: newUsed,
                                    marginUtilization: state.account.totalCapital > 0
                                        ? (newUsed / state.account.totalCapital) * 100
                                        : 0
                                }
                            };
                        });
                    }
                }

                set((state) => ({
                    orders: state.orders.map(order =>
                        order.orderId === orderId && (order.status === 'PENDING' || order.status === 'OPEN')
                            ? { ...order, status: 'CANCELLED' as OrderStatus }
                            : order
                    )
                }));
            },

            updateOrderStatus: (orderId: string, status: OrderStatus, filledQty?: number, avgPrice?: number) => {
                set((state) => ({
                    orders: state.orders.map(order => {
                        if (order.orderId !== orderId) return order;

                        const updatedOrder = {
                            ...order,
                            status,
                            ...(filledQty !== undefined && { filledQty }),
                            ...(avgPrice !== undefined && { avgPrice }),
                            ...(status === 'EXECUTED' && { executedAt: Date.now() })
                        };

                        // Execute the order if status is EXECUTED
                        if (status === 'EXECUTED') {
                            get().executeOrder(updatedOrder);
                        }

                        return updatedOrder;
                    })
                }));
                get().updateAccountSummary();
            },

            getOrdersByStatus: (status: OrderStatus) => {
                return get().orders.filter(order => order.status === status);
            },

            getPendingOrders: () => {
                return get().orders.filter(order => order.status === 'PENDING' || order.status === 'OPEN');
            },

            checkAndTriggerSLOrders: () => {
                const { orders, watchlist } = get();

                // Find all open SL/SL-M orders
                const slOrders = orders.filter(order =>
                    order.status === 'OPEN' &&
                    (order.orderType === 'SL' || order.orderType === 'SL-M') &&
                    order.triggerPrice !== undefined
                );

                slOrders.forEach(order => {
                    // Get current price from watchlist
                    const instrument = watchlist.find(w => w.securityId === order.securityId);
                    if (!instrument) return;

                    const currentPrice = instrument.ltp;
                    const triggerPrice = order.triggerPrice!;

                    // Check if trigger condition is met
                    let shouldTrigger = false;

                    if (order.side === 'BUY') {
                        // Buy SL: Trigger when price rises to or above trigger price
                        shouldTrigger = (currentPrice || 0) >= triggerPrice;
                    } else {
                        // Sell SL: Trigger when price falls to or below trigger price
                        shouldTrigger = (currentPrice || 0) <= triggerPrice;
                    }

                    if (shouldTrigger) {
                        // Determine execution price
                        let executionPrice: number;

                        if (order.orderType === 'SL-M') {
                            // SL-M: Execute at market price (current LTP)
                            executionPrice = currentPrice || 0;
                        } else {
                            // SL: Execute at limit price (order.price)
                            executionPrice = order.price;

                            // Check if limit price can be filled
                            // For buy: current price should be <= limit price
                            // For sell: current price should be >= limit price
                            const canFill = order.side === 'BUY'
                                ? (currentPrice || 0) <= executionPrice
                                : (currentPrice || 0) >= executionPrice;

                            if (!canFill) {
                                // Limit price not reachable, order remains open
                                return;
                            }
                        }

                        soundManager.play('sl_hit'); // SL HIT SOUND

                        // Execute the SL order
                        get().updateOrderStatus(
                            order.orderId,
                            'EXECUTED',
                            order.quantity,
                            executionPrice
                        );

                        console.log(`SL Order triggered: ${order.symbol} ${order.side} ${order.quantity} @ ₹${executionPrice.toFixed(2)}`);
                    }
                });
            },

            // ============================================
            // POSITION ACTIONS
            // ============================================

            updatePosition: (securityId: string, ltp: number) => {
                set((state) => ({
                    positions: state.positions.map(pos => {
                        if (pos.securityId !== securityId) return pos;

                        // IF POSITION IS CLOSED, UPDATE LTP BUT NOT P&L (P&L is fixed at exit)
                        if (pos.quantity === 0) {
                            return { ...pos, ltp };
                        }

                        const unrealizedPnl = pos.quantity > 0
                            ? (ltp - pos.avgBuyPrice) * pos.quantity
                            : (pos.avgSellPrice - ltp) * Math.abs(pos.quantity);

                        return {
                            ...pos,
                            ltp,
                            unrealizedPnl,
                            totalPnl: pos.realizedPnl + unrealizedPnl
                        };
                    })
                }));
                get().updateAccountSummary();
            },

            closePosition: (securityId: string) => {
                const position = get().positions.find(p => p.securityId === securityId);
                if (!position || position.quantity === 0) return;

                // For F&O, we need to send quantity in LOTS to placeOrder
                // The store calculates actual units (qty * lotSize) during execution
                const instrumentDetails = get().getInstrumentDetails(position.symbol, position.segment);
                const currentLotSize = instrumentDetails.lotSize;
                const quantityInLots = Math.abs(position.quantity / currentLotSize);

                console.log(`[DEBUG] Closing position for ${securityId}. Qty: ${position.quantity}, LotSize: ${currentLotSize}, QtyInLots: ${quantityInLots}`);

                // Create closing order
                const closeOrder: Omit<Order, 'orderId' | 'timestamp' | 'status' | 'filledQty' | 'avgPrice'> = {
                    securityId: position.securityId,
                    symbol: position.symbol,
                    exchange: position.exchange,
                    segment: position.segment,
                    side: position.quantity > 0 ? 'SELL' : 'BUY',
                    orderType: 'MARKET',
                    productType: position.productType,
                    quantity: quantityInLots,
                    price: position.ltp
                };

                get().placeOrder(closeOrder);
            },

            convertPosition: (securityId: string, toProductType: ProductType) => {
                set((state) => ({
                    positions: state.positions.map(p =>
                        p.securityId === securityId ? { ...p, productType: toProductType } : p
                    )
                }));
                get().updateAccountSummary();
                soundManager.play('placed'); // Feedback sound
            },

            exitAllPositions: () => {
                const { positions } = get();
                const activePositions = positions.filter(p => p.quantity !== 0);
                activePositions.forEach(pos => {
                    get().closePosition(pos.securityId);
                });
            },

            // ============================================
            // BASKET ACTIONS
            // ============================================

            addToBasket: (item: BasketItem) => {
                set((state) => ({ basket: [...state.basket, item] }));
                soundManager.play('notification');
            },

            removeFromBasket: (id: string) => {
                set((state) => ({ basket: state.basket.filter(i => i.id !== id) }));
            },

            updateBasketItem: (id: string, updates: Partial<BasketItem>) => {
                set((state) => ({
                    basket: state.basket.map(i => i.id === id ? { ...i, ...updates } : i)
                }));
            },

            clearBasket: () => {
                set({ basket: [] });
            },

            getPositionBySecurityId: (securityId: string) => {
                return get().positions.find(p => p.securityId === securityId);
            },

            // ============================================
            // MARGIN & ACCOUNT ACTIONS
            // ============================================

            calculateMargin: (order: Omit<Order, 'orderId' | 'timestamp' | 'status' | 'filledQty' | 'avgPrice'>) => {
                const { account, positions } = get();

                // Get instrument details including lot size
                const instrumentDetails = get().getInstrumentDetails(order.symbol, order.segment);
                const lotSize = instrumentDetails.lotSize;

                // Calculate order value (price × quantity × lot size for F&O)
                const actualQuantity = instrumentDetails.isEquity ? order.quantity : order.quantity * lotSize;

                // New Units (logic to handle position flipping/reduction matches previous implementation)
                const existingPosition = positions.find(p => p.securityId === order.securityId);
                const existingQty = existingPosition ? existingPosition.quantity : 0;
                let newUnits = 0;
                let reducingUnits = 0;

                if (Math.abs(existingQty) > 0.001) {
                    if (existingQty > 0 && order.side === 'SELL') {
                        reducingUnits = Math.min(actualQuantity, existingQty);
                        newUnits = Math.max(0, actualQuantity - existingQty);
                    } else if (existingQty < 0 && order.side === 'BUY') {
                        reducingUnits = Math.min(actualQuantity, Math.abs(existingQty));
                        newUnits = Math.max(0, actualQuantity - Math.abs(existingQty));
                    } else {
                        newUnits = actualQuantity;
                    }
                } else {
                    newUnits = actualQuantity;
                }

                if (newUnits === 0 && reducingUnits > 0) {
                    return {
                        securityId: order.securityId,
                        symbol: order.symbol,
                        orderType: order.orderType,
                        productType: order.productType,
                        quantity: order.quantity,
                        price: order.price,
                        requiredMargin: 0,
                        availableMargin: account.availableMargin,
                        sufficient: true,
                        isHedged: false
                    };
                }

                // 2026 PEAK MARGIN RULES
                let requiredMargin = 0;
                const newOrderValue = order.price * newUnits;

                // Identify Root Symbol & Index 
                const rootSymbol = order.symbol.split(' ')[0].toUpperCase(); // NIFTY, BANKNIFTY, RELIANCE
                const isNifty = rootSymbol === 'NIFTY';
                const isBankNifty = rootSymbol === 'BANKNIFTY';
                const isFinNifty = rootSymbol === 'FINNIFTY';
                const isIndex = isNifty || isBankNifty || isFinNifty || rootSymbol === 'SENSEX' || rootSymbol === 'BANKEX';

                if (instrumentDetails.isEquity) {
                    // 🔴 EQUITY RULE: VaR + ELM (Approx 20% - 25%)
                    if (order.side === 'SELL' && order.productType === 'CNC') {
                        requiredMargin = 0;
                    } else {
                        requiredMargin = newOrderValue * 0.20;
                    }

                } else if (instrumentDetails.isCommodity) {
                    // 🛢️ MCX COMMODITY RULES
                    const isOption = instrumentDetails.isOptions;

                    if (isOption) {
                        if (order.side === 'BUY') {
                            // 🟢 OPTION BUY: 100% Premium
                            requiredMargin = newOrderValue;
                        } else {
                            // 🔴 OPTION SELL: Fixed margins
                            const lots = newUnits / lotSize;
                            let marginPerLot = 150000; // Default fallback

                            if (rootSymbol.includes('CRUDE')) marginPerLot = 100000;    // ₹1L
                            else if (rootSymbol.includes('NATURALGAS')) marginPerLot = 150000; // ₹1.5L
                            else if (rootSymbol.includes('GOLD')) marginPerLot = 150000; // ₹1.5L
                            else if (rootSymbol.includes('SILVER')) marginPerLot = 200000; // ₹2L
                            else if (rootSymbol.includes('COPPER') || rootSymbol.includes('ZINC')) marginPerLot = 120000;

                            // � HEDGE BENEFIT (Spread)
                            const hasHedge = positions.some(p =>
                                p.quantity > 0 &&
                                p.symbol.includes(rootSymbol) &&
                                p.exchange === 'MCX'
                            );

                            if (hasHedge) {
                                requiredMargin = lots * (marginPerLot * 0.25); // 75% reduction
                            } else {
                                requiredMargin = lots * marginPerLot;
                            }
                        }
                    } else {
                        // � FUTURES (MCX)
                        // Higher volatility = Higher Margin
                        let marginPercent = 0.15; // Default

                        if (rootSymbol.includes('CRUDE')) marginPercent = 0.20;       // ~20% (High Volatility)
                        else if (rootSymbol.includes('NATURALGAS')) marginPercent = 0.25; // ~25% (Very High Volatility)
                        else if (rootSymbol.includes('GOLD')) marginPercent = 0.14;       // ~14%
                        else if (rootSymbol.includes('SILVER')) marginPercent = 0.18;     // ~18%
                        else if (rootSymbol.includes('COPPER')) marginPercent = 0.18;
                        else if (rootSymbol.includes('ZINC') || rootSymbol.includes('ALU')) marginPercent = 0.16;

                        requiredMargin = newOrderValue * marginPercent;
                    }

                } else if (instrumentDetails.isFutures) {
                    // 🟣 FUTURES RULE: SPAN + Exposure (Approx 12% - 18%)
                    const marginPercent = isIndex ? 0.12 : 0.18;
                    requiredMargin = newOrderValue * marginPercent;

                } else if (instrumentDetails.isOptions) {
                    if (order.side === 'BUY') {
                        // 🟢 OPTION BUY: 100% Premium
                        requiredMargin = newOrderValue;
                    } else {
                        // 🔴 OPTION SELL: SPAN + Exposure
                        const lots = newUnits / lotSize;

                        let marginPerLot = 0;
                        if (isNifty) marginPerLot = 140000;      // ₹1.4L
                        else if (isBankNifty) marginPerLot = 240000; // ₹2.4L
                        else if (isFinNifty) marginPerLot = 100000;  // ₹1.0L
                        else {
                            marginPerLot = 200000;
                        }

                        // 🟢 HEDGE BENEFIT
                        const hasHedge = positions.some(p =>
                            p.quantity > 0 && // Long position
                            p.symbol.includes(rootSymbol) &&
                            (p.segment.includes('FNO') || p.segment.includes('NFO') || p.segment.includes('BFO'))
                        );

                        if (hasHedge) {
                            requiredMargin = lots * (isIndex ? 50000 : 70000);
                        } else {
                            requiredMargin = lots * marginPerLot;
                        }
                    }
                } else {
                    // Commodity / Currency fallbacks
                    requiredMargin = newOrderValue * 0.20;
                }

                // Determine isHedged for return
                const isHedged = (instrumentDetails.isOptions && order.side === 'SELL') ? positions.some(p =>
                    p.quantity > 0 &&
                    p.symbol.startsWith(rootSymbol) &&
                    (p.segment.includes('FNO') || p.segment.includes('NFO') || p.segment.includes('BFO'))
                ) : false;

                return {
                    securityId: order.securityId,
                    symbol: order.symbol,
                    orderType: order.orderType,
                    productType: order.productType,
                    quantity: order.quantity,
                    price: order.price,
                    requiredMargin,
                    availableMargin: account.availableMargin,
                    sufficient: account.availableMargin >= requiredMargin,
                    isHedged
                };
            },

            getEstimatedCharges: ({
                symbol,
                segment,
                productType,
                quantity,
                price,
                side,
                exchange
            }: {
                symbol: string;
                segment: string;
                productType: string;
                quantity: number;
                price: number;
                side: 'BUY' | 'SELL';
                exchange: string;
            }) => {
                // Get instrument details to determine correct STT rate
                const details = get().getInstrumentDetails(symbol, segment);

                const charges = calculateLegCharges(
                    price,
                    quantity,
                    productType,
                    segment,
                    side,
                    exchange || 'NSE',
                    {
                        isEquity: details.isEquity,
                        isFutures: details.isFutures,
                        isOptions: details.isOptions
                    }
                );
                return charges;
            },

            updateAccountSummary: () => {
                const { positions, account } = get();
                const realizedPnl = positions.reduce((sum, pos) => sum + pos.realizedPnl, 0);
                const unrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
                const totalPnl = realizedPnl + unrealizedPnl;

                // Re-calculate USED MARGIN for all open positions using the same logic as calculateMargin
                // This ensures total used margin is accurate to the new rules
                const usedMargin = positions.reduce((sum, pos) => {
                    const instrumentDetails = get().getInstrumentDetails(pos.symbol, pos.segment);
                    const qty = Math.abs(pos.quantity);
                    const isLong = pos.quantity > 0;
                    const val = qty * pos.ltp; // Current Value

                    if (instrumentDetails.isEquity) {
                        // Equity: 20%
                        return sum + (val * 0.20);
                    } else if (instrumentDetails.isCommodity) {
                        // MCX MARGIN
                        const rootSymbol = pos.symbol.split(' ')[0].toUpperCase();
                        if (instrumentDetails.isOptions) {
                            if (isLong) return sum + val; // Buy = Premium
                            else {
                                // Sell = Fixed per lot
                                const lotSize = instrumentDetails.lotSize || 1;
                                const lots = qty / lotSize;
                                let marginPerLot = 150000;
                                if (rootSymbol.includes('CRUDE')) marginPerLot = 100000;
                                else if (rootSymbol.includes('NATURALGAS')) marginPerLot = 150000;
                                else if (rootSymbol.includes('GOLD')) marginPerLot = 150000;
                                else if (rootSymbol.includes('SILVER')) marginPerLot = 200000;

                                // Simple Hedge Check for Account Summary
                                const hasHedge = positions.some(p =>
                                    p.quantity > 0 &&
                                    p.symbol.includes(rootSymbol) &&
                                    p.exchange === 'MCX'
                                );

                                if (hasHedge) return sum + (lots * (marginPerLot * 0.25));
                                return sum + (lots * marginPerLot);
                            }
                        } else {
                            // Futures (MCX)
                            let marginPercent = 0.15;
                            if (rootSymbol.includes('CRUDE')) marginPercent = 0.20;
                            else if (rootSymbol.includes('NATURALGAS')) marginPercent = 0.25;
                            else if (rootSymbol.includes('GOLD')) marginPercent = 0.14;
                            else if (rootSymbol.includes('SILVER')) marginPercent = 0.18;
                            else if (rootSymbol.includes('COPPER')) marginPercent = 0.18;
                            else if (rootSymbol.includes('ZINC')) marginPercent = 0.16;

                            return sum + (val * marginPercent);
                        }

                    } else if (instrumentDetails.isFutures) {
                        // Futures: 15%
                        return sum + (val * 0.15);
                    } else if (instrumentDetails.isOptions) {
                        if (isLong) {
                            // Option Buy: Cost (Premium Paid)
                            return sum + val;
                        } else {
                            // Option Sell: Fixed per lot
                            const lotSize = instrumentDetails.lotSize || 1;
                            const lots = qty / lotSize;
                            const rootSymbol = pos.symbol.split(' ')[0].toUpperCase();
                            let marginPerLot = 200000;
                            if (rootSymbol === 'NIFTY') marginPerLot = 140000;
                            else if (rootSymbol === 'BANKNIFTY') marginPerLot = 240000;
                            else if (rootSymbol === 'FINNIFTY') marginPerLot = 100000;

                            // Simple Hedge Check
                            const hasHedge = positions.some(p =>
                                p.quantity > 0 &&
                                p.symbol.includes(rootSymbol) &&
                                (p.segment.includes('FNO') || p.segment.includes('NFO') || p.segment.includes('BFO'))
                            );

                            const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BANKEX'].includes(rootSymbol);
                            if (hasHedge) return sum + (lots * (isIndex ? 50000 : 70000));
                            return sum + (lots * marginPerLot);
                        }
                    }
                    return sum;
                }, 0);

                const availableMargin = account.totalCapital + realizedPnl - usedMargin;
                const marginUtilization = account.totalCapital > 0 ? (usedMargin / account.totalCapital) * 100 : 0;

                set({
                    account: {
                        ...account,
                        availableMargin,
                        usedMargin,
                        realizedPnl,
                        unrealizedPnl,
                        totalPnl,
                        marginUtilization
                    }
                });
            },

            // ============================================
            // SETTLEMENT
            // ============================================

            // ============================================
            // BROKER CONNECTION
            // ============================================


            connectBroker: (clientId: string, accessToken: string) => {
                set((state) => {
                    const dhanWatchlistId = 'dhan-default';
                    const hasDhanWatchlist = state.watchlists.some(w => w.id === dhanWatchlistId);

                    let newWatchlists = [...state.watchlists];
                    if (!hasDhanWatchlist) {
                        const uniqueSymbols: string[] = [];
                        const seenIds = new Set<string>();

                        Object.keys(SYMBOL_MAP).forEach(sym => {
                            const config = SYMBOL_MAP[sym];
                            if (!seenIds.has(config.id)) {
                                seenIds.add(config.id);
                                uniqueSymbols.push(sym);
                            }
                        });

                        const dhanWatchlist = {
                            id: dhanWatchlistId,
                            name: 'Dhan Default',
                            items: uniqueSymbols.map(sym => ({
                                symbol: sym,
                                price: 0,
                                change: 0,
                                changePercent: 0,
                                exchange: 'NSE',
                                isUp: true,
                                type: 'SYMBOL' as const,
                                securityId: SYMBOL_MAP[sym].id,
                                segment: SYMBOL_MAP[sym].segment,
                            }))
                        };
                        newWatchlists = [...newWatchlists, dhanWatchlist];
                    }

                    return {
                        brokerCredentials: { clientId, accessToken },
                        dhanConfig: { clientId, accessToken },
                        activeBroker: 'dhan',
                        watchlists: newWatchlists,
                        activeWatchlistId: dhanWatchlistId,
                        isConnected: true,
                        isAuthenticated: true,
                        feedStatus: 'CONNECTING'
                    };
                });
            },



            disconnectBroker: () => {
                set({
                    isConnected: false,
                    brokerCredentials: null,
                    dhanConfig: null,
                    activeBroker: null,
                    isAuthenticated: false,
                    feedStatus: 'DISCONNECTED'
                });
            },


            setFeedStatus: (status: FeedStatus) => {
                set({ feedStatus: status });
            },

            // ============================================
            // UTILITIES
            // ============================================

            reset: () => {
                set((state) => ({
                    watchlist: [],
                    orders: [],
                    positions: [],
                    tradeHistory: [],
                    dailyStats: [],
                    account: initialAccount,
                    isConnected: state.isConnected,
                    brokerCredentials: state.brokerCredentials
                }));
            },

            addFunds: (amount: number) => {
                set((state) => ({
                    account: {
                        ...state.account,
                        totalCapital: state.account.totalCapital + amount,
                        availableMargin: state.account.availableMargin + amount
                    }
                }));
            },

            checkAutoSquareOff: () => {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const currentTime = hours * 100 + minutes; // HHMM format

                const { positions, closePosition } = get();

                positions.forEach(pos => {
                    // Only auto-square off MIS (Intraday) positions that are still open
                    if (pos.productType !== 'MIS' || pos.quantity === 0) return;

                    let shouldSquareOff = false;

                    if (pos.exchange === 'MCX') {
                        // MCX: Square off at 11:15 PM (2315)
                        if (currentTime >= 2315) shouldSquareOff = true;
                    } else {
                        // NSE/BSE: Square off at 3:15 PM (1515)
                        if (currentTime >= 1515 && currentTime < 1600) shouldSquareOff = true;
                    }

                    if (shouldSquareOff) {
                        console.log(`[Auto Square-off] Triggered for ${pos.symbol} (${pos.productType})`);
                        closePosition(pos.securityId);
                    }
                });
            },

            getInstrumentDetails: (symbol: string, segment: string) => {
                return getInstrumentDetails(symbol, segment);
            },

            // ============================================
            // INTERNAL HELPERS (not exposed in interface)
            executeOrder: (order: Order) => {
                soundManager.play('success'); // EXECUTED SOUND
                set((state) => {
                    const existingPosition = state.positions.find(p => p.securityId === order.securityId);

                    // Get lot size for calculation
                    const instrumentDetails = get().getInstrumentDetails(order.symbol, order.segment);
                    const lotSize = instrumentDetails.lotSize;
                    const orderActualQty = instrumentDetails.isEquity ? order.filledQty : order.filledQty * lotSize;

                    let tradeLog: TradeLog | null = null;
                    const today = new Date().toISOString().split('T')[0];
                    let charges = 0;
                    let netPnl = 0;
                    let newQty = 0; // Declare it here

                    let realizedPnl = 0;
                    let avgBuyPrice = 0;
                    let avgSellPrice = 0;
                    let pos: Position;

                    if (!existingPosition) {
                        realizedPnl = 0; // New position
                        // Create new position with actual quantity
                        const newPosition: Position = {
                            securityId: order.securityId,
                            symbol: order.symbol,
                            exchange: order.exchange,
                            segment: order.segment,
                            productType: order.productType,
                            quantity: order.side === 'BUY' ? orderActualQty : -orderActualQty,
                            buyQty: order.side === 'BUY' ? orderActualQty : 0,
                            sellQty: order.side === 'SELL' ? orderActualQty : 0,
                            avgBuyPrice: order.side === 'BUY' ? order.avgPrice : 0,
                            avgSellPrice: order.side === 'SELL' ? order.avgPrice : 0,
                            ltp: order.avgPrice,
                            realizedPnl: 0,
                            unrealizedPnl: 0,
                            totalPnl: 0,
                            lotSize: lotSize,
                            marginUsed: order.marginBlocked || 0
                        };

                        return { positions: [...state.positions, newPosition] };
                    } else {
                        // Use existing position logic
                        pos = existingPosition;
                        realizedPnl = pos.realizedPnl;
                        avgBuyPrice = pos.avgBuyPrice;
                        avgSellPrice = pos.avgSellPrice;
                    }

                    // Refactoring map to for loop to avoid closure mutation issues with TypeScript
                    const updatedPositions: Position[] = [];
                    // Keep track of margin released to update account later
                    let totalMarginReleased = 0;

                    for (const p of state.positions) {
                        if (p.securityId !== order.securityId) {
                            updatedPositions.push(p);
                            continue;
                        }

                        pos = p; // Capture current pos
                        const isBuy = order.side === 'BUY';
                        newQty = isBuy ? pos.quantity + orderActualQty : pos.quantity - orderActualQty;

                        // Margin Logic
                        let currentMarginUsed = pos.marginUsed || 0;
                        // If we are ADDING to position (increasing absolute quantity), add blocked margin
                        if ((isBuy && pos.quantity >= 0) || (!isBuy && pos.quantity <= 0)) {
                            currentMarginUsed += (order.marginBlocked || 0);
                        }

                        let currentRealizedPnl = 0;
                        realizedPnl = pos.realizedPnl;
                        avgBuyPrice = pos.avgBuyPrice;
                        avgSellPrice = pos.avgSellPrice;

                        const isIncreasing = (isBuy && pos.quantity >= 0) || (!isBuy && pos.quantity <= 0);
                        const isFlipping = (isBuy && pos.quantity < 0 && newQty > 0) || (!isBuy && pos.quantity > 0 && newQty < 0);

                        // Handling Logic
                        if (isBuy) {
                            // BUY ORDER
                            if (pos.quantity < 0) {
                                // Reducing SHORT position
                                const closedQty = Math.min(orderActualQty, Math.abs(pos.quantity));

                                // Calculate Margin Released
                                const portionClosed = Math.abs(pos.quantity) > 0 ? (closedQty / Math.abs(pos.quantity)) : 0;
                                const marginReleased = currentMarginUsed * portionClosed;
                                currentMarginUsed -= marginReleased;
                                totalMarginReleased += marginReleased;

                                currentRealizedPnl = (pos.avgSellPrice - order.avgPrice) * closedQty;
                                realizedPnl += currentRealizedPnl;

                                if (isFlipping) {
                                    // Remaining part is new Long
                                    avgBuyPrice = order.avgPrice;
                                    // Margin for new long part comes from order.marginBlocked? 
                                    // Actually, calculateMargin returns 0 for reducing, so order.marginBlocked is 0.
                                    // Wait, if Flipping, new margin IS required.
                                    // calculateMargin handles flipping: returns margin valid for the EXCESS quantity.
                                    // So order.marginBlocked has the margin for the new leg.
                                    // We should add it to currentMarginUsed (which is close to 0 now).
                                    currentMarginUsed += (order.marginBlocked || 0);
                                }
                            } else {
                                // Adding to LONG position
                                const totalQty = pos.quantity + orderActualQty;
                                avgBuyPrice = ((pos.avgBuyPrice * pos.quantity) + (order.avgPrice * orderActualQty)) / totalQty;
                            }
                        } else {
                            // SELL ORDER
                            if (pos.quantity > 0) {
                                // Reducing LONG position
                                const closedQty = Math.min(orderActualQty, pos.quantity);

                                // Calculate Margin Released
                                const portionClosed = pos.quantity > 0 ? (closedQty / pos.quantity) : 0;
                                const marginReleased = currentMarginUsed * portionClosed;
                                currentMarginUsed -= marginReleased;
                                totalMarginReleased += marginReleased;

                                currentRealizedPnl = (order.avgPrice - pos.avgBuyPrice) * closedQty;
                                realizedPnl += currentRealizedPnl;

                                if (isFlipping) {
                                    // Remaining part is new Short
                                    avgSellPrice = order.avgPrice;
                                    currentMarginUsed += (order.marginBlocked || 0);
                                }
                            } else {
                                // Adding to SHORT position (pos.quantity is negative or 0)
                                const totalAbsQty = Math.abs(pos.quantity) + orderActualQty;
                                const weightedPrice = ((pos.avgSellPrice * Math.abs(pos.quantity)) + (order.avgPrice * orderActualQty));
                                // Avoid NaN if totalAbsQty is 0 (shouldn't be)
                                avgSellPrice = totalAbsQty !== 0 ? weightedPrice / totalAbsQty : order.avgPrice;
                            }
                        }

                        // Trade Log generation
                        if (currentRealizedPnl !== 0 || isFlipping || (isIncreasing && orderActualQty > 0)) {
                            tradeLog = {
                                id: `TL_${Date.now()}`,
                                symbol: pos.symbol,
                                exchange: pos.exchange,
                                productType: pos.productType,
                                quantity: order.quantity, // In Lots as per Order
                                lotSize: lotSize,
                                buyPrice: isBuy ? order.avgPrice : 0,
                                sellPrice: !isBuy ? order.avgPrice : 0,
                                realizedPnl: currentRealizedPnl,
                                segment: pos.segment, // Added for charge calculation
                                timestamp: Date.now(),
                                type: isBuy ? 'SHORT_CLOSE' : 'LONG_CLOSE',
                                charges: 0,
                                netPnl: 0
                            };
                        }

                        // Force quantity to 0 if it's very close (floating point fix)
                        if (Math.abs(newQty) < 0.001) {
                            newQty = 0;
                            currentMarginUsed = 0; // Ensure 0 if closed
                        }

                        const unrealizedPnlForPos = newQty !== 0
                            ? (newQty > 0 ? (pos.ltp - avgBuyPrice) * newQty : (avgSellPrice - pos.ltp) * Math.abs(newQty))
                            : 0;

                        const finalLtp = newQty === 0 ? order.avgPrice : pos.ltp; // If closed, show exit price as LTP

                        updatedPositions.push({
                            ...pos,
                            quantity: newQty,
                            buyQty: isBuy ? pos.buyQty + orderActualQty : pos.buyQty,
                            sellQty: !isBuy ? pos.sellQty + orderActualQty : pos.sellQty,
                            avgBuyPrice,
                            avgSellPrice,
                            ltp: finalLtp,
                            realizedPnl,
                            unrealizedPnl: unrealizedPnlForPos,
                            totalPnl: realizedPnl + unrealizedPnlForPos,
                            marginUsed: currentMarginUsed
                        });
                    }

                    // Calculate charges and Net P&L immediately if a trade happened
                    let newAccount = state.account;
                    if (tradeLog) {
                        charges = calculateCharges(tradeLog);
                        netPnl = tradeLog.realizedPnl - charges;

                        // Update Account Balance immediately
                        // Add Net PnL
                        // Add Releaed Margin (if any)

                        const newUsedMargin = state.account.usedMargin - totalMarginReleased;
                        // availableMargin = totalCapital - usedMargin
                        // totalCapital increases by netPnl

                        const newTotalCapital = state.account.totalCapital + netPnl;

                        newAccount = {
                            ...state.account,
                            totalCapital: newTotalCapital,
                            availableMargin: newTotalCapital - newUsedMargin,
                            usedMargin: newUsedMargin,
                            realizedPnl: state.account.realizedPnl + tradeLog.realizedPnl // Track gross realized too if needed, or net
                        };

                        // Add charges info to tradeLog for record keeping
                        // (We need to update the TradeLog type first, but purely for logic it works here as JS object)
                        // Ideally strictly typed, we should extend TradeLog interface.
                        // For now, attaching loosely.
                        tradeLog.charges = charges;
                        tradeLog.netPnl = netPnl;
                    }

                    // Update history and stats
                    const newTradeHistory = tradeLog ? [tradeLog, ...state.tradeHistory] : state.tradeHistory;
                    const newDailyStats = [...state.dailyStats];

                    if (tradeLog) {
                        const statsIdx = newDailyStats.findIndex(s => s.date === today);
                        if (statsIdx >= 0) {
                            newDailyStats[statsIdx] = {
                                ...newDailyStats[statsIdx],
                                realizedPnl: newDailyStats[statsIdx].realizedPnl + tradeLog.realizedPnl,
                                tradeCount: newDailyStats[statsIdx].tradeCount + 1
                            };
                        } else {
                            newDailyStats.push({
                                date: today,
                                realizedPnl: tradeLog.realizedPnl,
                                tradeCount: 1
                            });
                        }
                    }

                    return {
                        positions: updatedPositions,
                        tradeHistory: newTradeHistory,
                        dailyStats: newDailyStats,
                        account: newAccount
                    };

                });
            }
        } as unknown as TradingStore), // Type assertion to handle internal helper methods
        {
            name: 'trading-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                watchlist: state.watchlist,
                watchlists: state.watchlists,
                activeSymbol: state.activeSymbol,
                activeExpiry: state.activeExpiry,
                expiries: state.expiries,
                activeBroker: state.activeBroker,
                dhanConfig: state.dhanConfig,
                growwConfig: state.growwConfig,
                isAuthenticated: state.isAuthenticated,
                orders: state.orders,
                positions: state.positions,
                basket: state.basket,
                tradeHistory: state.tradeHistory,
                dailyStats: state.dailyStats,
                account: state.account,
                brokerCredentials: state.brokerCredentials,
                isConnected: state.isConnected,
                lastSettlementDate: state.lastSettlementDate,
                terminalSettings: state.terminalSettings,
                chartSettings: state.chartSettings
            })
        }
    )
);
