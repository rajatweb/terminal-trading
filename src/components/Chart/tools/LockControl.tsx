"use client";

import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { Lock, Unlock } from "lucide-react";
import { ToolbarTip } from "./ToolbarTip";

interface LockControlProps {
    locked: boolean;
    onUpdate: (updates: any) => void;
}

export const LockControl: React.FC<LockControlProps> = ({ locked, onUpdate }) => (
    <ToolbarTip text={locked ? "Unlock" : "Lock"}>
        <Toolbar.Button
            className={`p-1.5 hover:bg-surface-hover rounded transition-colors ${locked ? 'text-blue-500' : 'text-text-muted hover:text-foreground'}`}
            onClick={() => onUpdate({ locked: !locked })}
        >
            {locked ? <Lock size={16} /> : <Unlock size={16} />}
        </Toolbar.Button>
    </ToolbarTip>
);
