"use client";

import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

export const ToolbarTip = ({ children, text }: { children: React.ReactNode, text: string }) => (
    <Tooltip.Root>
        <Tooltip.Trigger asChild>
            {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
            <Tooltip.Content
                side="bottom"
                sideOffset={10}
                className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1.5 rounded shadow-xl z-[100] animate-in fade-in zoom-in-95 pointer-events-none"
            >
                {text}
                <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
        </Tooltip.Portal>
    </Tooltip.Root>
);
