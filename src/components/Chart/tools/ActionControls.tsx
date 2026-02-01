"use client";

import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { Settings, Trash2 } from "lucide-react";
import { ToolbarTip } from "./ToolbarTip";

interface ActionControlsProps {
    showSettings: boolean;
    onDelete: () => void;
    onOpenSettings: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({ showSettings, onDelete, onOpenSettings }) => (
    <>
        {showSettings && (
            <ToolbarTip text="Settings">
                <Toolbar.Button
                    className="p-1.5 hover:bg-surface-hover rounded text-text-muted hover:text-foreground transition-colors"
                    onClick={onOpenSettings}
                >
                    <Settings size={16} />
                </Toolbar.Button>
            </ToolbarTip>
        )}
        <ToolbarTip text="Delete">
            <Toolbar.Button
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/40 rounded text-red-500 transition-colors"
                onClick={onDelete}
            >
                <Trash2 size={16} />
            </Toolbar.Button>
        </ToolbarTip>
    </>
);
