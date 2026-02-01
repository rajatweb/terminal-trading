
export interface WatchlistItem {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    exchange: string;
    description?: string;
    isUp: boolean;
}

export interface WatchlistGroup {
    id: string;
    name: string;
    items: WatchlistItem[];
}

export interface Position {
    symbol: string;
    qty: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    type: 'BUY' | 'SELL';
    status: 'ACTIVE' | 'CLOSED';
}

export interface Order {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    instrumentType: 'EQUITY' | 'OPTION' | 'INDEX';
    product: 'CNC' | 'MIS' | 'NRML';
    orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    qty: number;
    price: number;
    status: 'PENDING' | 'EXECUTED' | 'REJECTED' | 'CANCELLED';
    timestamp: number;
}

export interface OptionStrike {
    strike: number;
    ce: {
        ltp: number;
        change: number;
        oi: number;
        volume: number;
        iv: number;
    };
    pe: {
        ltp: number;
        change: number;
        oi: number;
        volume: number;
        iv: number;
    };
}

export interface NSEOrder {
    symbol: string;
    type: 'BUY' | 'SELL';
    instrumentType: 'EQUITY' | 'OPTION' | 'INDEX';
    product: 'CNC' | 'MIS' | 'NRML';
    orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    price?: number;
    triggerPrice?: number;
    qty: number;
    lotSize?: number;
}

export interface OrderModalState {
    isOpen: boolean;
    symbol: string;
    type: 'BUY' | 'SELL';
    instrumentType: 'EQUITY' | 'OPTION' | 'INDEX';
    price: number;
    ltp: number;
}

export interface TerminalState {
    activeSymbol: string;
    activeWatchlistId: string;
    watchlists: WatchlistGroup[];
    positions: Position[];
    optionChain: OptionStrike[];
    orders: Order[];
    marginAvailable: number;
    marginUsed: number;
    orderModal: OrderModalState;
}
