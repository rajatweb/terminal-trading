"use client";

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import {
    X,
    Monitor,
    Palette,
    BarChart3,
    GripHorizontal,
    Type,
    Check,
    Settings2,
    Activity,
    Eye,
} from 'lucide-react';
import { ChartSettings } from '@/types/chart';
import { HexColorPicker } from 'react-colorful';
import * as Popover from '@radix-ui/react-popover';

interface ChartSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: ChartSettings;
    onUpdate: (settings: ChartSettings) => void;
}

type TabType = 'symbol' | 'appearance' | 'scales';

export const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
    open,
    onOpenChange,
    settings,
    onUpdate,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('symbol');

    const updateSymbol = (updates: Partial<ChartSettings['symbol']>) => {
        onUpdate({ ...settings, symbol: { ...settings.symbol, ...updates } });
    };

    const updateAppearance = (updates: Partial<ChartSettings['appearance']>) => {
        onUpdate({ ...settings, appearance: { ...settings.appearance, ...updates } });
    };

    const updateScales = (updates: Partial<ChartSettings['scales']>) => {
        onUpdate({ ...settings, scales: { ...settings.scales, ...updates } });
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] animate-in fade-in duration-300" />
                <Dialog.Content asChild>
                    <motion.div
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.98, x: "-50%", y: "-50%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        className="fixed top-1/2 left-1/2 w-[600px] h-[480px] bg-surface-elevated rounded-xl shadow-2xl z-[101] outline-none overflow-hidden flex flex-col"
                    >
                        {/* Header/Drag area */}
                        <div className="h-11 flex items-center px-4 justify-between bg-surface-hover/50 cursor-grab active:cursor-grabbing shrink-0">
                            <div className="flex items-center gap-2">
                                <Settings2 size={16} className="text-blue-500" />
                                <span className="text-[12px] font-black uppercase tracking-widest text-foreground">Terminal Engine Preferences</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GripHorizontal size={14} className="text-gray-300 dark:text-gray-700 mr-2" />
                                <Dialog.Close className="p-1 hover:bg-surface-hover rounded transition-all text-text-muted">
                                    <X size={18} />
                                </Dialog.Close>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Professional Nav */}
                            <div className="w-44 p-2 space-y-0.5 shrink-0 bg-surface-hover/30">
                                <TabButton active={activeTab === 'symbol'} onClick={() => setActiveTab('symbol')} icon={<Activity size={16} />} label="Symbol" />
                                <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette size={16} />} label="Appearance" />
                                <TabButton active={activeTab === 'scales'} onClick={() => setActiveTab('scales')} icon={<Type size={16} />} label="Scales" />
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-surface-elevated">
                                {activeTab === 'symbol' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-200">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Candlestick Colors</h3>
                                            </div>
                                            <div className="space-y-1">
                                                <ColorRow label="Price Rise" color={settings.symbol.upColor} onChange={(c) => updateSymbol({ upColor: c, borderUpColor: c, wickUpColor: c })} />
                                                <ColorRow label="Price Fall" color={settings.symbol.downColor} onChange={(c) => updateSymbol({ downColor: c, borderDownColor: c, wickDownColor: c })} />
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Detailed Elements</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase ml-2 mb-1 block">Borders</span>
                                                    <ColorRow label="Up" color={settings.symbol.borderUpColor} onChange={(c) => updateSymbol({ borderUpColor: c })} />
                                                    <ColorRow label="Down" color={settings.symbol.borderDownColor} onChange={(c) => updateSymbol({ borderDownColor: c })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase ml-2 mb-1 block">Wicks</span>
                                                    <ColorRow label="Up" color={settings.symbol.wickUpColor} onChange={(c) => updateSymbol({ wickUpColor: c })} />
                                                    <ColorRow label="Down" color={settings.symbol.wickDownColor} onChange={(c) => updateSymbol({ wickDownColor: c })} />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === 'appearance' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-200">
                                        <section className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Canvas Properties</h3>
                                            </div>
                                            <ColorRow label="Background Palette" color={settings.appearance.background} onChange={(c) => updateAppearance({ background: c })} />
                                        </section>

                                        <section className="space-y-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Interactive Elements</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <ProToggle label="Crosshair Visibility" checked={settings.appearance.crosshairVisible} onChange={(v) => updateAppearance({ crosshairVisible: v })} />
                                                <ProToggle label="Information Legend" checked={settings.appearance.legendVisible} onChange={(v) => updateAppearance({ legendVisible: v })} />
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">System Grid</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <ProToggle label="Show Layout Grid" checked={settings.appearance.gridVisible} onChange={(v) => updateAppearance({ gridVisible: v })} />
                                                <ColorRow label="Grid Line Color" color={settings.appearance.gridColor} onChange={(c) => updateAppearance({ gridColor: c })} />
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <ProToggle label="Vertical Axis" checked={settings.appearance.vertGridVisible} onChange={(v) => updateAppearance({ vertGridVisible: v })} />
                                                    <ProToggle label="Horizontal Axis" checked={settings.appearance.horzGridVisible} onChange={(v) => updateAppearance({ horzGridVisible: v })} />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Background Watermark</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <ProToggle label="Show Asset Watermark" checked={settings.appearance.watermarkVisible} onChange={(v) => updateAppearance({ watermarkVisible: v })} />

                                                <div className="p-3 bg-surface-hover/50 rounded-lg">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-[12px] font-bold text-foreground">Watermark Opacity</label>
                                                        <span className="text-[10px] font-black font-mono text-blue-500">{settings.appearance.watermarkOpacity}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="1" max="50" step="1"
                                                        value={settings.appearance.watermarkOpacity}
                                                        onChange={(e) => updateAppearance({ watermarkOpacity: parseInt(e.target.value) })}
                                                        className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>

                                                <div className="p-3 bg-surface-hover/50 rounded-lg">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-[12px] font-bold text-foreground">Scaling Ratio</label>
                                                        <span className="text-[10px] font-black font-mono text-blue-500">{settings.appearance.watermarkSize}VW</span>
                                                    </div>
                                                    <input
                                                        type="range" min="5" max="25" step="1"
                                                        value={settings.appearance.watermarkSize}
                                                        onChange={(e) => updateAppearance({ watermarkSize: parseInt(e.target.value) })}
                                                        className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === 'scales' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-1 duration-200">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-wider text-text-muted">Typography & Scales</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <ColorRow label="Label Intensity" color={settings.scales.textColor} onChange={(c) => updateScales({ textColor: c })} />
                                                <div className="p-3 bg-surface-hover/50 rounded-lg">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <label className="text-[12px] font-bold text-gray-600 dark:text-[#d1d4dc]">Font Size Scale</label>
                                                        <span className="text-[10px] font-black font-mono text-blue-500">{settings.scales.fontSize}PX</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="8"
                                                        max="14"
                                                        step="1"
                                                        value={settings.scales.fontSize}
                                                        onChange={(e) => updateScales({ fontSize: parseInt(e.target.value) })}
                                                        className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-14 flex items-center px-4 justify-end gap-2 bg-surface-hover/50 shrink-0">
                            <button onClick={() => onOpenChange(false)} className="px-5 py-2 text-[11px] font-black text-text-muted hover:text-foreground transition-colors uppercase tracking-widest">Discard</button>
                            <button onClick={() => onOpenChange(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded shadow-lg shadow-blue-500/20 transition-all uppercase tracking-widest">Apply Preferences</button>
                        </div>
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[12px] font-bold transition-all group ${active
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
    >
        <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`}>{icon}</span>
        <span className="tracking-tight">{label}</span>
    </button>
);

const ProToggle = ({ label, checked, onChange }: { label: string, checked?: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between p-2 hover:bg-surface-hover rounded-lg cursor-pointer transition-colors group">
        <span className="text-[12px] font-medium text-text-secondary group-hover:text-foreground">{label}</span>
        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
);

const ColorRow = ({ label, color, onChange }: { label: string, color: string, onChange: (c: string) => void }) => (
    <div className="flex items-center justify-between group p-1.5 hover:bg-surface-hover rounded-lg transition-colors">
        <span className="text-[12px] font-medium text-text-secondary group-hover:text-foreground ml-1">{label}</span>
        <Popover.Root>
            <Popover.Trigger asChild>
                <button className="flex items-center gap-2 p-1 bg-surface-hover/50 rounded hover:ring-2 hover:ring-accent/30 transition-all">
                    <div className="w-5 h-5 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-mono text-text-muted uppercase pr-1">{color}</span>
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="z-[200] animate-in fade-in zoom-in-95 duration-150" sideOffset={8} align="end">
                    <div className="bg-surface-elevated p-4 rounded-lg shadow-xl">
                        <HexColorPicker color={color} onChange={onChange} />
                        <div className="mt-4 grid grid-cols-6 gap-2 pt-4">
                            {['#26a69a', '#ef5350', '#2962ff', '#fb8c00', '#131722', '#ffffff'].map(c => (
                                <div key={c} onClick={() => onChange(c)} className="w-5 h-5 rounded-sm cursor-pointer hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    </div>
);
