
"use client";

import React, { useState } from "react";
import { useTradingStore } from "@/stores/tradingStore";
import {
    LayoutList,
    History,
    Wallet,
    ShieldCheck,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    XCircle,
    MoreHorizontal,
    ChevronDown,
    Search,
    Filter,
    X
} from "lucide-react";

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}> = ({ isOpen, title, message, onConfirm, onCancel, isDestructive }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="w-[380px] bg-card rounded-xl shadow-2xl border border-border p-5 relative z-10 pointer-events-auto animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-3 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 ${isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                        {isDestructive ? <XCircle size={24} /> : <ShieldCheck size={24} />}
                    </div>
                    <h3 className="text-lg font-black text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{message}</p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-black uppercase tracking-wide transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-2.5 rounded-lg text-white text-xs font-black uppercase tracking-wide transition-all shadow-lg active:scale-95 ${isDestructive
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                                : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PositionsPanel: React.FC<{ onToggle?: () => void }> = ({ onToggle }) => {
    const { positions, orders, account, closePosition, exitAllPositions, cancelOrder } = useTradingStore();
    const [activeTab, setActiveTab] = useState('positions');
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    // Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        type: 'CLOSE' | 'EXIT_ALL' | 'CANCEL_ORDER';
        symbol?: string;
        orderId?: string;
    }>({ isOpen: false, type: 'CLOSE' });

    const handleCloseClick = (securityId: string, symbol: string) => {
        setConfirmState({ isOpen: true, type: 'CLOSE', symbol, orderId: securityId });
    };

    const handleExitAllClick = () => {
        setConfirmState({ isOpen: true, type: 'EXIT_ALL' });
    };

    const handleCancelOrder = (orderId: string, symbol: string) => {
        setConfirmState({ isOpen: true, type: 'CANCEL_ORDER', symbol, orderId });
    };

    const handleConfirm = () => {
        if (confirmState.type === 'CLOSE' && confirmState.orderId) {
            closePosition(confirmState.orderId);
        } else if (confirmState.type === 'EXIT_ALL') {
            exitAllPositions();
        } else if (confirmState.type === 'CANCEL_ORDER' && confirmState.orderId) {
            cancelOrder(confirmState.orderId);
        }
        setConfirmState({ ...confirmState, isOpen: false });
    };

    const totalPnL = account.totalPnl;
    const isPnLUp = totalPnL >= 0;

    const filteredPositions = positions.filter(p =>
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title={confirmState.type === 'EXIT_ALL' ? 'Exit All Positions?' : `Close ${confirmState.symbol}?`}
                message={confirmState.type === 'EXIT_ALL'
                    ? "This will liquidate all active positions immediately at market price. Are you sure?"
                    : "This will close your open position at the current market price. Proceed?"}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
                isDestructive={true}
            />

            <div className="h-72 border-t border-border bg-card flex flex-col z-20 overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                {/* Tabs Header */}
                <div className="h-10 px-2 flex items-center justify-between border-b border-border bg-muted/20">
                    <div className="flex items-center gap-1 h-full">
                        <Tab active={activeTab === 'positions'} onClick={() => setActiveTab('positions')} icon={<Target size={14} />} label="Positions" count={positions.filter(p => p.quantity !== 0).length} />
                        <Tab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<LayoutList size={14} />} label="Orders" count={orders.filter(o => o.status === 'OPEN' || o.status === 'PENDING').length} />
                        <Tab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={14} />} label="Trade Log" />
                        <Tab active={activeTab === 'funds'} onClick={() => setActiveTab('funds')} icon={<Wallet size={14} />} label="Portfolio" />
                    </div>

                    <div className="flex items-center gap-4 pr-3">
                        {/* Search Bar */}
                        <div className={`flex items-center transition-all ${showSearch ? 'w-48 bg-muted/50' : 'w-8 bg-transparent'} h-7 rounded overflow-hidden`}>
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="w-8 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                                <Search size={14} />
                            </button>
                            {showSearch && (
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search Symbol..."
                                    className="w-full bg-transparent border-none outline-none text-[11px] font-bold px-1"
                                    onBlur={() => !searchQuery && setShowSearch(false)}
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded border border-border/50">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:inline">Total P&L</span>
                            <div className={`flex items-center gap-1 text-[12px] font-black tabular-nums transition-colors ${isPnLUp ? 'text-up' : 'text-down'}`}>
                                {isPnLUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                                {isPnLUp ? "+" : ""}{totalPnL.toFixed(2)}
                            </div>
                        </div>

                        <button
                            onClick={handleExitAllClick}
                            disabled={positions.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded text-[10px] font-black shadow-none hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-95 uppercase disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <XCircle size={14} /> <span className="hidden sm:inline">Exit All</span>
                        </button>
                        {onToggle && (
                            <button
                                onClick={onToggle}
                                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary"
                            >
                                <ChevronDown size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Panel Content (Table) */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-background/50">
                    {activeTab === 'positions' ? (
                        filteredPositions.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="sticky top-0 bg-card border-b border-border z-10 shadow-sm text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                        <th className="px-4 py-3 text-center w-16">Side</th>
                                        <th className="px-4 py-3 text-left">Instrument</th>
                                        <th className="px-4 py-3 text-right">Qty.</th>
                                        <th className="px-4 py-3 text-right">Avg.</th>
                                        <th className="px-4 py-3 text-right">LTP</th>
                                        <th className="px-4 py-3 text-right">P&L</th>
                                        <th className="px-4 py-3 text-right">Chg%</th>
                                        <th className="px-4 py-3 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPositions.map((pos, idx) => (
                                        <tr key={`${pos.securityId}-${idx}`} className="border-b border-border/30 hover:bg-muted/30 group transition-all">
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tight ${pos.quantity >= 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                                                    }`}>
                                                    {pos.quantity >= 0 ? 'LONG' : 'SHORT'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">{pos.symbol}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">{pos.exchange} • {pos.productType}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] font-black font-mono text-foreground tabular-nums opacity-90">{pos.quantity}</td>
                                            <td className="px-4 py-3 text-right text-[12px] font-bold font-mono text-muted-foreground tabular-nums">
                                                {(pos.quantity > 0 ? pos.avgBuyPrice : pos.avgSellPrice).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] font-black font-mono text-foreground tabular-nums opacity-90">{pos.ltp.toFixed(2)}</td>
                                            <td className={`px-4 py-3 text-right text-[13px] font-black font-mono tabular-nums ${pos.totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
                                                {pos.totalPnl >= 0 ? "+" : ""}{pos.totalPnl.toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-3 text-right text-[11px] font-bold font-mono tabular-nums ${pos.totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
                                                <span className={`px-1.5 py-0.5 rounded ${pos.totalPnl >= 0 ? 'bg-up/10' : 'bg-down/10'}`}>
                                                    {pos.totalPnl !== 0 && pos.avgBuyPrice > 0 ? ((pos.totalPnl / (Math.abs(pos.quantity) * (pos.quantity > 0 ? pos.avgBuyPrice : pos.avgSellPrice))) * 100).toFixed(2) : "0.00"}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                                    {pos.quantity !== 0 && (
                                                        <button
                                                            onClick={() => handleCloseClick(pos.securityId, pos.symbol)}
                                                            className="px-3 py-1.5 bg-background border border-border hover:bg-destructive hover:border-destructive hover:text-white rounded text-[10px] font-black transition-all shadow-sm uppercase tracking-tight"
                                                        >
                                                            Close
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <ShieldCheck size={32} className="text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest">No Active Positions</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium mt-1">Trades executed today will appear here.</p>
                                </div>
                            </div>
                        )
                    ) : activeTab === 'orders' ? (
                        orders.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="sticky top-0 bg-card border-b border-border z-10 shadow-sm text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                        <th className="px-4 py-3 text-center w-16">Side</th>
                                        <th className="px-4 py-3 text-left">Instrument</th>
                                        <th className="px-4 py-3 text-right">Qty.</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Time</th>
                                        <th className="px-4 py-3 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, idx) => (
                                        <tr key={order.orderId} className="border-b border-border/30 hover:bg-muted/30 group transition-all">
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tight ${order.side === 'BUY' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {order.side}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-foreground">{order.symbol}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">{order.orderType} • {order.productType}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] font-black font-mono text-foreground tabular-nums opacity-90">{order.quantity}</td>
                                            <td className="px-4 py-3 text-right text-[12px] font-bold font-mono text-muted-foreground tabular-nums">{order.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${order.status === 'EXECUTED' ? 'bg-up/10 text-up' :
                                                    order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'bg-down/10 text-down' :
                                                        'bg-primary/10 text-primary animate-pulse'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[10px] font-medium text-muted-foreground tabular-nums">
                                                {new Date(order.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {(order.status === 'OPEN' || order.status === 'PENDING') && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.orderId, order.symbol)}
                                                        className="px-3 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded text-[9px] font-black transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <LayoutList size={32} className="text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest">No Active Orders</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium mt-1">Submit an order to see it here.</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 gap-3">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Wallet size={32} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest">{activeTab.replace('history', 'Trade Log').replace('funds', 'Portfolio').toUpperCase()} Empty</h3>
                                <p className="text-[11px] text-muted-foreground font-medium mt-1">No data available for this section yet.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                <div className="h-8 px-4 border-t border-border flex items-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/20">
                    <span className="flex items-center gap-2">
                        <Wallet size={12} className="text-primary" />
                        Margin Available: <span className="text-foreground tabular-nums text-[11px] font-bold">₹{account.availableMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </span>
                    <span className="w-px h-4 bg-border/50" />
                    <span className="flex items-center gap-2">
                        <Target size={12} className="text-destructive" />
                        Margin Used: <span className="text-destructive tabular-nums text-[11px] font-bold">₹{account.usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </span>
                    <div className="flex-1" />
                    <span className="flex items-center gap-1.5 text-primary cursor-pointer hover:underline underline-offset-4 decoration-2 transition-all hover:text-primary/80">
                        <History size={11} /> Detailed Log
                    </span>
                </div>
            </div>
        </>
    );
};

const Tab = ({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) => (
    <div
        onClick={onClick}
        className={`px-4 flex items-center h-full gap-2 cursor-pointer transition-all border-b-[2px] relative group ${active
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
    >
        <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
        {count !== undefined && count > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors'
                }`}>
                {count}
            </span>
        )}
        {active && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
    </div>
);
