
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WatchlistItem } from '@/types/terminal';
import { Activity, GripVertical } from 'lucide-react';

interface SortableWatchlistItemProps {
    item: WatchlistItem;
    activeSymbol: string;
    setSymbol: (symbol: string) => void;
    openOrderModal: (config: any) => void;
}

export const SortableWatchlistItem = ({ item, activeSymbol, setSymbol, openOrderModal }: SortableWatchlistItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id || item.symbol });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    if (item.type === 'SECTION') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="px-4 py-1.5 bg-surface-hover text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 cursor-grab active:cursor-grabbing group"
            >
                <GripVertical size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                {item.sectionLabel}
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`px-4 py-3 hover:bg-surface-hover cursor-pointer flex justify-between items-center transition-all group relative ${activeSymbol === item.symbol ? 'bg-accent/5' : ''
                }`}
            onClick={() => setSymbol(item.symbol)}
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 -ml-2 transition-opacity">
                        <GripVertical size={12} className="text-text-muted" />
                    </div>
                    <span className={`text-[12px] font-bold tracking-tight transition-colors ${activeSymbol === item.symbol ? 'text-accent' : 'text-foreground group-hover:text-foreground'
                        }`}>
                        {item.symbol}
                    </span>
                </div>
                <span className="text-[9px] font-bold text-text-muted group-hover:text-text-secondary transition-colors uppercase pl-3">
                    {item.exchange} • {item.description || "EQUITY"}
                </span>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-[13px] font-black font-mono text-foreground tabular-nums">
                    {item.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black ${item.isUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {item.isUp ? "+" : ""}{item.change.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-black px-1 rounded-sm ${item.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                        {item.changePercent.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Hover Quick Actions */}
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-surface-elevated pl-2 z-10 shadow-xl rounded-l">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openOrderModal({
                            symbol: item.symbol,
                            type: 'BUY',
                            instrumentType: (item.symbol === 'NIFTY' || item.symbol === 'BANKNIFTY' || item.symbol.includes('NIFTY')) ? 'INDEX' : 'EQUITY',
                            price: item.price,
                            ltp: item.price
                        });
                    }}
                    className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black flex items-center justify-center transition-colors"
                >B</button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openOrderModal({
                            symbol: item.symbol,
                            type: 'SELL',
                            instrumentType: (item.symbol === 'NIFTY' || item.symbol === 'BANKNIFTY' || item.symbol.includes('NIFTY')) ? 'INDEX' : 'EQUITY',
                            price: item.price,
                            ltp: item.price
                        });
                    }}
                    className="w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black flex items-center justify-center transition-colors"
                >S</button>
                <button className="p-1 hover:text-blue-500 transition-colors ml-1"><Activity size={14} /></button>
            </div>
        </div>
    );
};
