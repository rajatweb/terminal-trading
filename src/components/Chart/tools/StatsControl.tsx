"use client";

import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { BarChart3 } from "lucide-react";
import { ToolbarTip } from "./ToolbarTip";

interface StatsControlProps {
    showStats?: boolean;
    onUpdate: (updates: any) => void;
}

export const StatsControl: React.FC<StatsControlProps> = ({ showStats, onUpdate }) => (
    <ToolbarTip text="Price Stats">
        <Toolbar.Button
            className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${showStats ? 'text-blue-500 bg-blue-500/10' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => onUpdate({ showStats: !showStats })}
        >
            <BarChart3 size={16} />
        </Toolbar.Button>
    </ToolbarTip>
);
