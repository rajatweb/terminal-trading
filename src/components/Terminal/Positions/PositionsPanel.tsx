"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTerminalStore } from '@/stores/terminalStore';
import { ConfirmationModal } from '@/components/Modals/ConfirmationModal';

export const PositionsPanel: React.FC = () => {
    const { positions, exitPosition } = useTerminalStore();
    const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
    const [confirmExit, setConfirmExit] = useState<string | null>(null);

    const handleExitPosition = (symbol: string) => {
        exitPosition(symbol);
        setConfirmExit(null);
    };

    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalPnLPercent = positions.length > 0
        ? positions.reduce((sum, pos) => sum + pos.pnlPercent, 0) / positions.length
        : 0;

    return (
        <>
            <aside
                data-tour="positions"
                className="w-80 h-full bg-chart-bg flex flex-col z-20"
            >
                {/* Header */}
                <div className="h-12 px-4 flex items-center justify-between bg-surface-elevated">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-500" />
                        <span className="text-[11px] font-black text-text-muted uppercase tracking-wider">
                            Positions ({positions.length})
                        </span>
                    </div>
                    {positions.length > 0 && (
                        <div className={`text-[11px] font-black ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                {positions.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-accent/5 dark:to-purple-500/5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Total P&L</p>
                                <p className={`text-[16px] font-black ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Avg Return</p>
                                <p className={`text-[16px] font-black ${totalPnLPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Positions List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {positions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <TrendingUp size={48} className="mb-4 opacity-20 dark:opacity-30" />
                            <p className="text-[12px] font-bold uppercase text-center">No Active Positions</p>
                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                Place an order from the watchlist to start trading
                            </p>
                        </div>
                    ) : (
                        <div>
                            {positions.map((position) => {
                                const isExpanded = expandedPosition === position.symbol;
                                const isProfitable = position.pnl >= 0;

                                return (
                                    <div
                                        key={position.symbol}
                                        className="hover:bg-surface-hover transition-colors"
                                    >
                                        {/* Main Row */}
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() => setExpandedPosition(isExpanded ? null : position.symbol)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {position.type === 'BUY' ? (
                                                        <TrendingUp size={14} className="text-blue-500" />
                                                    ) : (
                                                        <TrendingDown size={14} className="text-red-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-[12px] font-black text-foreground">
                                                            {position.symbol}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase">
                                                            {position.type} • {position.qty} QTY
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[13px] font-black ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {isProfitable ? '+' : ''}₹{position.pnl.toFixed(2)}
                                                    </p>
                                                    <p className={`text-[10px] font-black ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px]">
                                                <div>
                                                    <span className="text-text-muted font-bold">Entry: </span>
                                                    <span className="text-foreground font-black">₹{position.entryPrice.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted font-bold">LTP: </span>
                                                    <span className="text-foreground font-black">₹{position.currentPrice.toFixed(2)}</span>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp size={14} className="text-text-muted" />
                                                ) : (
                                                    <ChevronDown size={14} className="text-text-muted" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-surface-hover rounded-lg p-3 space-y-2">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-text-muted font-bold">Investment</span>
                                                        <span className="text-foreground font-black">
                                                            ₹{(position.entryPrice * position.qty).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-text-muted font-bold">Current Value</span>
                                                        <span className="text-foreground font-black">
                                                            ₹{(position.currentPrice * position.qty).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmExit(position.symbol);
                                                            }}
                                                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded transition-colors uppercase"
                                                        >
                                                            Exit Position
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-8 px-4 flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-widest bg-surface-hover/50">
                    <span>Active: {positions.length}</span>
                    <span className={totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {totalPnL >= 0 ? '↑' : '↓'} {Math.abs(totalPnLPercent).toFixed(2)}%
                    </span>
                </div>
            </aside>

            {/* Confirmation Modal */}
            {confirmExit && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setConfirmExit(null)}
                    onConfirm={() => handleExitPosition(confirmExit)}
                    title="Exit Position"
                    message={`Are you sure you want to exit your position in ${confirmExit}? This will close the trade at the current market price.`}
                    confirmText="Exit Position"
                    variant="warning"
                />
            )}
        </>
    );
};
