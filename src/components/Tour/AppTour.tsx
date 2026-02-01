import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface TourStep {
    target: string; // ID selector (without #)
    title: string;
    content: string;
}

interface AppTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    onStepChange?: (stepIndex: number) => void;
}

export const AppTour: React.FC<AppTourProps> = ({ steps, isOpen, onClose, onComplete, onStepChange }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        let retryCount = 0;
        let observer: ResizeObserver | null = null;
        const maxRetries = 20; // 2 seconds approx

        const findAndObserveTarget = () => {
            const targetElement = document.getElementById(steps[currentStep].target);
            if (targetElement) {
                const updateRect = () => {
                    const rect = targetElement.getBoundingClientRect();
                    // Check if visible
                    if (rect.width > 0 && rect.height > 0) {
                        setTargetRect(rect);
                        // Only scroll if needed and not already in view (simplified)
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                };

                updateRect();

                // Observe for size changes (animations)
                observer = new ResizeObserver(updateRect);
                observer.observe(targetElement);
                return true;
            }
            return false;
        };

        const attemptFind = () => {
            if (findAndObserveTarget()) return;

            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(attemptFind, 100);
            }
        };

        setTargetRect(null); // Reset while finding
        attemptFind();

        window.addEventListener('resize', findAndObserveTarget);
        window.addEventListener('scroll', findAndObserveTarget, true);

        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', findAndObserveTarget);
            window.removeEventListener('scroll', findAndObserveTarget, true);
        };
    }, [currentStep, isOpen, steps]);

    useEffect(() => {
        // Reset step when opened
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && onStepChange) {
            onStepChange(currentStep);
        }
    }, [currentStep, isOpen, onStepChange]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    // Render highlighted overlay using SVG mask
    // Calculate tooltip position to stay within viewport
    const getTooltipStyle = () => {
        if (!targetRect) return {};

        const tooltipWidth = 320;
        const tooltipHeight = 220; // Approx
        const spacing = 16;

        let top = targetRect.bottom + spacing;
        let left = targetRect.left;

        // If going off bottom, flip to top
        if (top + tooltipHeight > window.innerHeight) {
            top = targetRect.top - tooltipHeight - spacing;
        }

        // If still off screen (e.g. element is very large), clamp to bottom
        if (top < spacing) {
            top = spacing;
        }

        // If going off right, align right or clamp
        if (left + tooltipWidth > window.innerWidth) {
            left = window.innerWidth - tooltipWidth - spacing;
        }

        // Ensure not off-screen left
        left = Math.max(spacing, left);

        return { top, left };
    };

    const tooltipStyle = getTooltipStyle();
    const highlightPath = targetRect ? `M0 0 h${window.innerWidth} v${window.innerHeight} h-${window.innerWidth} z M${targetRect.left - 5} ${targetRect.top - 5} h${targetRect.width + 10} v${targetRect.height + 10} h-${targetRect.width + 10} z` : '';

    return (
        <AnimatePresence>
            {isOpen && targetRect && (
                <div className="fixed inset-0 z-[9999]">
                    {/* Mask Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <svg width="100%" height="100%" className="w-full h-full">
                            <defs>
                                <mask id="tour-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    <rect
                                        x={targetRect.left - 5}
                                        y={targetRect.top - 5}
                                        width={targetRect.width + 10}
                                        height={targetRect.height + 10}
                                        rx="8"
                                        fill="black"
                                    />
                                </mask>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="rgba(0,0,0,0.5)"
                                mask="url(#tour-mask)"
                            />
                            {/* Border Ring */}
                            <rect
                                x={targetRect.left - 5}
                                y={targetRect.top - 5}
                                width={targetRect.width + 10}
                                height={targetRect.height + 10}
                                rx="8"
                                fill="none"
                                strokeWidth="2"
                                className="stroke-primary animate-pulse"
                            />
                        </svg>
                    </div>

                    {/* Tooltip Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={currentStep} // Animate when step changes

                        className="absolute pointer-events-auto w-[320px] bg-card rounded-xl shadow-2xl border border-border p-5"
                        style={tooltipStyle}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="mb-4">
                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider mb-2">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <h3 className="text-lg font-bold text-foreground mb-2">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {steps[currentStep].content}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <div className="flex gap-1.5">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStep
                                            ? 'bg-primary'
                                            : 'bg-muted-foreground/30'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className={`p-2 rounded-lg transition-colors border border-transparent ${currentStep === 0
                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                        : 'text-muted-foreground hover:bg-muted hover:border-border'
                                        }`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-lg active:scale-95"
                                >
                                    {currentStep === steps.length - 1 ? (
                                        <>Finish <Check size={14} /></>
                                    ) : (
                                        <>Next <ChevronRight size={14} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
