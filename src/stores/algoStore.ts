import { create } from 'zustand';

interface AlgoPosition {
    id: string;
    symbol: string;
    // other fields...
}

interface AlgoStore {
    liveVix: number;
    activePositions: AlgoPosition[];
    setLiveVix: (vix: number) => void;
    updatePrices: (idOrSymbol: string, price: number) => void;
}

export const useAlgoStore = create<AlgoStore>((set) => ({
    liveVix: 0,
    activePositions: [],
    setLiveVix: (vix) => set({ liveVix: vix }),
    updatePrices: (idOrSymbol, price) => {
        // Implementation for price updates in algo store
    },
}));
