
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Globe, Share2, Bookmark, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { NewsItem } from '@/utils/news/feeds';

interface NewsDetailModalProps {
    item: NewsItem | null;
    onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header Image/Background */}
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <Share2 size={18} />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <Bookmark size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 bg-background/50 hover:bg-background rounded-full transition-colors shadow-sm"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 -mt-12 relative">
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.importance === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                {item.importance} IMPORTANCE
                            </span>
                            <span className="text-[10px] font-black bg-muted px-2 py-1 rounded-full text-foreground/70 uppercase tracking-widest border border-border/50">
                                {item.region}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.category === 'MACRO' ? 'bg-indigo-500/10 text-indigo-500' :
                                    item.category === 'CRYPTO' ? 'bg-orange-500/10 text-orange-500' :
                                        item.category === 'STOCKS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                {item.category}
                            </span>
                        </div>

                        <h2 className="text-2xl font-black leading-tight mb-4 tracking-tight">
                            {item.title}
                        </h2>

                        <div className="flex items-center gap-6 mb-8 text-muted-foreground border-y border-border/50 py-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {item.source.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-foreground uppercase">{item.source}</span>
                                    {item.handle && <span className="text-[10px]">{item.handle}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <Clock size={14} className="text-primary" />
                                {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-sm leading-relaxed text-foreground/80 first-letter:text-4xl first-letter:font-black first-letter:text-primary first-letter:mr-2 first-letter:float-left">
                                {item.content}
                            </p>
                            <p className="text-sm leading-relaxed text-foreground/80 mt-4">
                                Market analysts suggest that this development could lead to significant volatility in the {item.category.toLowerCase()} segment over the coming sessions. Traders are advised to monitor key technical levels and institutional flow data for further confirmation.
                            </p>
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Sentiment Score:</span>
                                    {item.sentiment === 'BULLISH' ? (
                                        <div className="flex items-center gap-1 text-emerald-500">
                                            <TrendingUp size={14} />
                                            <span className="text-xs font-bold uppercase">Optimistic</span>
                                        </div>
                                    ) : item.sentiment === 'BEARISH' ? (
                                        <div className="flex items-center gap-1 text-rose-500">
                                            <TrendingDown size={14} />
                                            <span className="text-xs font-bold uppercase">Pessimistic</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Neutral</span>
                                    )}
                                </div>
                            </div>

                            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                                <ExternalLink size={14} />
                                View Full Intelligence Report
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
