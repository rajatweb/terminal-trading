
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { ChevronDown, Filter, Info, Layers, Maximize2, RefreshCw, XCircle } from "lucide-react";

export const OptionChain: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
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
        <div className="flex flex-col h-full bg-surface w-[600px] z-20 transition-colors duration-theme">
            {/* Header ... */}
            <div className="h-12 px-4 flex items-center justify-between bg-surface-hover">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-black text-blue-600 uppercase tracking-tighter">{activeSymbol} Chain</span>
                    <div className="flex items-center gap-2 px-2 py-1 bg-surface-elevated rounded cursor-pointer group">
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-blue-500 transition-colors uppercase">{activeExpiry}</span>
                        <ChevronDown size={12} className="text-text-muted" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-accent transition-all"><Filter size={14} /></button>
                    <button className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-accent transition-all"><RefreshCw size={14} /></button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-rose-500 transition-all ml-1"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table Header ... */}
            <div className="grid grid-cols-11 bg-surface-hover/30">
                {/* CALLS */}
                <div className="col-span-5 grid grid-cols-5 text-[9px] font-black text-text-muted uppercase tracking-widest text-center py-2">
                    <span className="text-emerald-500 opacity-60">OI</span>
                    <span>VOL</span>
                    <span>IV</span>
                    <span>CHG</span>
                    <span className="text-emerald-500">LTP</span>
                </div>
                {/* STRIKE */}
                <div className="col-span-1 text-[9px] font-black text-blue-500 uppercase tracking-widest text-center py-2 bg-blue-500/5">
                    STRIKE
                </div>
                {/* PUTS */}
                <div className="col-span-5 grid grid-cols-5 text-[9px] font-black text-text-muted uppercase tracking-widest text-center py-2">
                    <span className="text-rose-500">LTP</span>
                    <span>CHG</span>
                    <span>IV</span>
                    <span>VOL</span>
                    <span className="text-rose-500 opacity-60">OI</span>
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
                            className={`grid grid-cols-11 hover:bg-surface-hover transition-colors group ${isATM ? 'ring-1 ring-inset ring-accent/30' : ''
                                }`}
                        >
                            {/* CE Data */}
                            <div className={`col-span-5 grid grid-cols-5 text-[11px] font-mono py-1.5 items-center ${isITM_CE ? 'bg-emerald-500/5' : ''
                                }`}>
                                <span className="text-center opacity-70 tabular-nums">{s.ce.oi}L</span>
                                <span className="text-center opacity-70 tabular-nums">{s.ce.volume}k</span>
                                <span className="text-center opacity-50 tabular-nums">{s.ce.iv}</span>
                                <span className="text-center text-emerald-500 font-bold tabular-nums">+{s.ce.change}%</span>
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
                            <div className={`col-span-1 flex items-center justify-center bg-blue-50/50 dark:bg-blue-500/5 text-[11px] font-black text-blue-600 dark:text-blue-400 tabular-nums ${isATM ? 'bg-blue-600 text-white' : ''
                                }`}>
                                {s.strike}
                            </div>

                            {/* PE Data */}
                            <div className={`col-span-5 grid grid-cols-5 text-[11px] font-mono py-1.5 items-center ${isITM_PE ? 'bg-rose-500/5' : ''
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
                                <span className="text-center text-rose-500 font-bold tabular-nums">{s.pe.change}%</span>
                                <span className="text-center opacity-50 tabular-nums">{s.pe.iv}</span>
                                <span className="text-center opacity-70 tabular-nums">{s.pe.volume}k</span>
                                <span className="text-center opacity-70 tabular-nums">{s.pe.oi}L</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Meta */}
            <div className="h-10 px-4 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase bg-surface-hover/50">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Info size={12} className="text-blue-500" /> Greeks Calibrated</span>
                    <span className="flex items-center gap-1.5"><Layers size={12} /> Straddle: 1540.20</span>
                </div>
                <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-black"><Maximize2 size={12} /> Full Chart</button>
            </div>
        </div>
    );
};
