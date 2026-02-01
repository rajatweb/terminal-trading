"use client";

import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ToolbarTip } from "./ToolbarTip";

interface ExtensionControlsProps {
    extendLeft?: boolean;
    extendRight?: boolean;
    onUpdate: (updates: any) => void;
}

export const ExtensionControls: React.FC<ExtensionControlsProps> = ({ extendLeft, extendRight, onUpdate }) => (
    <>
        <ToolbarTip text="Extend Left">
            <Toolbar.Button
                className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${extendLeft ? 'text-blue-500 bg-blue-500/10' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => onUpdate({ extendLeft: !extendLeft })}
            >
                <ArrowLeft size={16} />
            </Toolbar.Button>
        </ToolbarTip>
        <ToolbarTip text="Extend Right">
            <Toolbar.Button
                className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${extendRight ? 'text-blue-500 bg-blue-500/10' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => onUpdate({ extendRight: !extendRight })}
            >
                <ArrowRight size={16} />
            </Toolbar.Button>
        </ToolbarTip>
    </>
);
