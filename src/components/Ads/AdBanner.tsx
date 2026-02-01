"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface AdBannerProps {
    /**
     * Position of the ad banner
     */
    position: 'top' | 'bottom' | 'sidebar';

    /**
     * Ad content - can be custom HTML or component
     */
    children?: React.ReactNode;

    /**
     * Whether the ad can be dismissed
     */
    dismissible?: boolean;

    /**
     * Custom className for styling
     */
    className?: string;

    /**
     * Ad network (Google AdSense, custom, etc.)
     */
    adNetwork?: 'adsense' | 'custom';

    /**
     * Ad slot ID (for AdSense)
     */
    adSlot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
    position,
    children,
    dismissible = true,
    className = '',
    adNetwork = 'custom',
    adSlot
}) => {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    const positionStyles = {
        top: 'w-full border-b border-border',
        bottom: 'w-full border-t border-border',
        sidebar: 'w-full border-b border-border'
    };

    const defaultContent = (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-foreground">
                    📊 Upgrade to Premium • Get Real-Time Data & Advanced Analytics
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                    Unlock institutional-grade tools, live market feeds, and AI-powered insights
                </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg">
                Upgrade Now
            </button>
        </div>
    );

    return (
        <div className={`relative ${positionStyles[position]} ${className}`}>
            {/* Ad Content */}
            <div className="relative bg-surface-elevated">
                {adNetwork === 'adsense' && adSlot ? (
                    // Google AdSense integration
                    <div className="min-h-[90px] flex items-center justify-center">
                        <ins
                            className="adsbygoogle"
                            style={{ display: 'block' }}
                            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                            data-ad-slot={adSlot}
                            data-ad-format="auto"
                            data-full-width-responsive="true"
                        />
                    </div>
                ) : (
                    // Custom ad content
                    children || defaultContent
                )}

                {/* Dismiss button */}
                {dismissible && (
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-surface-hover hover:bg-surface-elevated text-text-muted transition-colors"
                        aria-label="Dismiss ad"
                    >
                        <X size={14} />
                    </button>
                )}

                {/* Ad label (required by most ad networks) */}
                <div className="absolute top-1 left-2 text-[9px] text-text-muted uppercase tracking-wider font-bold">
                    Advertisement
                </div>
            </div>
        </div>
    );
};

/**
 * Sidebar Ad Component - Optimized for vertical space
 */
export const SidebarAd: React.FC<{ dismissible?: boolean }> = ({ dismissible = true }) => {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

    return (
        <div className="relative w-full p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900/30 rounded-lg">
            <div className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-2">
                Sponsored
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-black text-foreground">
                    🚀 Pro Trading Tools
                </h3>
                <p className="text-[10px] text-text-muted leading-relaxed">
                    Advanced charting, real-time alerts, and institutional-grade analytics
                </p>
                <button className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-[10px] font-bold rounded transition-all shadow-md">
                    Learn More →
                </button>
            </div>

            {dismissible && (
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-surface-hover hover:bg-surface text-text-muted transition-colors"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
};
