
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { Search, Plus, MoreVertical, Globe, ChevronDown, Activity, ListPlus, GripVertical, Trash2 } from "lucide-react";
import { WatchlistItem, WatchlistGroup } from "@/types/terminal";
import { SidebarAd } from "@/components/Ads/AdBanner";

export const WatchlistManager: React.FC = () => {
    const {
        watchlists, activeWatchlistId, setActiveWatchlist, setSymbol, activeSymbol,
        openOrderModal, addWatchlist, addSection, addToWatchlist, reorderWatchlist, removeFromWatchlist
    } = useTerminalStore();

    const activeGroup = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSectionInputOpen, setIsSectionInputOpen] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [sectionName, setSectionName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Drag & Drop State
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling could go here
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            reorderWatchlist(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // Mock Search Data
    const SEARCH_DB = [
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 890.50, exchange: 'NSE' },
        { symbol: 'SBIN', name: 'State Bank of India', price: 645.20, exchange: 'NSE' },
        { symbol: 'INFY', name: 'Infosys Limited', price: 1650.00, exchange: 'NSE' },
        { symbol: 'ITC', name: 'ITC Limited', price: 445.10, exchange: 'NSE' },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7200.00, exchange: 'NSE' },
        { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 3150.00, exchange: 'NSE' },
        { symbol: 'MRF', name: 'MRF Ltd', price: 135000.00, exchange: 'NSE' },
        { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 145.00, exchange: 'NSE' },
    ];

    const filteredSearch = SEARCH_DB.filter(s =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddSymbol = (symbol: string, price: number) => {
        addToWatchlist({
            symbol,
            price,
            change: 0,
            changePercent: 0,
            exchange: 'NSE',
            isUp: true,
            type: 'SYMBOL'
        });
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    const handleCreateList = () => {
        if (newListName.trim()) {
            const id = newListName.toLowerCase().replace(/\s+/g, '-');
            addWatchlist({
                id,
                name: newListName,
                items: []
            });
            setActiveWatchlist(id);
            setNewListName("");
            setIsCreateOpen(false);
            setIsMenuOpen(false);
        }
    };

    const handleAddSection = () => {
        if (searchQuery.trim()) {
            addSection(searchQuery.toUpperCase());
            setSearchQuery("");
            setIsSearchOpen(false);
        } else if (sectionName.trim()) {
            addSection(sectionName.toUpperCase());
            setSectionName("");
            setIsSectionInputOpen(false);
        }
    };

    return (
        <aside className="w-80 h-full border-l border-border bg-card flex flex-col z-20 relative">
            {/* Header & Switcher */}
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Globe size={14} className="text-primary" />
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                        {activeGroup.name}
                    </span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsSectionInputOpen(!isSectionInputOpen)}
                        className={`p-1.5 rounded transition-colors hover:text-primary ${isSectionInputOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                        title="Add Section"
                    >
                        <ListPlus size={14} />
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary"
                        title="Search"
                    >
                        <Search size={14} />
                    </button>
                </div>
            </div>

            {/* Quick Section Input */}
            {isSectionInputOpen && (
                <div className="px-3 py-2 bg-muted/50 border-b border-border animate-in slide-in-from-top-2">
                    <input
                        autoFocus
                        value={sectionName}
                        onChange={e => setSectionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                        placeholder="SECTION NAME (E.G. BANKS)..."
                        className="w-full bg-background border border-border rounded px-2 py-1.5 text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary uppercase"
                    />
                </div>
            )}

            {/* Watchlist Switcher Dropdown */}
            {isMenuOpen && (
                <div className="absolute top-12 right-0 w-80 bg-popover border border-border shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                    {watchlists.map(w => (
                        <div
                            key={w.id}
                            className={`px-3 py-2.5 rounded-md cursor-pointer flex items-center justify-between group transition-all ${w.id === activeWatchlistId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                }`}
                            onClick={() => {
                                setActiveWatchlist(w.id);
                                setIsMenuOpen(false);
                            }}
                        >
                            <span className="text-[12px] font-bold uppercase tracking-tight">{w.name}</span>
                            <span className="text-[10px] opacity-60 font-black">{w.items.length} ITEMS</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-border">
                        {isCreateOpen ? (
                            <div className="flex flex-col gap-2 p-1">
                                <input
                                    autoFocus
                                    className="bg-muted px-2 py-1.5 rounded text-[11px] font-bold outline-none border border-transparent focus:border-primary"
                                    placeholder="LIST NAME..."
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateList} className="flex-1 bg-primary text-primary-foreground py-1 rounded text-[10px] font-black">CREATE</button>
                                    <button onClick={() => setIsCreateOpen(false)} className="flex-1 bg-muted text-muted-foreground py-1 rounded text-[10px] font-black">CANCEL</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="w-full px-3 py-2 text-[11px] font-black text-primary hover:bg-primary/10 rounded transition-all text-left uppercase"
                            >
                                + Create New List
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Search/Add Modal */}
            {isSearchOpen && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col p-4 animate-in fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Add Symbol</span>
                        <button onClick={() => setIsSearchOpen(false)}><ChevronDown className="rotate-180" size={18} /></button>
                    </div>
                    <input
                        autoFocus
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="SEARCH E.G. RELIANCE..."
                        className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-primary/20 mb-4"
                    />

                    {searchQuery && (
                        <div
                            onClick={handleAddSection}
                            className="bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-md mb-2 cursor-pointer hover:bg-primary/20 flex items-center justify-between"
                        >
                            <span className="text-[11px] font-black uppercase">ADD SECTION HEADER</span>
                            <span className="text-[10px] font-bold">"{searchQuery.toUpperCase()}"</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1">
                        {filteredSearch.map(s => (
                            <div
                                key={s.symbol}
                                onClick={() => handleAddSymbol(s.symbol, s.price)}
                                className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer group"
                            >
                                <div>
                                    <div className="text-[12px] font-black text-foreground">{s.symbol}</div>
                                    <div className="text-[10px] text-muted-foreground">{s.name}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded">{s.exchange}</span>
                                    <Plus size={14} className="text-muted-foreground group-hover:text-primary" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Column Headers */}
            <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-tighter border-b border-border bg-muted/20">
                <span className="col-span-6">Symbol</span>
                <span className="col-span-3 text-right">LTP / VOL</span>
                <span className="col-span-3 text-right">CHG%</span>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {activeGroup.items.map((item, index) => (
                    item.type === 'SECTION' ? (
                        <div
                            key={`section-${index}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="px-4 py-1.5 bg-secondary/50 border-y border-border flex items-center gap-2 cursor-move mt-2 group"
                        >
                            <div className="w-1 h-3 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                            <span className="text-[11px] font-black text-foreground/80 uppercase tracking-widest leading-none flex-1">{item.symbol}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromWatchlist(index);
                                    }}
                                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors text-muted-foreground"
                                >
                                    <Trash2 size={12} />
                                </button>
                                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors">
                                    <GripVertical size={12} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            key={`${item.symbol}-${index}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`px-4 py-3 border-b border-transparent hover:border-primary/20 hover:bg-muted cursor-grab active:cursor-grabbing flex justify-between items-center transition-all group relative ${activeSymbol === item.symbol ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                }`}
                            onClick={() => setSymbol(item.symbol)}
                        >
                            <div className="flex flex-col">
                                <span className={`text-[12px] font-bold tracking-tight transition-colors ${activeSymbol === item.symbol ? 'text-primary' : 'text-foreground group-hover:text-primary'
                                    }`}>
                                    {item.symbol}
                                </span>
                                <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                                    {item.exchange} • {item.description || "EQUITY"}
                                </span>
                            </div>

                            {/* Drag Handle (Visible on Hover) */}
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors -ml-1">
                                <GripVertical size={12} />
                            </div>

                            {/* Hover Quick Actions */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card/95 backdrop-blur shadow-sm pl-1 py-1 rounded-md z-10 border border-border/50">
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
                                    className="w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-black flex items-center justify-center transition-colors shadow-sm"
                                    title="Buy"
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
                                    className="w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-black flex items-center justify-center transition-colors shadow-sm"
                                    title="Sell"
                                >S</button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromWatchlist(index);
                                    }}
                                    className="w-5 h-5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded flex items-center justify-center transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-[13px] font-black font-mono text-foreground tabular-nums">
                                    {item.price.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-black ${item.isUp ? "text-up" : "text-down"}`}>
                                        {item.isUp ? "+" : ""}{item.change.toFixed(2)}
                                    </span>
                                    <span className={`text-[10px] font-black px-1 rounded-sm ${item.isUp ? "bg-up/10 text-up" : "bg-down/10 text-down"
                                        }`}>
                                        {item.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Sidebar Ad */}
            <div className="px-3 py-3 border-t border-border">
                <SidebarAd dismissible={true} />
            </div>

            {/* Footer Stat Bar */}
            <div className="h-8 px-4 border-t border-border flex items-center justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30">
                <span>{activeGroup.items.length} Symbols Selected</span>
                <span className="text-blue-500 animate-pulse">Live</span>
            </div>
        </aside>
    );
};
