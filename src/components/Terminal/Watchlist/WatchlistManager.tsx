
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { Search, Plus, MoreVertical, Globe, ChevronDown, Activity } from "lucide-react";
import { WatchlistItem, WatchlistGroup } from "@/types/terminal";
import { SidebarAd } from "@/components/Ads/AdBanner";

export const WatchlistManager: React.FC = () => {
    const { watchlists, activeWatchlistId, setActiveWatchlist, setSymbol, activeSymbol, openOrderModal } = useTerminalStore();
    const activeGroup = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <aside className="w-80 h-full border-l border-gray-200 dark:border-[#2a2e39] bg-white dark:bg-[#131722] flex flex-col z-20">
            {/* Header & Switcher */}
            <div className="h-12 px-4 border-b border-gray-100 dark:border-[#2a2e39] flex items-center justify-between bg-gray-50/50 dark:bg-black/10">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Globe size={14} className="text-blue-500" />
                    <span className="text-[11px] font-black text-gray-500 dark:text-[#b2b5be] uppercase tracking-wider group-hover:text-blue-500 transition-colors">
                        {activeGroup.name}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#2a2e39] rounded transition-colors">
                        <Plus size={14} className="text-gray-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#2a2e39] rounded transition-colors text-gray-500">
                        <Search size={14} />
                    </button>
                </div>
            </div>

            {/* Watchlist Switcher Dropdown (Conditional) */}
            {isMenuOpen && (
                <div className="absolute top-12 right-0 w-80 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                    {watchlists.map(w => (
                        <div
                            key={w.id}
                            className={`px-3 py-2.5 rounded-md cursor-pointer flex items-center justify-between group transition-all ${w.id === activeWatchlistId ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-[#2a2e39]'
                                }`}
                            onClick={() => {
                                setActiveWatchlist(w.id);
                                setIsMenuOpen(false);
                            }}
                        >
                            <span className="text-[12px] font-bold uppercase tracking-tight">{w.name}</span>
                            <span className="text-[10px] opacity-60 font-black">{w.items.length} SAMPLES</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#2a2e39]">
                        <button className="w-full px-3 py-2 text-[11px] font-black text-blue-500 hover:bg-blue-500/10 rounded transition-all text-left uppercase">
                            Create New List +
                        </button>
                    </div>
                </div>
            )}

            {/* Column Headers */}
            <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-black text-gray-400 dark:text-[#787b86] uppercase tracking-tighter border-b border-gray-100 dark:border-[#2a2e39] bg-gray-50/20 dark:bg-black/5">
                <span className="col-span-6">Symbol</span>
                <span className="col-span-3 text-right">LTP / VOL</span>
                <span className="col-span-3 text-right">CHG%</span>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeGroup.items.map((item) => (
                    <div
                        key={item.symbol}
                        className={`px-4 py-3 border-b border-transparent hover:border-blue-500/20 hover:bg-gray-50 dark:hover:bg-[#1e222d] cursor-pointer flex justify-between items-center transition-all group relative ${activeSymbol === item.symbol ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                            }`}
                        onClick={() => setSymbol(item.symbol)}
                    >
                        <div className="flex flex-col">
                            <span className={`text-[12px] font-bold tracking-tight transition-colors ${activeSymbol === item.symbol ? 'text-blue-500' : 'text-gray-900 dark:text-[#d1d4dc] group-hover:text-blue-500'
                                }`}>
                                {item.symbol}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors uppercase">
                                {item.exchange} • {item.description || "EQUITY"}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[13px] font-black font-mono text-gray-900 dark:text-[#d1d4dc] tabular-nums">
                                {item.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-black ${item.isUp ? "text-emerald-500" : "text-rose-500"}`}>
                                    {item.isUp ? "+" : ""}{item.change.toFixed(2)}
                                </span>
                                <span className={`text-[10px] font-black px-1 rounded-sm ${item.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                    }`}>
                                    {item.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-[#1e222d] pl-2 z-10 shadow-[-10px_0_10px_rgba(255,255,255,1)] dark:shadow-[-10px_0_10px_rgba(30,34,45,1)]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openOrderModal({
                                        symbol: item.symbol,
                                        type: 'BUY',
                                        instrumentType: (item.symbol === 'NIFTY' || item.symbol === 'BANKNIFTY' || item.symbol.includes('NIFTY')) ? 'INDEX' : 'EQUITY',
                                        price: item.price,
                                        ltp: item.price
                                    });
                                }}
                                className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black flex items-center justify-center transition-colors"
                            >B</button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openOrderModal({
                                        symbol: item.symbol,
                                        type: 'SELL',
                                        instrumentType: (item.symbol === 'NIFTY' || item.symbol === 'BANKNIFTY' || item.symbol.includes('NIFTY')) ? 'INDEX' : 'EQUITY',
                                        price: item.price,
                                        ltp: item.price
                                    });
                                }}
                                className="w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black flex items-center justify-center transition-colors"
                            >S</button>
                            <button className="p-1 hover:text-blue-500 transition-colors ml-1"><Activity size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sidebar Ad */}
            <div className="px-3 py-3 border-t border-gray-100 dark:border-[#2a2e39]">
                <SidebarAd dismissible={true} />
            </div>

            {/* Footer Stat Bar */}
            <div className="h-8 px-4 border-t border-gray-100 dark:border-[#2a2e39] flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-black/10">
                <span>{activeGroup.items.length} Symbols Selected</span>
                <span className="text-blue-500 animate-pulse">Live</span>
            </div>
        </aside>
    );
};
