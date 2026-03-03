export const SYMBOL_MAP: Record<string, { id: string; segment: string; type: string; step?: number }> = {
    "NIFTY": { id: "13", segment: "IDX_I", type: "INDEX", step: 50 },
    "BANKNIFTY": { id: "25", segment: "IDX_I", type: "INDEX", step: 100 },
    "FINNIFTY": { id: "27", segment: "IDX_I", type: "INDEX", step: 50 },
    "RELIANCE": { id: "2885", segment: "NSE_EQ", type: "EQUITY" },
    "HDFCBANK": { id: "1333", segment: "NSE_EQ", type: "EQUITY" },
    "TCS": { id: "11536", segment: "NSE_EQ", type: "EQUITY" },
    "INFY": { id: "1594", segment: "NSE_EQ", type: "EQUITY" },
    "ICICIBANK": { id: "4963", segment: "NSE_EQ", type: "EQUITY" },
    "SBIN": { id: "3045", segment: "NSE_EQ", type: "EQUITY" },
    "BHARTIARTL": { id: "10604", segment: "NSE_EQ", type: "EQUITY" },
    "AXISBANK": { id: "5900", segment: "NSE_EQ", type: "EQUITY" },
    "IT": { id: "13", segment: "IDX_I", type: "INDEX" }, // Generic for Nifty IT usually has its own
};

export const getSymbolConfig = (symbol: string) => {
    return SYMBOL_MAP[symbol] || SYMBOL_MAP[symbol.toUpperCase()] || null;
};
