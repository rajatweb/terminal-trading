
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsItem, MOCK_NEWS, generateLiveNews } from '@/utils/news/feeds';
import { Newspaper, Bell, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface NewsWireProps {
    onSelect?: (item: NewsItem) => void;
}

export const NewsWire: React.FC<NewsWireProps> = ({ onSelect }) => {
    const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
    const [activeRegion, setActiveRegion] = useState<NewsItem['region'] | 'ALL'>('ALL');

    useEffect(() => {
        const interval = setInterval(() => {
            const newItem = generateLiveNews();
            setNews(prev => [newItem, ...prev.slice(0, 49)]); // Increased buffer for better filtering
        }, 12000);

        return () => clearInterval(interval);
    }, []);

    const filteredNews = news.filter(item => activeRegion === 'ALL' || item.region === activeRegion);

    return (
        <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden">
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <Newspaper size={16} className="text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Real-Time News Wire</span>
                </div>
            </div>

            {/* Region Filter Bar */}
            <div className="h-10 px-2 border-b border-border bg-background/50 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {['ALL', 'INDIA', 'USA', 'GLOBAL', 'EUROPE', 'ASIA'].map((region) => (
                    <button
                        key={region}
                        onClick={() => setActiveRegion(region as any)}
                        className={`px-3 h-7 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all shrink-0 ${activeRegion === region
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        {region}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                <AnimatePresence initial={false}>
                    {filteredNews.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={() => onSelect?.(item)}
                            className="p-3 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${item.importance === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {item.importance}
                                    </span>
                                    <span className="text-[9px] font-black bg-muted px-1.5 py-0.5 rounded text-foreground/80 uppercase tracking-tighter border border-border/50">
                                        {item.region}
                                    </span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.source}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock size={10} />
                                    <span className="text-[9px] font-medium">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <h3 className="text-xs font-bold leading-relaxed group-hover:text-primary transition-colors mb-1">{item.title}</h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-normal">{item.content}</p>

                            <div className="mt-2 flex items-center justify-between">
                                <span className={`text-[10px] font-black tracking-widest ${item.category === 'MACRO' ? 'text-indigo-400' :
                                    item.category === 'CRYPTO' ? 'text-orange-400' :
                                        item.category === 'STOCKS' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                    {item.category}
                                </span>
                                <div className="flex items-center gap-1">
                                    {item.sentiment === 'BULLISH' ? (
                                        <TrendingUp size={12} className="text-emerald-500" />
                                    ) : item.sentiment === 'BEARISH' ? (
                                        <TrendingDown size={12} className="text-rose-500" />
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
