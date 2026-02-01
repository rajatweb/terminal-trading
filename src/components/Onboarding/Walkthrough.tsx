"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface WalkthroughStep {
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
    {
        target: 'body',
        title: 'Welcome to Trading Terminal',
        content: 'Let\'s take a quick tour of the key features. This will only take a minute.',
        placement: 'center'
    },
    {
        target: '[data-tour="watchlist"]',
        title: 'Watchlist Panel',
        content: 'Manage your watchlists here. Create new lists, add sections, search symbols, and drag to reorder.',
        placement: 'right'
    },
    {
        target: '[data-tour="chart"]',
        title: 'Chart Area',
        content: 'View real-time charts with multiple timeframes. Use drawing tools from the left toolbar.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="tools"]',
        title: 'Drawing Tools',
        content: 'Access professional drawing tools like trendlines, fibonacci retracements, and annotations.',
        placement: 'right'
    },
    {
        target: '[data-tour="option-chain-toggle"]',
        title: 'Option Chain',
        content: 'Access deep liquidity and strike prices. Toggle the Option Chain panel instantly from here.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="positions-toggle"]',
        title: 'Positions Manager',
        content: 'Monitor your active trades and P&L. Toggle the Positions panel from the header.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="theme-toggle"]',
        title: 'Theme Toggle',
        content: 'Switch between light and dark mode anytime.',
        placement: 'bottom'
    }
];

export const Walkthrough: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [spotlightRect, setSpotlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        const hasCompletedWalkthrough = localStorage.getItem('walkthrough_completed');
        if (!hasCompletedWalkthrough) {
            setTimeout(() => setIsActive(true), 1500);
        }
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const step = WALKTHROUGH_STEPS[currentStep];
        const element = document.querySelector(step.target);

        if (element) {
            const rect = element.getBoundingClientRect();
            const tooltipWidth = 380;
            const tooltipHeight = 200;
            let top = 0;
            let left = 0;

            // Set spotlight position
            setSpotlightRect({
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16
            });

            switch (step.placement) {
                case 'top':
                    top = rect.top - tooltipHeight - 20;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + 20;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - 20;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + 20;
                    break;
                case 'center':
                default:
                    top = window.innerHeight / 2 - tooltipHeight / 2;
                    left = window.innerWidth / 2 - tooltipWidth / 2;
                    setSpotlightRect({ top: 0, left: 0, width: 0, height: 0 });
            }

            // Keep tooltip within viewport
            const padding = 20;
            if (left < padding) left = padding;
            if (left + tooltipWidth > window.innerWidth - padding) {
                left = window.innerWidth - tooltipWidth - padding;
            }
            if (top < padding) top = padding;
            if (top + tooltipHeight > window.innerHeight - padding) {
                top = window.innerHeight - tooltipHeight - padding;
            }

            setPosition({ top, left });
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setPosition({
                top: window.innerHeight / 2 - 100,
                left: window.innerWidth / 2 - 190
            });
            setSpotlightRect({ top: 0, left: 0, width: 0, height: 0 });
        }
    }, [currentStep, isActive]);

    const handleNext = () => {
        if (currentStep < WALKTHROUGH_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        setIsActive(false);
        localStorage.setItem('walkthrough_completed', 'true');
    };

    const handleComplete = () => {
        setIsActive(false);
        localStorage.setItem('walkthrough_completed', 'true');
    };

    if (!isActive) return null;

    const step = WALKTHROUGH_STEPS[currentStep];

    return (
        <>
            {/* Spotlight Overlay */}
            <div className="fixed inset-0 z-[9998] pointer-events-none">
                <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect width="100%" height="100%" fill="white" />
                            {spotlightRect.width > 0 && (
                                <rect
                                    x={spotlightRect.left}
                                    y={spotlightRect.top}
                                    width={spotlightRect.width}
                                    height={spotlightRect.height}
                                    rx="8"
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.75)"
                        mask="url(#spotlight-mask)"
                        className="transition-all duration-500"
                    />
                </svg>

                {/* Spotlight border */}
                {spotlightRect.width > 0 && (
                    <div
                        className="absolute rounded-lg ring-2 ring-accent/40 transition-all duration-500"
                        style={{
                            top: `${spotlightRect.top}px`,
                            left: `${spotlightRect.left}px`,
                            width: `${spotlightRect.width}px`,
                            height: `${spotlightRect.height}px`,
                        }}
                    />
                )}
            </div>

            {/* Tooltip Card */}
            <div
                className="fixed z-[9999] w-[380px] bg-surface-elevated rounded-xl shadow-xl transition-all duration-300"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <span className="text-[11px] font-bold text-text-muted uppercase">
                        Step {currentStep + 1} of {WALKTHROUGH_STEPS.length}
                    </span>
                    <button
                        onClick={handleSkip}
                        className="p-1 hover:bg-surface-hover rounded transition-colors"
                    >
                        <X size={16} className="text-text-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <h3 className="text-[15px] font-bold text-foreground mb-2">
                        {step.title}
                    </h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed">
                        {step.content}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={handleSkip}
                        className="text-[11px] font-bold text-text-muted hover:text-foreground uppercase"
                    >
                        Skip
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-text-muted hover:bg-surface-hover rounded transition-colors uppercase"
                            >
                                <ChevronLeft size={14} />
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors uppercase"
                        >
                            {currentStep === WALKTHROUGH_STEPS.length - 1 ? 'Finish' : 'Next'}
                            {currentStep < WALKTHROUGH_STEPS.length - 1 && <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-1.5 pb-3">
                    {WALKTHROUGH_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all ${index === currentStep
                                ? 'bg-blue-500 w-6'
                                : index < currentStep
                                    ? 'bg-blue-300 w-1.5'
                                    : 'bg-border w-1.5'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
