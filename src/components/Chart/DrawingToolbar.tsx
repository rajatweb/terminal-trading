"use client";

import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { GripHorizontal, X, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Drawing, TOOL_CONFIGS } from "@/types/chart";

// Modular Tool Imports
import { LockControl } from "./tools/LockControl";
import { ColorControl } from "./tools/ColorControl";
import { WidthControl } from "./tools/WidthControl";
import { StyleControl } from "./tools/StyleControl";
import { ExtensionControls } from "./tools/ExtensionControls";
import { StatsControl } from "./tools/StatsControl";
import { ActionControls } from "./tools/ActionControls";

interface DrawingToolbarProps {
    drawing: Drawing;
    onUpdate: (updates: Partial<Drawing>) => void;
    onDelete: () => void;
    onOpenSettings: () => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
    drawing,
    onUpdate,
    onDelete,
    onOpenSettings,
}) => {
    const config = TOOL_CONFIGS[drawing.type];

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-16 left-1/2 z-[40] pointer-events-auto"
            style={{ x: "-50%" }}
        >
            <Toolbar.Root className="flex items-center px-1.5 py-1 gap-0.5 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                {/* Drag Handle */}
                <div className="px-1.5 py-2 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 dark:hover:text-gray-400 transition-colors">
                    <GripHorizontal size={14} />
                </div>

                {config.showLock && (
                    <LockControl
                        locked={drawing.locked}
                        onUpdate={onUpdate}
                    />
                )}

                {(config.showColor || config.showWidth || config.showStyle) && (
                    <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />
                )}

                {config.showColor && (
                    <ColorControl
                        color={drawing.color}
                        opacity={drawing.opacity}
                        onUpdate={onUpdate}
                    />
                )}

                {config.showWidth && (
                    <WidthControl
                        width={drawing.width}
                        onUpdate={onUpdate}
                    />
                )}

                {config.showStyle && (
                    <StyleControl
                        style={drawing.style}
                        onUpdate={onUpdate}
                    />
                )}

                {(config.showExtend || config.showStats) && (
                    <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />
                )}

                {config.showExtend && (
                    <ExtensionControls
                        extendLeft={drawing.extendLeft}
                        extendRight={drawing.extendRight}
                        onUpdate={onUpdate}
                    />
                )}

                {config.showStats && (
                    <StatsControl
                        showStats={drawing.showStats}
                        onUpdate={onUpdate}
                    />
                )}

                <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />

                <ActionControls
                    showSettings={!!config.showSettings}
                    onDelete={onDelete}
                    onOpenSettings={onOpenSettings}
                />

                <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />

                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                >
                    <X size={16} />
                </button>
            </Toolbar.Root>
        </motion.div>
    );
};

export default DrawingToolbar;
