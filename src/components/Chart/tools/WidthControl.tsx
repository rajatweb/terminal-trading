"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ToolbarTip } from "./ToolbarTip";

const WIDTHS = [1, 2, 3, 4];

interface WidthControlProps {
    width: number;
    onUpdate: (updates: any) => void;
}

export const WidthControl: React.FC<WidthControlProps> = ({ width, onUpdate }) => (
    <ToolbarTip text="Line Thickness">
        <div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1 min-w-[45px] text-xs font-bold px-2 outline-none border-none bg-transparent">
                    {width}px <ChevronDown size={12} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-xl z-40 min-w-[60px]">
                    {WIDTHS.map(w => (
                        <DropdownMenu.Item
                            key={w}
                            className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-[#2962ff] hover:text-white rounded cursor-pointer outline-none text-center font-bold"
                            onClick={() => onUpdate({ width: w })}
                        >
                            {w}px
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    </ToolbarTip>
);
