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
                <Popover.Trigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1.5 min-w-[40px] outline-none border-none bg-transparent">
                    <div className="w-4 h-4 rounded border border-black/10 dark:border-white/20 shadow-inner" style={{ backgroundColor: color, opacity: opacity / 100 }} />
                </Popover.Trigger>
                <Popover.Content className="p-3 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl space-y-4 z-40 outline-none w-[200px] animate-in fade-in zoom-in-95">
                    <div className="space-y-3">
                        <span className="text-[10px] uppercase text-gray-500 font-bold">Tool Color</span>
                        <div className="flex flex-col gap-3 custom-color-picker">
                            <HexColorPicker color={color} onChange={(c) => onUpdate({ color: c })} />
                            <input
                                className="w-full bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[10px] text-center text-gray-900 dark:text-white font-mono outline-none"
                                value={color}
                                onChange={(e) => onUpdate({ color: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase text-gray-500 font-bold">Opacity</span>
                            <span className="text-xs text-blue-500">{opacity}%</span>
                        </div>
                        <Slider.Root
                            className="relative flex items-center select-none touch-none w-full h-5"
                            value={[opacity]}
                            onValueChange={([v]) => onUpdate({ opacity: v })}
                            max={100} step={1}
                        >
                            <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-[3px]">
                                <Slider.Range className="absolute bg-[#2962ff] rounded-full h-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-3 h-3 bg-white dark:bg-white rounded-full shadow-lg border border-gray-300 dark:border-transparent focus:outline-none transition-transform active:scale-125" />
                        </Slider.Root>
                    </div>
                </Popover.Content>
            </Popover.Root>
        </div>
    </ToolbarTip>
);
