"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LineStyle } from "@/types/chart";
import { ToolbarTip } from "./ToolbarTip";

interface StyleControlProps {
    style: LineStyle;
    onUpdate: (updates: any) => void;
}

const LinePreview = ({ style }: { style: LineStyle }) => {
    if (style === 'solid') return <div className="w-full h-[2px] bg-current" />;
    if (style === 'dashed') return <div className="w-full h-[2px] border-b-2 border-dashed border-current border-spacing-x-2" />;
    return <div className="w-full h-[2px] border-b-2 border-dotted border-current border-spacing-x-1" />;
};

export const StyleControl: React.FC<StyleControlProps> = ({ style, onUpdate }) => (
    <ToolbarTip text="Line Style">
        <div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1 px-2 outline-none border-none bg-transparent">
                    <div className="flex flex-col gap-[2px] w-6">
                        <LinePreview style={style} />
                    </div>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-xl z-40 min-w-[100px]">
                    {(['solid', 'dashed', 'dotted'] as LineStyle[]).map(s => (
                        <DropdownMenu.Item
                            key={s}
                            className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-[#2962ff] hover:text-white rounded cursor-pointer outline-none flex items-center justify-between"
                            onClick={() => onUpdate({ style: s })}
                        >
                            <span className="capitalize">{s}</span>
                            <div className="w-12">
                                <LinePreview style={s} />
                            </div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    </ToolbarTip>
);
