"use client";

import React, { useEffect, useRef } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import {
    Play,
    Pause,
    X,
    ChevronRight,
    ChevronLeft,
    GripHorizontal,
    FastForward,
    Scissors
} from "lucide-react";
import { motion } from "framer-motion";

interface ReplayToolbarProps {
    isPlaying: boolean;
    speed: number;
    onPlayPause: () => void;
    onStepForward: () => void;
    onStepBackward: () => void;
    onClose: () => void;
    onSpeedChange: (speed: number) => void;
    onJumpTo: () => void;
    children?: React.ReactNode;
}

export const ReplayToolbar: React.FC<ReplayToolbarProps> = ({
    isPlaying,
    speed,
    onPlayPause,
    onStepForward,
    onStepBackward,
    onClose,
    onSpeedChange,
    onJumpTo,
    children
}) => {
    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-16 left-1/2 z-[100] pointer-events-auto"
            style={{ x: "-50%" }}
        >
            <Toolbar.Root className="flex items-center px-2 py-1.5 gap-1 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                {/* Drag Handle */}
                <div className="px-1.5 py-2 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 transition-colors">
                    <GripHorizontal size={14} />
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onJumpTo}
                        className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-all"
                        title="Jump to bar"
                    >
                        <Scissors size={18} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />

                    <button
                        onClick={onStepBackward}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Step backward"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="p-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg active:scale-95 transition-all"
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <button
                        onClick={onStepForward}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Step forward"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />

                    <div className="flex items-center gap-2 px-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Speed</span>
                        <select
                            value={speed}
                            onChange={(e) => onSpeedChange(Number(e.target.value))}
                            className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-[#363a45] rounded-md px-1.5 py-0.5 text-[11px] font-bold text-gray-700 dark:text-[#d1d4dc] outline-none"
                        >
                            <option value={2000}>0.5s</option>
                            <option value={1000}>1.0s</option>
                            <option value={500}>0.1s</option>
                            <option value={200}>0.5s</option>
                            <option value={100}>MAX</option>
                        </select>
                    </div>
                </div>

                <div className="w-[1px] h-4 bg-gray-100 dark:bg-[#363a45] mx-1" />

                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Exit Replay"
                >
                    <X size={18} />
                </button>
                {children}
            </Toolbar.Root>
        </motion.div>
    );
};
