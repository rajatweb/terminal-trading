
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Info, TrendingUp, TrendingDown, Eye } from 'lucide-react';

const SentimentGauge = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={`h-full ${color} shadow-[0_0_8px_rgba(var(--color))]`}
            />
        </div>
    </div>
);

export const MarketSentiment: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Sentiment Analytics</span>
                </div>
            </div>

            <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                        <TrendingUp size={20} className="text-emerald-500 mb-1" />
                        <span className="text-[14px] font-black text-emerald-500">68%</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Bullish Volume</span>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center">
                        <TrendingDown size={20} className="text-rose-500 mb-1" />
                        <span className="text-[14px] font-black text-rose-500">32%</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Bearish Volume</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <SentimentGauge label="Fear & Greed Index" value={74} color="bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <SentimentGauge label="Institutional Momentum" value={82} color="bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <SentimentGauge label="Retail Exhaustion" value={45} color="bg-gradient-to-r from-purple-500 to-pink-500" />
                </div>

                <div className="p-3 border border-border bg-background/50 rounded-lg flex items-start gap-3">
                    <Info size={14} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-tight text-foreground mb-1">Deep Intelligence Note</p>
                        <p className="text-[9px] text-muted-foreground leading-relaxed">
                            Market depth suggests high liquidity around current levels. Institutional flow indicates accumulation phase for tech sector. Watch for macro volatility at NY open.
                        </p>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trending Symbols</span>
                        <Activity size={12} className="text-primary animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {['$NVDA', '$BTC', '$TSLA', '$AAPL', '$ETH', '$NIFTY'].map(sym => (
                            <span key={sym} className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-black hover:border-primary transition-colors cursor-pointer">
                                {sym}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-border bg-muted/10">
                <div className="flex items-center gap-2 mb-2">
                    <Eye size={12} className="text-muted-foreground" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Volume Heatmap</span>
                </div>
                <div className="grid grid-cols-10 gap-0.5 h-6">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-sm ${Math.random() > 0.7 ? 'bg-emerald-500' :
                                    Math.random() > 0.4 ? 'bg-emerald-500/40' : 'bg-muted'
                                }`}
                        />
                    )).slice(0, 40)}
                </div>
            </div>
        </div>
    );
};
