
"use client";

import React, { useState } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
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
    ChevronDown
} from "lucide-react";

export const PositionsPanel: React.FC<{ onToggle?: () => void }> = ({ onToggle }) => {
    const { positions, marginAvailable, marginUsed } = useTerminalStore();
    const [activeTab, setActiveTab] = useState('positions');

    const totalPnL = positions.reduce((acc, curr) => acc + curr.pnl, 0);
    const isPnLUp = totalPnL >= 0;

    return (
        <div className="h-64 border-t border-border bg-card flex flex-col z-20 overflow-hidden">
            {/* Tabs Header */}
            <div className="h-10 px-2 flex items-center justify-between border-b border-border bg-muted/30">
                <div className="flex items-center gap-1 h-full">
                    <Tab active={activeTab === 'positions'} onClick={() => setActiveTab('positions')} icon={<Target size={14} />} label="Positions" count={positions.length} />
                    <Tab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<LayoutList size={14} />} label="Orders" />
                    <Tab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={14} />} label="Trade Log" />
                    <Tab active={activeTab === 'funds'} onClick={() => setActiveTab('funds')} icon={<Wallet size={14} />} label="Holdings" />
                </div>

                <div className="flex items-center gap-4 pr-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total P&L</span>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black tabular-nums ${isPnLUp ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                            }`}>
                            {isPnLUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isPnLUp ? "+" : ""}{totalPnL.toFixed(2)}
                        </div>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black shadow-lg shadow-rose-500/20 transition-all active:scale-95 uppercase">
                        <XCircle size={12} /> Exit All
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
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="sticky top-0 bg-card border-b border-border z-10">
                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-tighter w-12 text-center">Type</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Instrument</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-gray-400 uppercase tracking-tighter">Qty</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-gray-400 uppercase tracking-tighter">Avg. Price</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-gray-400 uppercase tracking-tighter">LTP</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-gray-400 uppercase tracking-tighter">PnL</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-gray-400 uppercase tracking-tighter">Chg%</th>
                            <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((pos, idx) => (
                            <tr key={`${pos.symbol}-${idx}`} className="border-b border-border/30 hover:bg-muted/50 group transition-colors">
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black ${pos.type === 'BUY' ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                                        }`}>
                                        {pos.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors uppercase">{pos.symbol}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">NSE • EQUITY</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-[12px] font-black font-mono text-foreground tabular-nums">{pos.qty}</td>
                                <td className="px-4 py-3 text-right text-[12px] font-bold font-mono text-muted-foreground tabular-nums">{pos.entryPrice.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-[12px] font-black font-mono text-foreground tabular-nums">{pos.currentPrice.toFixed(2)}</td>
                                <td className={`px-4 py-3 text-right text-[12px] font-black font-mono tabular-nums ${pos.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                                    {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toFixed(2)}
                                </td>
                                <td className={`px-4 py-3 text-right text-[12px] font-bold font-mono tabular-nums ${pos.pnlPercent >= 0 ? 'text-up' : 'text-down'}`}>
                                    {pos.pnlPercent.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1 bg-gray-100 dark:bg-[#2a2e39] hover:bg-rose-500 hover:text-white rounded text-[10px] font-black transition-all">CLOSE</button>
                                        <button className="p-1 hover:text-blue-500"><MoreHorizontal size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {positions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30">
                        <ShieldCheck size={48} className="mb-2" />
                        <span className="text-[12px] font-black uppercase tracking-widest">No active positions</span>
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="h-8 px-4 border-t border-border flex items-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30">
                <span className="flex items-center gap-1.5"><Wallet size={12} /> Margin Available: <span className="text-foreground tabular-nums">{marginAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                <span className="flex items-center gap-1.5"><Target size={12} /> Margin Used: <span className="text-down tabular-nums">{marginUsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                <div className="flex-1" />
                <span className="flex items-center gap-1.5 text-primary cursor-pointer hover:underline underline-offset-4 decoration-2"><History size={11} /> View Detailed Order History</span>
            </div>
        </div>
    );
};

const Tab = ({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) => (
    <div
        onClick={onClick}
        className={`px-4 flex items-center h-full gap-2 cursor-pointer transition-all border-b-2 ${active
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
    >
        {icon}
        <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
        {count !== undefined && (
            <span className={`px-1 rounded-sm text-[9px] font-black ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                {count}
            </span>
        )}
    </div>
);
