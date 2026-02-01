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
                <DropdownMenu.Trigger className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-foreground transition-colors flex items-center gap-1 min-w-[45px] text-xs font-bold px-2 outline-none border-none bg-transparent">
                    {width}px <ChevronDown size={12} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="bg-surface-elevated border border-border rounded-md p-1 shadow-xl z-40 min-w-[60px]">
                    {WIDTHS.map(w => (
                        <DropdownMenu.Item
                            key={w}
                            className="px-2 py-1.5 text-xs text-text-secondary hover:bg-accent hover:text-white rounded cursor-pointer outline-none text-center font-bold"
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
