
"use client";

import React from 'react';
import { NewsWire } from '@/components/News/NewsWire';
import { SocialFeed } from '@/components/News/SocialFeed';
import { MarketSentiment } from '@/components/News/MarketSentiment';
import { ChevronLeft, LayoutGrid, Maximize2, Settings2, Share2, Search } from 'lucide-react';
import Link from 'next/link';
import { NewsDetailModal } from '@/components/News/NewsDetailModal';
import { NewsItem } from '@/utils/news/feeds';

export default function NewsPage() {
    const [selectedNews, setSelectedNews] = React.useState<NewsItem | null>(null);

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans select-none">
            {/* News Header */}
            <header className="h-12 border-b border-border flex items-center justify-between bg-card z-40 px-3 shrink-0">
                <div className="flex items-center h-full divide-x divide-border">
                    <Link href="/terminal" className="flex items-center gap-2 pr-3 pl-1 group cursor-pointer h-full hover:bg-muted transition-colors">
                        <ChevronLeft size={18} className="text-muted-foreground group-hover:text-primary transition-all" />
                        <div className="flex flex-col leading-none">
                            <span className="font-bold text-[13px] tracking-tight uppercase">Trading</span>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase">Go to Terminal</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4 px-4 h-full">
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border border-primary/20">
                            <LayoutGrid size={14} className="text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary">Intelligence Hub</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 h-full">
                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder="SEARCH SIGNALS..."
                            className="bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-bold outline-none focus:ring-1 focus:ring-primary w-64 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-1 border-l border-border pl-3">
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
                            <Share2 size={16} />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
                            <Settings2 size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Viewport */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: News Wire (25%) */}
                <div className="w-[400px] shrink-0">
                    <NewsWire onSelect={setSelectedNews} />
                </div>

                {/* Center: Social Feed (45%) */}
                <div className="flex-1 min-w-0">
                    <SocialFeed onSelect={setSelectedNews} />
                </div>

                {/* Right: Analytics & Sentiment (30%) */}
                <div className="w-[360px] shrink-0 border-l border-border">
                    <MarketSentiment />
                </div>
            </div>

            <NewsDetailModal
                item={selectedNews}
                onClose={() => setSelectedNews(null)}
            />

            {/* Footer */}
            <footer className="h-8 border-t border-border bg-card flex items-center px-3 justify-between text-[10px] font-bold text-muted-foreground z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="uppercase tracking-widest">Global Intelligence Link: Secure</span>
                    </div>
                    <div className="flex items-center gap-1 border-l border-border pl-4">
                        <Maximize2 size={12} />
                        <span className="uppercase tracking-widest">Multi-Source Validation Active</span>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <span className="text-primary font-black uppercase tracking-widest">Signal Strength: 98%</span>
                    <span className="opacity-60 uppercase tracking-widest">{new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}</span>
                </div>
            </footer>
        </div>
    );
}
