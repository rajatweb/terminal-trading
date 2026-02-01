"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { OHLCV, Drawing, TOOL_CONFIGS, ChartSettings, DEFAULT_CHART_SETTINGS } from "@/types/chart";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Trash2,
    Settings,
    RotateCcw,
    X,
    Palette,
    Check,
    ChevronRight,
    BarChart2,
    EyeOff,
    Navigation,
    Minus,
    StretchHorizontal,
    StretchVertical,
    LayoutGrid,
    Square,
    Type,
    Ruler,
    Layers,
    ChevronDown
} from "lucide-react";
import DrawingToolbar from "./DrawingToolbar";
import { DrawingRenderer } from "./drawings/DrawingRenderer";
import { PreviewRenderer } from "./drawings/PreviewRenderer";
import { ChartSettingsModal } from "./ChartSettingsModal";

interface TradingChartProps {
    data: OHLCV[];
    activeTool: string;
    symbol?: string;
    interval?: string;
    onToolComplete?: () => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, activeTool, symbol = "NIFTY", interval = "5m", onToolComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const drawingPoints = useRef<{ t: string, p: number } | null>(null);
    const [previewPoint, setPreviewPoint] = useState<{ t: string, p: number } | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false);
    const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS);
    const [hoveredCandle, setHoveredCandle] = useState<OHLCV | null>(null);

    const { theme, setTheme } = useTheme();

    const selectedDrawing = drawings.find(d => d.id === selectedId);

    const colors = useMemo(() => ({
        grid: theme === 'dark' ? '#2a2e39' : '#f0f3fa',
        text: theme === 'dark' ? '#787b86' : '#6b7280',
        crosshair: theme === 'dark' ? '#9ca3af' : '#6b7280',
        bg: theme === 'dark' ? '#131722' : '#ffffff',
        accent: '#2962ff'
    }), [theme]);

    const [currentXScale, setCurrentXScale] = useState<d3.ScaleLinear<number, number> | null>(null);
    const [yScale, setYScale] = useState<d3.ScaleLinear<number, number> | null>(null);

    const [dragState, setDragState] = useState<{
        type: 'point' | 'whole',
        drawingId: number,
        pointIndex?: 1 | 2,
        startMouse?: { x: number, y: number },
        originalDrawing?: Drawing
    } | null>(null);

    const resizeObserver = useRef<ResizeObserver | null>(null);

    const getIntervalStep = () => {
        if (interval === "1m") return 60;
        if (interval === "5m") return 300;
        if (interval === "15m") return 900;
        if (interval === "1h") return 3600;
        if (interval === "D") return 86400;
        return 300;
    };

    const getTimeAtIndex = (idx: number) => {
        const step = getIntervalStep();
        const base = data[0].time;
        return base + (idx * step);
    };

    useEffect(() => {
        const observeTarget = containerRef.current;
        if (!observeTarget) return;

        resizeObserver.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.current.observe(observeTarget);
        return () => resizeObserver.current?.disconnect();
    }, []);

    const handleDrawingDragStart = (id: number, type: 'point' | 'whole', pointIndex?: 1 | 2, e?: React.MouseEvent) => {
        const drawing = drawings.find(d => d.id === id);
        if (!drawing) return;

        // Prevent dragging if locked
        if (drawing.locked) return;

        setDragState({
            type,
            drawingId: id,
            pointIndex,
            startMouse: e ? { x: e.clientX, y: e.clientY } : undefined,
            originalDrawing: { ...drawing }
        });
    };

    useEffect(() => {
        if (!svgRef.current || data.length === 0 || dimensions.width === 0) return;

        const { width, height } = dimensions;
        const margin = { top: 10, right: 65, bottom: 25, left: 10 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll(".main-g").remove();

        const g = svg.append("g").attr("class", "main-g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, data.length]).range([0, chartWidth]);
        const priceMin = d3.min(data, (d) => d.low) || 0;
        const priceMax = d3.max(data, (d) => d.high) || 0;
        const pricePadding = (priceMax - priceMin) * 0.12;
        const y = d3.scaleLinear().domain([priceMin - pricePadding, priceMax + pricePadding]).range([chartHeight, 0]);

        setCurrentXScale(() => x);
        setYScale(() => y);

        const mainChartArea = g.append("g").attr("clip-path", "url(#chart-clip)");

        const gridGroup = mainChartArea.append("g").attr("class", "grid-lines");
        const updateGrid = (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => {
            gridGroup.selectAll("*").remove();
            if (!chartSettings.appearance.gridVisible) return;

            if (chartSettings.appearance.horzGridVisible) {
                const yTicks = sy.ticks(8);
                gridGroup.selectAll(".h-grid").data(yTicks).join("line").attr("class", "h-grid").attr("x1", 0).attr("x2", chartWidth).attr("y1", d => sy(d)).attr("y2", d => sy(d)).attr("stroke", colors.grid).attr("stroke-width", 1);
            }
            if (chartSettings.appearance.vertGridVisible) {
                const [startIdx, endIdx] = sx.domain();
                const tickStep = Math.ceil((endIdx - startIdx) / 10);
                const xTicks = [];
                for (let i = Math.floor(startIdx); i <= endIdx; i += tickStep) xTicks.push(i);
                gridGroup.selectAll(".v-grid").data(xTicks).join("line").attr("class", "v-grid").attr("x1", d => sx(d)).attr("x2", d => sx(d)).attr("y1", 0).attr("y2", chartHeight).attr("stroke", colors.grid).attr("stroke-width", 1);
            }
        };

        const candleGroup = mainChartArea.append("g").attr("class", "candles");
        const drawCandles = (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => {
            const candleSelection = candleGroup.selectAll<SVGGElement, any>(".candle").data(data, (d: any) => d.time.toString());
            const enter = candleSelection.enter().append("g").attr("class", "candle");
            enter.append("line").attr("class", "wick").attr("stroke-width", 1);
            enter.append("rect").attr("class", "body").attr("stroke-width", 1).attr("rx", 0.5);
            const update = candleSelection.merge(enter as any);
            const bandwidth = (sx(1) - sx(0)) * 0.7;
            update.attr("transform", (d, i) => `translate(${sx(i) - bandwidth / 2}, 0)`).style("display", (d, i) => {
                const xPos = sx(i);
                return (xPos >= -bandwidth && xPos <= chartWidth + bandwidth) ? null : "none";
            });
            update.select(".wick").attr("y1", d => sy(d.high)).attr("y2", d => sy(d.low)).attr("x1", bandwidth / 2).attr("x2", bandwidth / 2).attr("stroke", d => (d.close >= d.open ? chartSettings.symbol.wickUpColor : chartSettings.symbol.wickDownColor));
            update.select(".body").attr("y", d => sy(Math.max(d.open, d.close))).attr("height", d => Math.abs(sy(d.open) - sy(d.close)) || 0.5).attr("width", bandwidth).attr("fill", d => (d.close >= d.open ? chartSettings.symbol.upColor : chartSettings.symbol.downColor)).attr("stroke", d => (d.close >= d.open ? chartSettings.symbol.borderUpColor : chartSettings.symbol.borderDownColor));
            candleSelection.exit().remove();
        };

        const yAxisGroup = g.append("g").attr("transform", `translate(${chartWidth}, 0)`);
        const xAxisGroup = g.append("g").attr("transform", `translate(0, ${chartHeight})`);

        const updateAxes = (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => {
            yAxisGroup.call(d3.axisRight(sy).tickSize(0).tickPadding(10) as any).select(".domain").remove();
            yAxisGroup.selectAll(".tick text").attr("fill", colors.text).attr("font-size", "11px");
            const [startIdx, endIdx] = sx.domain();
            const tickStep = Math.ceil((endIdx - startIdx) / 10);
            const tickValues = [];
            for (let i = Math.floor(startIdx); i <= endIdx; i += tickStep) tickValues.push(i);
            const timeFormat = interval === "D" ? d3.timeFormat("%b %d") : d3.timeFormat("%H:%M");
            xAxisGroup.call(d3.axisBottom(sx).tickValues(tickValues).tickFormat(idx => timeFormat(new Date(getTimeAtIndex(idx as number) * 1000))) as any).select(".domain").remove();
            xAxisGroup.selectAll(".tick text").attr("fill", colors.text).attr("font-size", "11px");
        };

        drawCandles(x, y);
        updateAxes(x, y);
        updateGrid(x, y);

        let currentScaleX = x;
        let currentScaleY = y;
        let isAutoPriced = true;

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 100])
            .filter((event) => {
                const target = event.target as Element;
                // Prevent zoom if clicking on interactive drawing elements
                const isDrawingInteraction = target.closest('.cursor-move') || target.closest('.cursor-crosshair') || target.closest('.cursor-pointer');
                if (isDrawingInteraction) return false;

                return !event.ctrlKey && !event.button;
            })
            .on("zoom", (e) => {
                if (activeTool !== 'cursor' || dragState) return; // Disable zoom while dragging
                currentScaleX = x.copy().domain([0, data.length].map(d => e.transform.invertX(x(d))));
                setCurrentXScale(() => currentScaleX);
                if (isAutoPriced) {
                    const [s, ed] = currentScaleX.domain();
                    const visible = data.filter((_, i) => i >= s && i <= ed);
                    if (visible.length > 0) {
                        const minP = d3.min(visible, d => d.low)!;
                        const maxP = d3.max(visible, d => d.high)!;
                        const pad = (maxP - minP) * 0.15;
                        currentScaleY.domain([minP - pad, maxP + pad]);
                    }
                }
                drawCandles(currentScaleX, currentScaleY);
                updateAxes(currentScaleX, currentScaleY);
                updateGrid(currentScaleX, currentScaleY);
            });

        svg.call(zoom as any);

        const crosshair = g.append("g").style("display", "none").style("pointer-events", "none");
        const xL = crosshair.append("line").attr("stroke", colors.crosshair).attr("stroke-dasharray", "4,4");
        const yL = crosshair.append("line").attr("stroke", colors.crosshair).attr("stroke-dasharray", "4,4");

        svg.on("mousemove", (e) => {
            const [mx, my] = d3.pointer(e);

            // Handle Dragging Logic
            if (dragState) {
                e.preventDefault();
                const chartMx = mx - margin.left;
                const chartMy = my - margin.top;

                // Get inverted coordinates
                const idx = Math.round(currentScaleX.invert(chartMx));
                const time = getTimeAtIndex(Math.max(0, Math.min(idx, data.length - 1))).toString();
                const price = currentScaleY.invert(chartMy);

                setDrawings(prev => prev.map(d => {
                    if (d.id !== dragState.drawingId) return d;

                    if (dragState.type === 'point' && dragState.pointIndex) {
                        return {
                            ...d,
                            [`t${dragState.pointIndex}`]: time,
                            [`p${dragState.pointIndex}`]: price
                        };
                    } else if (dragState.type === 'whole' && dragState.originalDrawing && dragState.startMouse) {
                        // Delta movement since drag start
                        // Note: To make 'whole' dragging smoother, we'd ideally project the delta mouse X/Y to delta P/T.
                        // But precise whole-shape dragging with snapping time axis is tricky.
                        // Simplified approach: move centroid or p1 to mouse, maintain relative offset

                        // Better calculation:
                        // Calculate price delta and index delta
                        const startIdx = Math.round(currentScaleX.invert(dragState.startMouse.x - margin.left));
                        const currentIdx = Math.round(currentScaleX.invert(chartMx));
                        const idxDelta = currentIdx - startIdx;

                        const startPrice = currentScaleY.invert(dragState.startMouse.y - margin.top);
                        const priceDelta = price - startPrice;

                        const step = getIntervalStep();
                        const origT1Idx = (parseInt(dragState.originalDrawing.t1) - data[0].time) / step;
                        const newT1 = getTimeAtIndex(origT1Idx + idxDelta).toString();
                        const newP1 = dragState.originalDrawing.p1 + priceDelta;

                        // Same for p2 if exists
                        if (dragState.originalDrawing.t2 && dragState.originalDrawing.p2 !== undefined) {
                            const origT2Idx = (parseInt(dragState.originalDrawing.t2) - data[0].time) / step;
                            const newT2 = getTimeAtIndex(origT2Idx + idxDelta).toString();
                            const newP2 = dragState.originalDrawing.p2 + priceDelta;

                            return { ...d, t1: newT1, p1: newP1, t2: newT2, p2: newP2 };
                        }

                        return { ...d, t1: newT1, p1: newP1 };
                    }
                    return d;
                }));
                return;
            }

            // Normal Mousemove
            if (!chartSettings.appearance.crosshairVisible) {
                crosshair.style("display", "none");
                setHoveredCandle(null);
                return;
            }
            const cx = mx - margin.left, cy = my - margin.top;
            if (cx >= 0 && cx <= chartWidth && cy >= 0 && cy <= chartHeight) {
                crosshair.style("display", null);
                xL.attr("x1", cx).attr("x2", cx).attr("y1", 0).attr("y2", chartHeight);
                yL.attr("y1", cy).attr("y2", cy).attr("x1", 0).attr("x2", chartWidth);
                const idx = Math.round(currentScaleX.invert(cx));
                if (data[idx]) setHoveredCandle(data[idx]);
                if (activeTool !== 'cursor' && drawingPoints.current) setPreviewPoint({ t: getTimeAtIndex(idx).toString(), p: currentScaleY.invert(cy) });
            } else {
                crosshair.style("display", "none");
                setHoveredCandle(null);
            }
        });

        svg.on("mouseup", () => {
            setDragState(null);
        });

        svg.on("mouseleave", () => {
            // Optional: cancel drag or keep it sticky? usually mouseup handles it.
            if (dragState) setDragState(null);
            crosshair.style("display", "none");
            setHoveredCandle(null);
        });

        svg.on("click", (e) => {
            if (dragState) return; // Prevent creating new point on drag release

            const [mx, my] = d3.pointer(e);
            const cx = mx - margin.left, cy = my - margin.top;
            const idx = Math.round(currentScaleX.invert(cx));
            const time = getTimeAtIndex(idx).toString(), price = currentScaleY.invert(cy);

            if (activeTool !== 'cursor') {
                if (activeTool === 'horizontalLine' || activeTool === 'verticalLine') {
                    setDrawings(p => [...p, { id: Date.now(), type: activeTool as any, t1: time, p1: price, color: theme === 'dark' ? '#b2b5be' : '#2a2e39', width: 2, style: 'solid', locked: false, opacity: 100 }]);
                    onToolComplete?.();
                } else if (!drawingPoints.current) {
                    drawingPoints.current = { t: time, p: price };
                } else {
                    const p1 = drawingPoints.current;
                    if (p1) {
                        setDrawings(prev => [...prev, {
                            id: Date.now(),
                            type: activeTool as any,
                            t1: p1.t, p1: p1.p,
                            t2: time, p2: price,
                            color: theme === 'dark' ? '#b2b5be' : '#2a2e39',
                            width: 2, style: 'solid',
                            locked: false, opacity: 100,
                            fibSettings: activeTool === 'fibonacci' ? {
                                levels: [
                                    { level: 0, color: '#999999', visible: true },
                                    { level: 0.236, color: '#f44336', visible: true },
                                    { level: 0.382, color: '#4caf50', visible: true },
                                    { level: 0.5, color: '#2196f3', visible: true },
                                    { level: 0.618, color: '#4caf50', visible: true },
                                    { level: 0.786, color: '#9c27b0', visible: true },
                                    { level: 1, color: '#999999', visible: true }
                                ],
                                showBackground: true,
                                extendLeft: false,
                                extendRight: false
                            } : undefined
                        }]);
                    }
                    drawingPoints.current = null;
                    setPreviewPoint(null);
                    onToolComplete?.();
                }
            } else {
                setSelectedId(null);
            }
        });

    }, [data, dimensions, drawings.length, activeTool, theme, colors, chartSettings, dragState]); // Added dragState dependency

    const updateSelectedDrawing = (updates: Partial<Drawing>) => {
        if (!selectedId) return;
        setDrawings(prev => prev.map(d => d.id === selectedId ? { ...d, ...updates } : d));
    };

    const deleteDrawing = () => {
        if (selectedId) {
            setDrawings(prev => prev.filter(d => d.id !== selectedId));
            setSelectedId(null);
        }
    };

    const currentCandle = hoveredCandle || data[data.length - 1];

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger className="w-full h-full">
                <div ref={containerRef} className="w-full h-full relative group select-none" style={{ backgroundColor: colors.bg }}>
                    {/* Professional Background Watermark */}
                    {symbol && chartSettings.appearance.watermarkVisible && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                            <div
                                className="flex flex-col items-center"
                                style={{ opacity: chartSettings.appearance.watermarkOpacity / 100 }}
                            >
                                <span
                                    className="font-black uppercase tracking-tighter leading-none"
                                    style={{ fontSize: `${chartSettings.appearance.watermarkSize}vw` }}
                                >
                                    {symbol}
                                </span>
                                <span
                                    className="font-black uppercase tracking-[0.2em]"
                                    style={{ fontSize: `${chartSettings.appearance.watermarkSize / 3}vw` }}
                                >
                                    {interval}
                                </span>
                            </div>
                        </div>
                    )}

                    {chartSettings.appearance.legendVisible && (
                        <div className="absolute top-3 left-4 z-20 flex flex-col pointer-events-none gap-0.5">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-gray-900 dark:text-[#d1d4dc] uppercase tracking-tighter">{symbol} • {interval} • NSE</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Market Open</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-bold font-mono">
                                <div className="flex items-center gap-1.5 border-r border-gray-200 dark:border-[#2a2e39] pr-3">
                                    <span className="text-gray-400">O</span><span className="dark:text-[#d1d4dc]">{currentCandle.open.toFixed(2)}</span>
                                    <span className="text-gray-400 ml-2">H</span><span className="dark:text-[#d1d4dc]">{currentCandle.high.toFixed(2)}</span>
                                    <span className="text-gray-400 ml-2">L</span><span className="dark:text-[#d1d4dc]">{currentCandle.low.toFixed(2)}</span>
                                    <span className="text-gray-400 ml-2">C</span><span className={currentCandle.close >= currentCandle.open ? 'text-emerald-500' : 'text-rose-500'}>{currentCandle.close.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block">
                        <defs><clipPath id="chart-clip"><rect width={Math.max(0, dimensions.width - 70)} height={Math.max(0, dimensions.height - 40)} /></clipPath></defs>
                        {currentXScale && yScale && (
                            <g transform="translate(10, 10)" clipPath="url(#chart-clip)">
                                {drawings.map(d => (
                                    <DrawingRenderer
                                        key={d.id}
                                        drawing={d}
                                        xScale={currentXScale}
                                        yScale={yScale}
                                        chartWidth={dimensions.width - 70}
                                        chartHeight={dimensions.height - 40}
                                        isSelected={selectedId === d.id}
                                        onSelect={setSelectedId}
                                        onDragStart={handleDrawingDragStart}
                                        theme={theme || 'light'}
                                        textColor={colors.text}
                                        baseTime={data[0].time}
                                        step={getIntervalStep()}
                                    />
                                ))}
                                {drawingPoints.current && previewPoint && (
                                    <PreviewRenderer type={activeTool} point1={drawingPoints.current} point2={previewPoint} xScale={currentXScale} yScale={yScale} textColor={colors.text} baseTime={data[0].time} step={getIntervalStep()} />
                                )}
                            </g>
                        )}
                    </svg>

                    <AnimatePresence>
                        {selectedDrawing && <DrawingToolbar drawing={selectedDrawing} onUpdate={updateSelectedDrawing} onDelete={deleteDrawing} onOpenSettings={() => setIsSettingsOpen(true)} />}
                    </AnimatePresence>

                    <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]" />
                            <Dialog.Content asChild>
                                <motion.div
                                    drag
                                    dragMomentum={false}
                                    initial={{ opacity: 0, scale: 0.98, x: "-50%", y: "-50%" }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ x: "-50%", y: "-50%" }}
                                    className="fixed top-1/2 left-1/2 w-[400px] bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded-xl shadow-2xl z-[101] outline-none overflow-hidden flex flex-col"
                                >
                                    <div className="h-11 border-b border-gray-100 dark:border-[#363a45] flex items-center px-4 justify-between bg-gray-50/50 dark:bg-black/10 cursor-grab active:cursor-grabbing shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Settings size={16} className="text-blue-500" />
                                            <Dialog.Title asChild>
                                                <span className="text-[12px] font-black uppercase tracking-widest text-gray-900 dark:text-[#d1d4dc]">{selectedDrawing?.type} Settings</span>
                                            </Dialog.Title>
                                        </div>
                                        <Dialog.Close className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"><X size={18} /></Dialog.Close>
                                    </div>
                                    <div className="p-5 space-y-6 max-h-[400px] overflow-y-auto">
                                        {selectedDrawing?.type === 'fibonacci' ? (
                                            <>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-4 w-1 bg-blue-500 rounded-full" />
                                                        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-500">Fibonacci Levels</h3>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {selectedDrawing.fibSettings?.levels.map((level, idx) => (
                                                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-black/10 rounded-lg">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={level.visible}
                                                                    onChange={(e) => {
                                                                        const newLevels = [...(selectedDrawing.fibSettings?.levels || [])];
                                                                        newLevels[idx] = { ...newLevels[idx], visible: e.target.checked };
                                                                        updateSelectedDrawing({ fibSettings: { ...selectedDrawing.fibSettings!, levels: newLevels } });
                                                                    }}
                                                                    className="w-4 h-4 rounded text-blue-600"
                                                                />
                                                                <span className="text-[11px] font-bold text-gray-600 dark:text-[#d1d4dc] w-16">{(level.level * 100).toFixed(1)}%</span>
                                                                <input
                                                                    type="color"
                                                                    value={level.color}
                                                                    onChange={(e) => {
                                                                        const newLevels = [...(selectedDrawing.fibSettings?.levels || [])];
                                                                        newLevels[idx] = { ...newLevels[idx], color: e.target.value };
                                                                        updateSelectedDrawing({ fibSettings: { ...selectedDrawing.fibSettings!, levels: newLevels } });
                                                                    }}
                                                                    className="w-8 h-8 rounded cursor-pointer"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#363a45]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-4 w-1 bg-blue-500 rounded-full" />
                                                        <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-500">Display Options</h3>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-black/10 rounded-lg cursor-pointer">
                                                            <span className="text-[12px] font-medium text-gray-600 dark:text-[#b2b5be]">Show Background</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDrawing.fibSettings?.showBackground}
                                                                onChange={(e) => updateSelectedDrawing({ fibSettings: { ...selectedDrawing.fibSettings!, showBackground: e.target.checked } })}
                                                                className="w-4 h-4 rounded text-blue-600"
                                                            />
                                                        </label>
                                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-black/10 rounded-lg cursor-pointer">
                                                            <span className="text-[12px] font-medium text-gray-600 dark:text-[#b2b5be]">Extend Left</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDrawing.fibSettings?.extendLeft}
                                                                onChange={(e) => updateSelectedDrawing({ fibSettings: { ...selectedDrawing.fibSettings!, extendLeft: e.target.checked } })}
                                                                className="w-4 h-4 rounded text-blue-600"
                                                            />
                                                        </label>
                                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-black/10 rounded-lg cursor-pointer">
                                                            <span className="text-[12px] font-medium text-gray-600 dark:text-[#b2b5be]">Extend Right</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDrawing.fibSettings?.extendRight}
                                                                onChange={(e) => updateSelectedDrawing({ fibSettings: { ...selectedDrawing.fibSettings!, extendRight: e.target.checked } })}
                                                                className="w-4 h-4 rounded text-blue-600"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3"><div className="h-4 w-1 bg-blue-500 rounded-full" /><h3 className="text-[11px] font-black uppercase tracking-wider text-gray-500">Data Points</h3></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {selectedDrawing && TOOL_CONFIGS[selectedDrawing.type].showPrice1 && (
                                                        <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Price P1</label><input type="number" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-[#363a45] rounded p-2 text-[12px] outline-none" value={selectedDrawing.p1.toFixed(2)} onChange={(e) => updateSelectedDrawing({ p1: parseFloat(e.target.value) })} /></div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-14 border-t border-gray-100 dark:border-[#363a45] flex items-center px-4 justify-end gap-2 bg-gray-50/50 dark:bg-black/10">
                                        <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-[11px] font-black text-gray-500 uppercase tracking-widest">Discard</button>
                                        <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-blue-600 text-white text-[11px] font-black rounded-lg shadow-lg uppercase tracking-widest">Update</button>
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>

                    <ChartSettingsModal open={isChartSettingsOpen} onOpenChange={setIsChartSettingsOpen} settings={chartSettings} onUpdate={setChartSettings} />
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[200px] bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded shadow-2xl z-50 p-1 animate-in fade-in slide-in-from-right-1">
                    <ContextItem label="Reset Viewport" icon={<RotateCcw size={14} />} shortcut="Alt+R" onClick={() => window.location.reload()} />
                    <ContextMenu.Separator className="h-[1px] bg-gray-100 dark:bg-[#363a45] my-1" />
                    <ContextItem label="Remove Indicators" icon={< EyeOff size={14} />} onClick={() => { }} />
                    <ContextItem label="Remove Drawings" icon={<Trash2 size={14} />} onClick={() => { setDrawings([]); setSelectedId(null); }} />
                    <ContextMenu.Separator className="h-[1px] bg-gray-100 dark:bg-[#363a45] my-1" />
                    <ContextMenu.Sub>
                        <ContextMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#d1d4dc] hover:bg-blue-600 hover:text-white rounded transition-colors group">
                            <div className="flex items-center gap-3"><Palette size={14} /><span>Color Theme</span></div>
                            <ChevronRight size={14} className="opacity-40" />
                        </ContextMenu.SubTrigger>
                        <ContextMenu.Portal>
                            <ContextMenu.SubContent className="min-w-[140px] bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded shadow-2xl p-1">
                                <ContextMenu.Item className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#d1d4dc] hover:bg-blue-600 hover:text-white rounded flex items-center justify-between cursor-pointer" onClick={() => setTheme('light')}>Light {theme === 'light' && <Check size={14} />}</ContextMenu.Item>
                                <ContextMenu.Item className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#d1d4dc] hover:bg-blue-600 hover:text-white rounded flex items-center justify-between cursor-pointer" onClick={() => setTheme('dark')}>Dark {theme === 'dark' && <Check size={14} />}</ContextMenu.Item>
                            </ContextMenu.SubContent>
                        </ContextMenu.Portal>
                    </ContextMenu.Sub>
                    <ContextMenu.Separator className="h-[1px] bg-gray-100 dark:bg-[#363a45] my-1" />
                    <ContextItem label="Settings..." icon={<Settings size={14} />} shortcut="Ctrl+P" onClick={() => setIsChartSettingsOpen(true)} />
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
};

const ProCheckbox = ({ label, checked, onChange }: { label: string, checked?: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
        <span className="text-[12px] font-medium text-gray-600 dark:text-[#b2b5be] group-hover:text-gray-900 dark:group-hover:text-white">{label}</span>
        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
);

const ContextItem = ({ label, icon, shortcut, onClick, className }: { label: string, icon: React.ReactNode, shortcut?: string, onClick: () => void, className?: string }) => (
    <ContextMenu.Item className={`flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#d1d4dc] hover:bg-blue-600 hover:text-white rounded cursor-pointer outline-none transition-colors group ${className}`} onClick={onClick}>
        <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
        {shortcut && <span className="text-[10px] font-medium opacity-40 group-hover:opacity-100">{shortcut}</span>}
    </ContextMenu.Item>
);

export default TradingChart;
