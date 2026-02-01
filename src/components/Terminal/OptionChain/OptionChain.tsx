
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { ChevronDown, Filter, Info, Layers, Maximize2, RefreshCw } from "lucide-react";

export const OptionChain: React.FC = () => {
    const { activeSymbol, optionChain, openOrderModal } = useTerminalStore();
    const [activeExpiry, setActiveExpiry] = useState("25 JAN 2024");

    // Fallback Mock Data if Store is Empty
    const mockStrikes = Array.from({ length: 21 }, (_, i) => {
        const strike = 21000 + (i * 50);
        return {
            strike,
            ce: { ltp: 120 + i * 10, change: 5.4, oi: 15.2, volume: 1.2, iv: 14.5 },
            pe: { ltp: 85 + (20 - i) * 5, change: -2.1, oi: 12.8, volume: 0.8, iv: 16.2 }
        };
    });

    const displayData = optionChain.length > 0 ? optionChain : mockStrikes;

    const handleOrder = (type: 'BUY' | 'SELL', side: 'CE' | 'PE', strike: number, ltp: number) => {
        openOrderModal({
            symbol: `${activeSymbol} ${strike} ${side}`,
            type,
            instrumentType: 'OPTION',
            price: ltp,
            ltp
        });
    };

    return (
        <div className="flex flex-col h-full bg-card border-l border-border w-[600px] z-20">
            {/* Header ... */}
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-black text-primary uppercase tracking-tighter">{activeSymbol} Chain</span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-card border border-border rounded cursor-pointer group">
                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase">{activeExpiry}</span>
                        <ChevronDown size={12} className="text-muted-foreground" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"><Filter size={14} /></button>
                    <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"><RefreshCw size={14} /></button>
                </div>
            </div>

            {/* Table Header ... */}
            <div className="grid grid-cols-11 border-b border-border bg-muted/20">
                {/* CALLS */}
                <div className="col-span-5 grid grid-cols-5 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center py-2 border-r border-border/30">
                    <span className="text-up opacity-60">OI</span>
                    <span>VOL</span>
                    <span>IV</span>
                    <span>CHG</span>
                    <span className="text-up">LTP</span>
                </div>
                {/* STRIKE */}
                <div className="col-span-1 text-[9px] font-black text-primary uppercase tracking-widest text-center py-2 bg-primary/5">
                    STRIKE
                </div>
                {/* PUTS */}
                <div className="col-span-5 grid grid-cols-5 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center py-2 border-l border-border/30">
                    <span className="text-down">LTP</span>
                    <span>CHG</span>
                    <span>IV</span>
                    <span>VOL</span>
                    <span className="text-down opacity-60">OI</span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {displayData.map((s, idx) => {
                    const isITM_CE = s.strike < 21500;
                    const isITM_PE = s.strike > 21500;
                    const isATM = s.strike === 21500;

                    return (
                        <div
                            key={s.strike}
                            className={`grid grid-cols-11 border-b border-border/30 hover:bg-muted/50 transition-colors group ${isATM ? 'ring-1 ring-inset ring-primary/30' : ''
                                }`}
                        >
                            {/* CE Data */}
                            <div className={`col-span-5 grid grid-cols-5 text-[11px] font-mono py-1.5 border-r border-border/10 items-center ${isITM_CE ? 'bg-up/5' : ''
                                }`}>
                                <span className="text-center opacity-70 tabular-nums">{s.ce.oi}L</span>
                                <span className="text-center opacity-70 tabular-nums">{s.ce.volume}k</span>
                                <span className="text-center opacity-50 tabular-nums">{s.ce.iv}</span>
                                <span className="text-center text-up font-bold tabular-nums">+{s.ce.change}%</span>
                                <div className="relative flex items-center justify-center group/ltp">
                                    <span className="font-black text-foreground tabular-nums group-hover/ltp:opacity-0 transition-opacity">{s.ce.ltp.toFixed(2)}</span>
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/ltp:opacity-100 transition-all scale-90 group-hover/ltp:scale-100">
                                        <button
                                            onClick={() => handleOrder('BUY', 'CE', s.strike, s.ce.ltp)}
                                            className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black flex items-center justify-center shadow-lg shadow-blue-500/40 transition-colors"
                                        >B</button>
                                        <button
                                            onClick={() => handleOrder('SELL', 'CE', s.strike, s.ce.ltp)}
                                            className="w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/40 transition-colors"
                                        >S</button>
                                    </div>
                                </div>
                            </div>

                            {/* Strike */}
                            <div className={`col-span-1 flex items-center justify-center bg-primary/5 text-[11px] font-black text-primary tabular-nums ${isATM ? 'bg-primary text-primary-foreground' : ''
                                }`}>
                                {s.strike}
                            </div>

                            {/* PE Data */}
                            <div className={`col-span-5 grid grid-cols-5 text-[11px] font-mono py-1.5 border-l border-border/10 items-center ${isITM_PE ? 'bg-down/5' : ''
                                }`}>
                                <div className="relative flex items-center justify-center group/ltp">
                                    <span className="font-black text-foreground tabular-nums group-hover/ltp:opacity-0 transition-opacity">{s.pe.ltp.toFixed(2)}</span>
                                    <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover/ltp:opacity-100 transition-all scale-90 group-hover/ltp:scale-100">
                                        <button
                                            onClick={() => handleOrder('BUY', 'PE', s.strike, s.pe.ltp)}
                                            className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black flex items-center justify-center shadow-lg shadow-blue-500/40 transition-colors"
                                        >B</button>
                                        <button
                                            onClick={() => handleOrder('SELL', 'PE', s.strike, s.pe.ltp)}
                                            className="w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/40 transition-colors"
                                        >S</button>
                                    </div>
                                </div>
                                <span className="text-center text-down font-bold tabular-nums">{s.pe.change}%</span>
                                <span className="text-center opacity-50 tabular-nums">{s.pe.iv}</span>
                                <span className="text-center opacity-70 tabular-nums">{s.pe.volume}k</span>
                                <span className="text-center opacity-70 tabular-nums">{s.pe.oi}L</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Meta */}
            <div className="h-10 px-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase bg-muted/30">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Info size={12} className="text-primary" /> Greeks Calibrated</span>
                    <span className="flex items-center gap-1.5"><Layers size={12} /> Straddle: 1540.20</span>
                </div>
                <button className="flex items-center gap-1 text-primary hover:text-primary/80 font-black"><Maximize2 size={12} /> Full Chart</button>
            </div>
        </div>
    );
};
