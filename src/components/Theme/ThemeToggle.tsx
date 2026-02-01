"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-lg bg-surface-hover animate-pulse" />
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            data-tour="theme-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-all group relative"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? (
                <Sun size={16} className="text-yellow-500 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
                <Moon size={16} className="text-blue-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-elevated text-foreground shadow-lg text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </div>
        </button>
    );
};
