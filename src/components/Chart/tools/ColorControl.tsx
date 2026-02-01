"use client";

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Slider from "@radix-ui/react-slider";
import { HexColorPicker } from "react-colorful";
import { ToolbarTip } from "./ToolbarTip";

interface ColorControlProps {
    color: string;
    opacity: number;
    onUpdate: (updates: any) => void;
}

export const ColorControl: React.FC<ColorControlProps> = ({ color, opacity, onUpdate }) => (
    <ToolbarTip text="Color & Opacity">
        <div>
            <Popover.Root>
                <Popover.Trigger className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5 min-w-[40px] outline-none border-none bg-transparent">
                    <div className="w-4 h-4 rounded shadow-inner ring-1 ring-black/5" style={{ backgroundColor: color, opacity: opacity / 100 }} />
                </Popover.Trigger>
                <Popover.Content className="p-3 bg-surface-elevated rounded-lg shadow-xl space-y-4 z-40 outline-none w-[200px] animate-in fade-in zoom-in-95">
                    <div className="space-y-3">
                        <span className="text-[10px] uppercase text-text-muted font-bold">Tool Color</span>
                        <div className="flex flex-col gap-3 custom-color-picker">
                            <HexColorPicker color={color} onChange={(c) => onUpdate({ color: c })} />
                            <input
                                className="w-full bg-input-bg rounded p-1.5 text-[10px] text-center text-foreground font-mono outline-none focus:ring-2 focus:ring-accent/30"
                                value={color}
                                onChange={(e) => onUpdate({ color: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase text-text-muted font-bold">Opacity</span>
                            <span className="text-xs text-blue-500">{opacity}%</span>
                        </div>
                        <Slider.Root
                            className="relative flex items-center select-none touch-none w-full h-5"
                            value={[opacity]}
                            onValueChange={([v]) => onUpdate({ opacity: v })}
                            max={100} step={1}
                        >
                            <Slider.Track className="bg-surface-hover relative grow rounded-full h-[3px]">
                                <Slider.Range className="absolute bg-[#2962ff] rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-3 h-3 bg-white rounded-full shadow-lg focus:outline-none transition-transform active:scale-125 ring-1 ring-black/10" />
                        </Slider.Root>
                    </div>
                </Popover.Content>
            </Popover.Root>
        </div>
    </ToolbarTip>
);
