
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_SOCIAL, NewsItem } from '@/utils/news/feeds';
import { Twitter, MessageSquare, Repeat2, Heart, Share, ShieldCheck } from 'lucide-react';

interface SocialFeedProps {
    onSelect?: (item: NewsItem) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ onSelect }) => {
    const [activeRegion, setActiveRegion] = React.useState<NewsItem['region'] | 'ALL'>('ALL');

    const filteredPosts = MOCK_SOCIAL.filter(post => activeRegion === 'ALL' || post.region === activeRegion);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden border-r border-border">
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-card/50">
                <div className="flex items-center gap-2">
                    <Twitter size={16} className="text-[#1DA1F2]" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Macro Influence Engine</span>
                </div>
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                    {['ALL', 'INDIA', 'USA'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setActiveRegion(r as any)}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${activeRegion === r ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 divide-y divide-border">
                {filteredPosts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => onSelect?.(post)}
                        className="p-4 hover:bg-muted/30 transition-all cursor-pointer"
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
                                {post.source.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-black truncate">{post.source}</span>
                                    <ShieldCheck size={14} className="text-[#1DA1F2] shrink-0" />
                                    <span className="text-[10px] text-muted-foreground truncate">{post.handle}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[12px] leading-relaxed mb-3 text-foreground/90">
                                    {post.content}
                                </p>
                                <div className="flex items-center justify-between max-w-xs text-muted-foreground">
                                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                        <MessageSquare size={14} />
                                        <span className="text-[10px] font-bold">42</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors">
                                        <Repeat2 size={14} />
                                        <span className="text-[10px] font-bold">128</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                                        <Heart size={14} />
                                        <span className="text-[10px] font-bold">1.2k</span>
                                    </button>
                                    <button className="hover:text-primary transition-colors">
                                        <Share size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                <div className="p-8 text-center text-muted-foreground">
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2">Searching for new signals...</p>
                    <div className="flex justify-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
