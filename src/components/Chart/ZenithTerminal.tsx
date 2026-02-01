
"use client";

import React, { useState, useEffect } from "react";
import TradingChart from "./TradingChart";
import { OHLCV } from "@/types/chart";
import { useTheme } from "next-themes";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart,
    Minus,
    Type,
    Settings,
    Search,
    Bell,
    Clock,
    ChevronDown,
    ChevronUp,
    Sun,
    Moon,
    ArrowUpRight,
    StretchHorizontal,
    StretchVertical,
    Square,
    Ruler,
    LayoutGrid,
    Navigation,
    Layers,
    Wind,
    Target,
    LayoutTemplate,
    Camera,
    Undo2,
    Redo2,
    Activity,
    Globe,
    Lock,
    Unlock,
    Command,
} from "lucide-react";

import { WatchlistManager } from "../Terminal/Watchlist/WatchlistManager";
import { OptionChain } from "../Terminal/OptionChain/OptionChain";
import { PositionsPanel } from "../Terminal/Dashboard/PositionsTable";
import { OrderModal } from "../Terminal/OrderModal";
import { useTerminalStore } from "@/stores/terminalStore";
import { AdBanner, SidebarAd } from "../Ads/AdBanner";
import { WatchlistItem as StoreWatchlistItem, Position, OptionStrike } from "@/types/terminal";

export interface WatchlistItem {
    symbol: string;
    price: string;
    change: string;
    isUp: boolean;
    exchange?: string;
}

export interface ZenithTerminalProps {
    data: OHLCV[];
    symbol: string;
    watchlist?: WatchlistItem[];
    positions?: Position[];
    optionChain?: OptionStrike[];
    onSymbolChange?: (symbol: string) => void;
    onIntervalChange?: (interval: string) => void;
    activeInterval?: string;
    isLoading?: boolean;
    headerTitle?: string;
    headerLogo?: React.ReactNode;
}

const ZenithTerminal: React.FC<ZenithTerminalProps> = ({
    data,
    symbol,
    watchlist = [],
    positions = [],
    optionChain = [],
    onSymbolChange,
    onIntervalChange,
    activeInterval = "5m",
    isLoading = false,
    headerTitle = "Institutional Suite",
    headerLogo,
}) => {
    const [activeTool, setActiveTool] = useState<string>("cursor");
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { activeSymbol, setSymbol, watchlists, addWatchlist, setPositions, updateOptionChain } = useTerminalStore();

    // Layout State
    const [showWatchlist, setShowWatchlist] = useState(true);
    const [showOptionChain, setShowOptionChain] = useState(false);
    const [showPositions, setShowPositions] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (symbol) setSymbol(symbol);

        // Sync positions and option chain if provided
        if (positions.length > 0) setPositions(positions);
        if (optionChain.length > 0) updateOptionChain(optionChain);

        // Seed watchlist from props if provided and not already present
        if (watchlist.length > 0 && !watchlists.find(w => w.id === 'external')) {
            const externalGroup = {
                id: 'external',
                name: 'Watchlist',
                items: watchlist.map(item => ({
                    symbol: item.symbol,
                    price: parseFloat(item.price.replace(/,/g, '')),
                    change: parseFloat(item.change.replace(/%/g, '')), // Simplified
                    changePercent: parseFloat(item.change.replace(/%/g, '')),
                    exchange: item.exchange || 'NSE',
                    isUp: item.isUp
                }))
            };
            addWatchlist(externalGroup);
        }
    }, [symbol, setSymbol, watchlist, watchlists, addWatchlist, positions, optionChain, setPositions, updateOptionChain]);

    useEffect(() => {
        if (onSymbolChange) onSymbolChange(activeSymbol);
    }, [activeSymbol, onSymbolChange]);

    if (!mounted) return null;

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className="flex flex-col h-screen bg-[#f1f3f6] dark:bg-[#131722] text-gray-900 dark:text-[#d1d4dc] font-sans select-none overflow-hidden transition-colors duration-300">
                {/* Refined Top Navigation Bar */}
                <header className="h-12 border-b border-gray-200 dark:border-[#2a2e39] flex items-center justify-between bg-white dark:bg-[#131722] z-40 px-3 shrink-0">
                    <div className="flex items-center h-full divide-x divide-gray-100 dark:divide-[#2a2e39]">
                        {/* Logo & Symbol Selector */}
                        <div
                            className="flex items-center gap-2 pr-3 pl-1 group cursor-pointer h-full hover:bg-gray-50 dark:hover:bg-[#1e222d] transition-colors"
                        >
                            {headerLogo || (
                                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">Z</div>
                            )}
                            <div className="flex flex-col leading-none">
                                <span className="font-bold text-[13px] tracking-tight text-gray-900 dark:text-[#d1d4dc] uppercase">{activeSymbol}</span>
                                <span className="text-[9px] font-medium text-gray-400 group-hover:text-blue-500 transition-colors uppercase">{headerTitle}</span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </div>

                        {/* Intervals */}
                        <div className="flex items-center gap-1 px-3 h-full">
                            {["1m", "5m", "15m", "1h", "D"].map((interval) => (
                                <button
                                    key={interval}
                                    onClick={() => onIntervalChange?.(interval)}
                                    className={`h-8 px-2.5 rounded text-[11px] font-semibold transition-all ${interval === activeInterval
                                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 font-black border border-blue-200 dark:border-blue-500/20"
                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1e222d] hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    {interval}
                                </button>
                            ))}
                        </div>

                        {/* Dash Layout Controls */}
                        <div className="flex items-center gap-1 px-4 h-full border-l border-gray-100 dark:border-[#2a2e39]">
                            <Tip text="Toggle Watchlist">
                                <button
                                    onClick={() => setShowWatchlist(!showWatchlist)}
                                    className={`p-1.5 rounded transition-all ${showWatchlist ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
                                >
                                    <Globe size={16} />
                                </button>
                            </Tip>
                            <Tip text="Toggle Option Chain">
                                <button
                                    onClick={() => setShowOptionChain(!showOptionChain)}
                                    className={`p-1.5 rounded transition-all ${showOptionChain ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
                                >
                                    <Layers size={16} />
                                </button>
                            </Tip>
                            <Tip text="Toggle Positions">
                                <button
                                    onClick={() => setShowPositions(!showPositions)}
                                    className={`p-1.5 rounded transition-all ${showPositions ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
                                >
                                    <Target size={16} />
                                </button>
                            </Tip>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 h-full divide-x divide-gray-100 dark:divide-[#2a2e39]">
                        <div className="flex items-center gap-3 pl-4">
                            <div
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] cursor-pointer hover:border-blue-500/50 transition-all shadow-sm"
                            >
                                {theme === 'dark' ? (
                                    <Moon size={14} className="text-blue-400" />
                                ) : (
                                    <Sun size={14} className="text-yellow-500" />
                                )}
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{theme}</span>
                            </div>

                            <button className="flex items-center gap-2 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all active:scale-95">
                                <Activity size={14} />
                                <span>{isLoading ? "SYNCING..." : "TRADING TERMINAL"}</span>
                                <ChevronDown size={14} className="opacity-50" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Top Ad Banner */}
                {/* <AdBanner position="top" dismissible={true}>
                    <div className="flex items-center justify-center gap-3 py-2.5 px-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                        <div className="flex-1 text-center">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                💎 Premium Features • Real-Time Market Data, Advanced Indicators & AI Signals
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                Join 50,000+ traders using institutional-grade tools • 7-day free trial
                            </p>
                        </div>
                        <button className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg">
                            Start Free Trial
                        </button>
                    </div>
                </AdBanner> */}

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Professional Left Toolbar */}
                    <aside className="w-[48px] border-r border-gray-200 dark:border-[#2a2e39] flex flex-col items-center py-2 space-y-1 bg-white dark:bg-[#131722] z-30">
                        <ToolButton active={activeTool === 'cursor'} onClick={() => setActiveTool('cursor')} icon={<Navigation size={18} className="rotate-[-45deg]" />} title="Cursor (Esc)" />
                        <div className="w-8 h-[1px] bg-gray-100 dark:bg-[#2a2e39] my-1" />

                        <ToolButton active={activeTool === 'trendline'} onClick={() => setActiveTool('trendline')} icon={<Minus size={18} className="rotate-[135deg]" />} title="Trendline" />
                        <ToolButton active={activeTool === 'horizontalLine'} onClick={() => setActiveTool('horizontalLine')} icon={<StretchHorizontal size={18} />} title="Horizontal Line" />
                        <ToolButton active={activeTool === 'verticalLine'} onClick={() => setActiveTool('verticalLine')} icon={<StretchVertical size={18} />} title="Vertical Line" />

                        <div className="w-8 h-[1px] bg-gray-100 dark:bg-[#2a2e39] my-1" />

                        <ToolButton active={activeTool === 'fibonacci'} onClick={() => setActiveTool('fibonacci')} icon={<LayoutGrid size={18} />} title="Fib Retracement" />
                        <ToolButton active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} icon={<Square size={18} />} title="Geometric Shapes" />

                        <div className="w-8 h-[1px] bg-gray-100 dark:bg-[#2a2e39] my-1" />

                        <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={18} />} title="Annotation Tools" />
                        <ToolButton active={activeTool === 'priceRange'} onClick={() => setActiveTool('priceRange')} icon={<Ruler size={18} />} title="Measurement Tool" />

                        <div className="flex-1" />

                        <ToolButton active={false} onClick={() => { }} icon={<Layers size={18} />} title="Object Tree" />
                        <ToolButton active={false} onClick={() => { }} icon={<Settings size={18} />} title="Chart Settings" />
                    </aside>

                    {/* Dashboard Center */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        <div className="flex flex-1 overflow-hidden relative">
                            {/* Main Chart Area */}
                            <main className="flex-1 relative bg-white dark:bg-[#131722] overflow-hidden">
                                <TradingChart
                                    data={data}
                                    activeTool={activeTool}
                                    symbol={activeSymbol}
                                    interval={activeInterval}
                                    onToolComplete={() => setActiveTool('cursor')}
                                />
                            </main>

                            {/* Conditional Panels */}
                            <AnimatePresence>
                                {showOptionChain && (
                                    <motion.div
                                        initial={{ x: 600 }}
                                        animate={{ x: 0 }}
                                        exit={{ x: 600 }}
                                        className="h-full"
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    >
                                        <OptionChain />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Dashboard */}
                        <div className="relative">
                            {/* Bottom Ad Banner - Shows when positions panel is collapsed */}
                            {/* {!showPositions && (
                                <AdBanner position="bottom" dismissible={true}>
                                    <div className="flex items-center justify-between py-2 px-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                                                📈
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Algorithmic Trading Strategies
                                                </p>
                                                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                                                    Automate your trades with proven strategies • Backtested & optimized
                                                </p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-md">
                                            Explore Strategies
                                        </button>
                                    </div>
                                </AdBanner>
                            )} */}

                            <AnimatePresence mode="wait">
                                {showPositions ? (
                                    <motion.div
                                        key="positions-panel"
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-gray-200 dark:border-[#2a2e39]"
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    >
                                        <PositionsPanel onToggle={() => setShowPositions(false)} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="positions-handle"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        onClick={() => setShowPositions(true)}
                                        className="h-8 bg-white dark:bg-[#1e222d] border-t border-gray-200 dark:border-[#2a2e39] flex items-center justify-between px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2e39] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Target size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">Positions (3)</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total P&L:</span>
                                                <span className="text-[10px] font-black text-emerald-500 tabular-nums">+₹445.00</span>
                                            </div>
                                            <ChevronUp size={16} className="text-gray-400 group-hover:text-blue-500 transition-all" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Pro Watchlist Panel */}
                    <AnimatePresence>
                        {showWatchlist && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 320 }}
                                exit={{ width: 0 }}
                                className="overflow-hidden h-full"
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            >
                                <div className="w-80 h-full">
                                    <WatchlistManager />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Professional Status Bar */}
                <footer className="h-9 border-t border-gray-200 dark:border-[#2a2e39] bg-white dark:bg-[#131722] flex items-center px-3 justify-between text-[11px] font-bold text-gray-500 dark:text-[#787b86] z-40">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                            <span className="group-hover:text-gray-900 dark:group-hover:text-[#d1d4dc] transition-colors uppercase tracking-tight">Data Stream: Online</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] opacity-60">
                            <span className="flex items-center gap-1 font-black text-blue-500 uppercase tracking-widest shrink-0">ZENITH v1.0.4</span>
                            <span className="flex items-center gap-1 border-l border-gray-200 dark:border-[#2a2e39] pl-4"><Command size={11} /> Dashboard Mode</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-[#1e222d] rounded-md border border-gray-100 dark:border-[#2a2e39]">
                            <Lock size={12} className="text-emerald-500" />
                            <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">SECURE TRANSACTION TUNNEL</span>
                        </div>
                    </div>
                </footer>
                <OrderModal />
            </div>
        </Tooltip.Provider>
    );
};

// Helper Components
const NavButton = ({ icon, label, count }: { icon: React.ReactNode, label: string, count?: number }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1e222d] rounded-md cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-[#2a2e39] group">
        <span className="text-gray-500 dark:text-[#b2b5be] group-hover:text-blue-500 transition-colors">{icon}</span>
        <span className="text-[12px] font-bold text-gray-600 dark:text-[#d1d4dc] group-hover:text-blue-500 transition-colors">{label}</span>
        {count && count > 0 ? (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full">{count}</span>
        ) : null}
    </div>
);

const NavIconButton = ({ icon, onClick }: { icon: React.ReactNode, onClick?: () => void }) => (
    <div onClick={onClick} className="p-2 text-gray-400 dark:text-[#787b86] hover:text-gray-900 dark:hover:text-[#d1d4dc] hover:bg-gray-100 dark:hover:bg-[#2a2e39] rounded-lg cursor-pointer transition-all">
        {icon}
    </div>
);

const Tip = ({ children, text }: { children: React.ReactNode, text: string }) => (
    <Tooltip.Root>
        <Tooltip.Trigger asChild>
            {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
            <Tooltip.Content
                side="bottom"
                sideOffset={8}
                className="bg-[#1e222d] text-[#d1d4dc] text-[10px] font-black px-2.5 py-1.5 rounded shadow-xl z-[100] animate-in fade-in zoom-in-95 border border-[#363a45] pointer-events-none uppercase tracking-widest"
            >
                {text}
                <Tooltip.Arrow className="fill-[#1e222d]" />
            </Tooltip.Content>
        </Tooltip.Portal>
    </Tooltip.Root>
);

const ToolButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string }) => (
    <Tip text={title}>
        <div
            onClick={onClick}
            className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50'
                : 'text-gray-500 dark:text-[#b2b5be] hover:bg-gray-100 dark:hover:bg-[#2a2e39] hover:text-blue-500 dark:hover:text-white'
                }`}
        >
            {icon}
        </div>
    </Tip>
);

export default ZenithTerminal;
