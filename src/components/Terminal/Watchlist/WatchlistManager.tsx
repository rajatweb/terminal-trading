"use client";

import React, { useState, useMemo } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { Search, Plus, MoreVertical, Globe, ChevronDown, Activity, X } from "lucide-react";
import { WatchlistItem, WatchlistGroup } from "@/types/terminal";
import { SidebarAd } from "@/components/Ads/AdBanner";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableWatchlistItem } from './SortableWatchlistItem';

export const WatchlistManager: React.FC = () => {
    const { watchlists, activeWatchlistId, setActiveWatchlist, setSymbol, activeSymbol, openOrderModal, addWatchlist, addWatchlistSection, reorderWatchlist } = useTerminalStore();
    const activeGroup = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Watchlist creation state
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState("");

    // Section creation state
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [sectionName, setSectionName] = useState("");

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Drag starts after 8px movement
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = activeGroup.items.findIndex((item) => (item.id || item.symbol) === active.id);
            const newIndex = activeGroup.items.findIndex((item) => (item.id || item.symbol) === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(activeGroup.items, oldIndex, newIndex);
                reorderWatchlist(activeWatchlistId, newItems);
            }
        }
    };

    const handleCreateWatchlist = () => {
        if (!newListName.trim()) return;
        const newId = newListName.toLowerCase().replace(/\s+/g, '-');
        addWatchlist({
            id: newId,
            name: newListName,
            items: []
        });
        setActiveWatchlist(newId);
        setNewListName("");
        setIsCreating(false);
        setIsMenuOpen(false);
    };

    const handleAddSection = () => {
        if (!sectionName.trim()) return;
        addWatchlistSection(activeWatchlistId, sectionName.toUpperCase());
        setSectionName("");
        setIsAddingSection(false);
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return activeGroup.items;
        return activeGroup.items.filter(item => {
            if (item.type === 'SECTION') return false; // Hide sections during search
            return item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [activeGroup.items, searchQuery]);

    return (
        <aside className="w-80 h-full bg-surface flex flex-col z-20 transition-colors duration-theme">
            {/* Header & Switcher */}
            <div className="h-12 px-4 flex items-center justify-between bg-surface-hover">
                {!isSearching ? (
                    <>
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <Globe size={14} className="text-blue-500" />
                            <span className="text-[11px] font-black text-text-muted uppercase tracking-wider group-hover:text-accent transition-colors">
                                {activeGroup.name}
                            </span>
                            <ChevronDown size={14} className="text-text-muted" />
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsAddingSection(!isAddingSection)}
                                className={`p-1.5 rounded transition-colors ${isAddingSection ? 'bg-accent/10 text-accent' : 'hover:bg-surface-hover text-text-muted'}`}
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                onClick={() => { setIsSearching(true); setTimeout(() => document.getElementById('watchlist-search')?.focus(), 50); }}
                                className="p-1.5 hover:bg-surface-hover rounded transition-colors text-text-muted"
                            >
                                <Search size={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <Search size={14} className="text-blue-500" />
                        <input
                            id="watchlist-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH SYMBOL..."
                            className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-foreground placeholder-text-muted uppercase"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsSearching(false);
                                    setSearchQuery("");
                                }
                            }}
                        />
                        <button
                            onClick={() => { setIsSearching(false); setSearchQuery(""); }}
                            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-text-muted transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Watchlist Switcher Dropdown (Conditional) */}
            {isMenuOpen && (
                <div className="absolute top-12 right-0 w-80 bg-surface-elevated shadow-xl z-50 p-2 rounded-lg animate-in fade-in slide-in-from-top-2">
                    {watchlists.map(w => (
                        <div
                            key={w.id}
                            className={`px-3 py-2.5 rounded-md cursor-pointer flex items-center justify-between group transition-all ${w.id === activeWatchlistId ? 'bg-accent text-white' : 'hover:bg-surface-hover'
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
                    <div className="mt-2 pt-2">
                        <div className="w-full">
                            {!isCreating ? (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full px-3 py-2 text-[11px] font-black text-blue-500 hover:bg-blue-500/10 rounded transition-all text-left uppercase"
                                >
                                    Create New List +
                                </button>
                            ) : (
                                <div className="px-3 py-1 flex flex-col gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="LIST NAME"
                                        className="w-full bg-input-bg text-[11px] font-bold p-1.5 rounded outline-none focus:ring-2 focus:ring-accent/40 uppercase"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateWatchlist();
                                            if (e.key === 'Escape') setIsCreating(false);
                                        }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCreateWatchlist}
                                            className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1 rounded hover:bg-blue-700"
                                        >
                                            CREATE
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-2 py-1 bg-surface-hover text-text-muted text-[10px] font-bold rounded hover:bg-border"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Section Creation Input */}
            {isAddingSection && !isSearching && (
                <div className="px-4 py-2 bg-accent/5 animate-in slide-in-from-top-2">
                    <input
                        autoFocus
                        type="text"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="SECTION NAME (E.G. BANKS)"
                        className="w-full bg-input-bg text-[10px] font-bold p-1.5 rounded outline-none focus:ring-2 focus:ring-accent/30 uppercase"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSection();
                            if (e.key === 'Escape') setIsAddingSection(false);
                        }}
                    />
                </div>
            )}

            {/* Column Headers */}
            <div className="grid grid-cols-12 px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-tighter bg-surface-hover/50">
                <span className="col-span-6">Symbol</span>
                <span className="col-span-3 text-right">LTP / VOL</span>
                <span className="col-span-3 text-right">CHG%</span>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                    // Search Results (No DnD)
                    <div>
                        {filteredItems.map((item) => (
                            <SortableWatchlistItem
                                key={item.id || item.symbol}
                                item={item}
                                activeSymbol={activeSymbol}
                                setSymbol={setSymbol}
                                openOrderModal={openOrderModal}
                            />
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-text-muted uppercase font-bold">
                                No symbols found
                            </div>
                        )}
                    </div>
                ) : (
                    // Draggable List
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={activeGroup.items.map(i => i.id || i.symbol)}
                            strategy={verticalListSortingStrategy}
                        >
                            {activeGroup.items.map((item) => (
                                <SortableWatchlistItem
                                    key={item.id || item.symbol}
                                    item={item}
                                    activeSymbol={activeSymbol}
                                    setSymbol={setSymbol}
                                    openOrderModal={openOrderModal}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Sidebar Ad */}
            <div className="px-3 py-3">
                <SidebarAd dismissible={true} />
            </div>

            {/* Footer Stat Bar */}
            <div className="h-8 px-4 flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-widest bg-surface-hover/50">
                <span>{activeGroup.items.length} Symbols Selected</span>
                <span className="text-blue-500 animate-pulse">Live</span>
            </div>
        </aside>
    );
};
