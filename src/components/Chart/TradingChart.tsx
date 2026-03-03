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
    ChevronDown,
    Activity
} from "lucide-react";
import DrawingToolbar from "./DrawingToolbar";
import { DrawingRenderer } from "./drawings/DrawingRenderer";
import { PreviewRenderer } from "./drawings/PreviewRenderer";
import { ChartSettingsModal } from "./ChartSettingsModal";
import { useTradingStore } from "@/stores/tradingStore";
import { WatchlistItem as TradingWatchlistItem } from "@/types/terminal";
import { getSymbolConfig } from "@/lib/dhan/symbols";

interface TradingChartProps {
    data: OHLCV[];
    activeTool: string;
    symbol?: string;
    interval?: string;
    onToolComplete?: () => void;
    isLoading?: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, activeTool, symbol = "NIFTY", interval = "1m", onToolComplete, isLoading }) => {
    // Select the active symbol's item from tradingStore watchlist for live updates
    const activeItem = useTradingStore(state =>
        state.watchlist.find(item => item.symbol === symbol)
    );

    // Map activeItem to the familiar latestQuote structure for existing logic compatibility
    const latestQuote = useMemo(() => {
        if (!activeItem) return null;
        return {
            securityId: Number(activeItem.securityId),
            ltp: activeItem.ltp,
            ltt: Date.now(),
            volume: activeItem.volume || 0,
            open: activeItem.open || activeItem.ltp,
            high: activeItem.high || activeItem.ltp,
            low: activeItem.low || activeItem.ltp,
            prevClose: activeItem.prevClose || activeItem.ltp
        };
    }, [activeItem]);

    const storeChartSettings = useTradingStore(state => state.chartSettings);
    const updateStoreChartSettings = useTradingStore(state => state.updateChartSettings);

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const drawingPoints = useRef<{ t: string, p: number } | null>(null);
    const [previewPoint, setPreviewPoint] = useState<{ t: string, p: number } | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isChartSettingsOpen, setIsChartSettingsOpen] = useState(false);
    const [hoveredCandle, setHoveredCandle] = useState<OHLCV | null>(null);

    const { theme, setTheme } = useTheme();

    const chartSettings = storeChartSettings;
    const setChartSettings = updateStoreChartSettings;

    // Local state to maintain accumulated OHLC for live candles
    const [candles, setCandles] = useState<OHLCV[]>(data || []);

    // Sync state when historical data changes (symbol/interval change)
    useEffect(() => {
        if (data) {
            setCandles(data);
        }
    }, [data]);

    // Handle Real-time Updates
    useEffect(() => {
        if (!latestQuote || !symbol || candles.length === 0) return;

        let securityId = "";
        const staticConfig = getSymbolConfig(symbol);
        if (staticConfig) {
            securityId = staticConfig.id;
        } else {
            // Check watchlists for dynamic symbol
            const state = useTradingStore.getState();
            for (const group of state.watchlists) {
                const item = group.items.find(i => i.symbol === symbol);
                if (item?.securityId) {
                    securityId = item.securityId;
                    break;
                }
            }
        }

        if (!securityId || latestQuote.securityId.toString() !== securityId.toString()) return;

        const ltp = latestQuote.ltp;
        const ltt = latestQuote.ltt || Date.now();
        if (ltp === undefined || ltp <= 0) return; // Prevent bad 0-price ticks from ruining scale

        setCandles(prev => {
            if (prev.length === 0) return prev;

            const lastCandle = prev[prev.length - 1];

            // Parse interval to seconds
            let intervalSeconds = 300; // default 5m
            if (interval === '1m') intervalSeconds = 60;
            else if (interval === '5m') intervalSeconds = 300;
            else if (interval === '15m') intervalSeconds = 900;
            else if (interval === '1h') intervalSeconds = 3600;
            else if (interval === 'D') intervalSeconds = 86400;

            // Normalize ltt to epoch seconds
            let currentEpochSec = Math.floor(Date.now() / 1000);
            if (typeof ltt === 'number') {
                // If ltt is in milliseconds, convert to seconds
                currentEpochSec = ltt > 20000000000 ? Math.floor(ltt / 1000) : ltt;
            } else if (typeof ltt === 'string') {
                const parsed = new Date(ltt).getTime();
                if (!isNaN(parsed)) currentEpochSec = Math.floor(parsed / 1000);
            }

            // Current tick boundary (aligned to interval)
            const currentCandleTime = Math.floor(currentEpochSec / intervalSeconds) * intervalSeconds;

            if (currentCandleTime > lastCandle.time) {
                const newCandle: OHLCV = {
                    time: currentCandleTime,
                    open: ltp, high: ltp, low: ltp, close: ltp,
                    volume: latestQuote.volume || 0
                };
                return [...prev, newCandle];
            } else {
                const updatedCandle = {
                    ...lastCandle,
                    close: ltp,
                    high: Math.max(lastCandle.high, ltp),
                    low: Math.min(lastCandle.low, ltp),
                    volume: lastCandle.volume
                };
                const newArr = [...prev];
                newArr[newArr.length - 1] = updatedCandle;
                return newArr;
            }
        });
    }, [latestQuote, symbol, interval]);

    // Calculate livePrice for the LTP line from store directly
    const [livePrice, setLivePrice] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (!latestQuote || !symbol) return;
        const config = getSymbolConfig(symbol);
        if (config && latestQuote.securityId.toString() === config.id && latestQuote.ltp !== undefined) {
            setLivePrice(latestQuote.ltp);
        }
    }, [latestQuote, symbol]);

    const currentLivePrice = livePrice;

    const selectedDrawing = drawings.find(d => d.id === selectedId);

    const colors = useMemo(() => ({
        grid: theme === 'dark' ? '#2a2e39' : '#f0f3fa',
        text: theme === 'dark' ? '#787b86' : '#6b7280',
        crosshair: theme === 'dark' ? '#9ca3af' : '#6b7280',
        bg: theme === 'dark' ? '#131722' : '#ffffff',
        accent: '#2962ff'
    }), [theme]);

    const sessionStarts = useMemo(() => {
        const starts: number[] = [];
        let lastDay = "";
        candles.forEach((c, i) => {
            const dStr = new Date(c.time * 1000).toDateString();
            if (dStr !== lastDay) {
                starts.push(i);
                lastDay = dStr;
            }
        });
        return starts;
    }, [candles]);

    const [currentXScale, setCurrentXScale] = useState<d3.ScaleLinear<number, number> | null>(null);
    const [yScale, setYScale] = useState<d3.ScaleLinear<number, number> | null>(null);

    const [dragState, setDragState] = useState<{
        type: 'point' | 'whole',
        drawingId: number,
        pointIndex?: 1 | 2,
        startMouse?: { x: number, y: number },
        originalDrawing?: Drawing
    } | null>(null);

    const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    const isAutoPricedRef = useRef(true);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const dragStateRef = useRef(dragState);
    const activeToolRef = useRef(activeTool);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const yAxisDragRef = useRef<d3.DragBehavior<SVGGElement, unknown, unknown> | null>(null);
    const isInteractionsBoundRef = useRef(false);
    const defaultTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

    // Sync refs with state/props
    useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

    const getIntervalStep = () => {
        if (interval === "1m") return 60;
        if (interval === "5m") return 300;
        if (interval === "15m") return 900;
        if (interval === "1h") return 3600;
        if (interval === "D") return 86400;
        return 300;
    };

    const getTimeAtIndex = (idx: number) => {
        const i = Math.floor(idx);
        if (candles && candles[i]) {
            return candles[i].time;
        }
        // Fallback for future/pre-session indices
        const step = getIntervalStep();
        const base = (candles && candles.length > 0) ? candles[0].time : 0;
        if (base === 0) return 0;
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
        if (drawing.locked) return;

        setDragState({
            type,
            drawingId: id,
            pointIndex,
            startMouse: e ? { x: e.clientX, y: e.clientY } : undefined,
            originalDrawing: { ...drawing }
        });
    };

    // Main Chart Rendering Effect
    // Removed activeTool and dragState from dependencies to prevent full re-renders on interaction
    useEffect(() => {
        if (!svgRef.current || candles.length === 0 || dimensions.width === 0) return;

        const { width, height } = dimensions;
        const margin = { top: 10, right: 65, bottom: 25, left: 10 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        let g = svg.select<SVGGElement>(".main-g");
        if (g.empty()) {
            g = svg.append("g").attr("class", "main-g");
        }
        g.attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, candles.length]).range([0, chartWidth]);
        const priceMin = d3.min(candles, (d: OHLCV) => d.low) || 0;
        const priceMax = d3.max(candles, (d: OHLCV) => d.high) || 0;
        const pricePadding = (priceMax - priceMin) * 0.12;
        const y = d3.scaleLinear().domain([priceMin - pricePadding, priceMax + pricePadding]).range([chartHeight, 0]);

        setCurrentXScale(() => x);
        setYScale(() => y);

        const mainChartArea = g.selectAll<SVGGElement, any>(".main-chart-area").data([null]).join("g").attr("class", "main-chart-area").attr("clip-path", "url(#chart-clip)");

        const gridGroup = mainChartArea.selectAll<SVGGElement, any>(".grid-lines").data([null]).join("g").attr("class", "grid-lines");
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
                let xTicks = [];
                for (let i = Math.floor(startIdx); i <= endIdx; i += tickStep) xTicks.push(i);

                // Add session starts to grid if visible
                const visibleSessionStarts = sessionStarts.filter(idx => idx >= startIdx && idx <= endIdx);
                xTicks = Array.from(new Set([...xTicks, ...visibleSessionStarts]));

                gridGroup.selectAll(".v-grid").data(xTicks).join("line").attr("class", "v-grid")
                    .attr("x1", d => sx(d)).attr("x2", d => sx(d))
                    .attr("y1", 0).attr("y2", chartHeight)
                    .attr("stroke", colors.grid)
                    .attr("stroke-width", d => sessionStarts.includes(d) ? 1.5 : 1)
                    .attr("stroke-opacity", d => sessionStarts.includes(d) ? 0.8 : 0.5);
            }
        };

        const candleGroup = mainChartArea.selectAll<SVGGElement, any>(".candles").data([null]).join("g").attr("class", "candles");
        const drawCandles = (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => {
            const candleSelection = candleGroup.selectAll<SVGGElement, OHLCV>(".candle").data(candles, (d: OHLCV) => d.time.toString());
            const enter = candleSelection.enter().append("g").attr("class", "candle");
            enter.append("line").attr("class", "wick").attr("stroke-width", 1);
            enter.append("rect").attr("class", "body").attr("stroke-width", 1).attr("rx", 0.5);
            const update = candleSelection.merge(enter as any);
            const bandwidth = (sx(1) - sx(0)) * 0.7;
            update.attr("transform", (d, i) => `translate(${sx(i) - bandwidth / 2}, 0)`).style("display", (d, i) => {
                const xPos = sx(i);
                return (xPos >= -bandwidth && xPos <= chartWidth + bandwidth) ? null : "none";
            });
            update.select(".wick").attr("y1", d => sy((d as OHLCV).high)).attr("y2", d => sy((d as OHLCV).low)).attr("x1", bandwidth / 2).attr("x2", bandwidth / 2)
                .attr("stroke", d => ((d as OHLCV).close >= (d as OHLCV).open ? chartSettings.symbol.wickUpColor : chartSettings.symbol.wickDownColor));
            update.select(".body").attr("y", d => sy(Math.max((d as OHLCV).open, (d as OHLCV).close))).attr("height", d => Math.abs(sy((d as OHLCV).open) - sy((d as OHLCV).close)) || 0.5).attr("width", bandwidth)
                .attr("fill", d => ((d as OHLCV).close >= (d as OHLCV).open ? chartSettings.symbol.upColor : chartSettings.symbol.downColor))
                .attr("stroke", d => ((d as OHLCV).close >= (d as OHLCV).open ? chartSettings.symbol.borderUpColor : chartSettings.symbol.borderDownColor));
            candleSelection.exit().remove();

            // Draw Indicators (ADRx3 Improved logic)
            const indicatorGroup = mainChartArea.selectAll<SVGGElement, any>(".indicators").data([null]).join("g").attr("class", "indicators");

            const adrSettings = chartSettings.indicators?.adr || DEFAULT_CHART_SETTINGS.indicators.adr;
            const definedAdr = (key: string) => (d: OHLCV) => typeof d.adr?.[key] === 'number' && d.adr[key] > 0;
            const yAdr = (key: string) => (d: OHLCV) => sy(d.adr[key] as number);

            // Area generators for the colored zones
            const areaHigh = d3.area<OHLCV>()
                .defined(d => definedAdr('adr1h')(d) && definedAdr('adr2h')(d))
                .x((d, i) => sx(i))
                .y0(yAdr('adr1h'))
                .y1(yAdr('adr2h'));

            const areaLow = d3.area<OHLCV>()
                .defined(d => definedAdr('adr1l')(d) && definedAdr('adr2l')(d))
                .x((d, i) => sx(i))
                .y0(yAdr('adr1l'))
                .y1(yAdr('adr2l'));

            // Plot Resistance Zone (Highs)
            indicatorGroup.selectAll(".area-r-zone").data([candles]).join("path").attr("class", "area-r-zone")
                .attr("d", areaHigh as any)
                .attr("fill", "#ef4444")
                .attr("fill-opacity", 0.08);

            // Plot Support Zone (Lows)
            indicatorGroup.selectAll(".area-s-zone").data([candles]).join("path").attr("class", "area-s-zone")
                .attr("d", areaLow as any)
                .attr("fill", "#10b981")
                .attr("fill-opacity", 0.08);

            const buildLine = (key: string) => d3.line<OHLCV>()
                .defined(definedAdr(key))
                .x((d, i) => sx(i))
                .y(yAdr(key));

            // Mid line
            indicatorGroup.selectAll(".line-mid").data([candles]).join("path").attr("class", "line-mid")
                .attr("d", buildLine('open') as any)
                .attr("fill", "none")
                .attr("stroke", "#9ca3af")
                .attr("stroke-width", 2)
                .attr("opacity", 0.8);

            // Bounding lines
            [
                { key: 'adr1h', color: '#ef4444', label: 'R1' }, { key: 'adr2h', color: '#ef4444', label: 'R2' },
                { key: 'adr1l', color: '#10b981', label: 'S1' }, { key: 'adr2l', color: '#10b981', label: 'S2' }
            ].forEach(lineConf => {
                indicatorGroup.selectAll(`.line-${lineConf.key}`).data([candles]).join("path").attr("class", `line-${lineConf.key}`)
                    .attr("d", buildLine(lineConf.key) as any)
                    .attr("fill", "none")
                    .attr("stroke", lineConf.color)
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.5);

                if (adrSettings.showLabels && candles.length > 0) {
                    const lastD = candles[candles.length - 1];
                    if (definedAdr(lineConf.key)(lastD)) {
                        indicatorGroup.selectAll(`.label-${lineConf.key}`).data([lastD]).join("text").attr("class", `label-${lineConf.key}`)
                            .attr("x", sx(candles.length - 1) + 5)
                            .attr("y", yAdr(lineConf.key)(lastD) + 3)
                            .attr("fill", lineConf.color)
                            .attr("font-size", "10px")
                            .attr("font-weight", "black")
                            .text(lineConf.label);
                    }
                } else {
                    indicatorGroup.selectAll(`.label-${lineConf.key}`).remove();
                }
            });

            // ADR Up/Dn 2 (Outliers)
            const outlierData = adrSettings.showSecondary ? [
                { key: 'adrUp2', color: '#ef4444', label: 'R+' },
                { key: 'adrDn2', color: '#10b981', label: 'S+' }
            ] : [];

            // If hiding secondary, cleanup existing ones
            if (!adrSettings.showSecondary) {
                indicatorGroup.selectAll(".line-adrUp2, .line-adrDn2, .label-adrUp2, .label-adrDn2").remove();
            }

            outlierData.forEach(lineConf => {
                indicatorGroup.selectAll(`.line-${lineConf.key}`).data([candles]).join("path").attr("class", `line-${lineConf.key}`)
                    .attr("d", buildLine(lineConf.key) as any)
                    .attr("fill", "none")
                    .attr("stroke", lineConf.color)
                    .attr("stroke-width", 1.5)
                    .attr("stroke-dasharray", "2,4")
                    .attr("stroke-linecap", "round")
                    .attr("opacity", 0.8);

                if (adrSettings.showLabels && candles.length > 0) {
                    const lastD = candles[candles.length - 1];
                    if (definedAdr(lineConf.key)(lastD)) {
                        indicatorGroup.selectAll(`.label-${lineConf.key}`).data([lastD]).join("text").attr("class", `label-${lineConf.key}`)
                            .attr("x", sx(candles.length - 1) + 5)
                            .attr("y", yAdr(lineConf.key)(lastD) + 3)
                            .attr("fill", lineConf.color)
                            .attr("font-size", "10px")
                            .attr("font-weight", "black")
                            .text(lineConf.label);
                    }
                } else {
                    indicatorGroup.selectAll(`.label-${lineConf.key}`).remove();
                }
            });
        };

        const yAxisGroup = g.selectAll<SVGGElement, any>(".y-axis").data([null]).join("g").attr("class", "y-axis").attr("transform", `translate(${chartWidth}, 0)`);
        const xAxisGroup = g.selectAll<SVGGElement, any>(".x-axis").data([null]).join("g").attr("class", "x-axis").attr("transform", `translate(0, ${chartHeight})`);

        const updateAxes = (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => {
            yAxisGroup.call(d3.axisRight(sy).tickSize(0).tickPadding(10) as any).select(".domain").remove();
            yAxisGroup.selectAll(".tick text").attr("fill", colors.text).attr("font-size", "11px");
            const [startIdx, endIdx] = sx.domain();
            const tickStep = Math.ceil((endIdx - startIdx) / 10);
            let tickValues = [];
            for (let i = Math.floor(startIdx); i <= endIdx; i += tickStep) tickValues.push(i);

            // Add session starts to labels
            const visibleSessionStarts = sessionStarts.filter(idx => idx >= startIdx && idx <= endIdx);
            tickValues = Array.from(new Set([...tickValues, ...visibleSessionStarts])).sort((a, b) => a - b);

            const timeFormat = d3.timeFormat("%H:%M");
            const dayFormat = d3.timeFormat("%d %b");

            xAxisGroup.call(d3.axisBottom(sx).tickValues(tickValues).tickFormat(idx => {
                const t = new Date(getTimeAtIndex(idx as number) * 1000);
                if (sessionStarts.includes(idx as number)) {
                    return dayFormat(t);
                }
                return interval === "D" ? d3.timeFormat("%b %d")(t) : timeFormat(t);
            }) as any).select(".domain").remove();

            xAxisGroup.selectAll(".tick text")
                .attr("fill", colors.text)
                .attr("font-size", "11px")
                .attr("font-weight", idx => sessionStarts.includes(idx as number) ? "bold" : "normal");
        };

        // MOVED INITIAL DRAW TO AFTER ZOOM SETUP TO HANDLE RESTORE LOGIC

        let currentScaleX = x;
        let currentScaleY = y;


        // Preserve zoom instance across renders so we don't break active Drag/Zoom gestures
        let zoom = zoomBehaviorRef.current;
        if (!zoom) {
            zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 100]);
            zoomBehaviorRef.current = zoom;
        }

        zoom.filter((event) => {
            const target = event.target as Element;
            // Prevent zoom if clicking on interactive drawing elements
            const isDrawingInteraction = target.closest('.cursor-move') || target.closest('.cursor-crosshair') || target.closest('.cursor-pointer');
            if (isDrawingInteraction) return false;
            // Allow 0 (Left Click) and 1 (Middle Click) for panning
            return !event.ctrlKey && (event.button === 0 || event.button === 1 || event.type === 'wheel');
        }).on("zoom", (e) => {
            if (activeToolRef.current !== 'cursor' || dragStateRef.current) return;
            transformRef.current = e.transform;
            currentScaleX = e.transform.rescaleX(x);
            setCurrentXScale(() => currentScaleX);

            if (isAutoPricedRef.current) {
                const [s, ed] = currentScaleX.domain();
                const visible = candles.filter((_, i) => i >= s && i <= ed);
                if (visible.length > 0) {
                    const minP = d3.min(visible, d => d.low)!;
                    const maxP = d3.max(visible, d => d.high)!;
                    const pad = (maxP - minP) * 0.15;
                    currentScaleY.domain([minP - pad, maxP + pad]);
                }
            }
            setYScale(() => currentScaleY);
            drawCandles(currentScaleX, currentScaleY);
            updateAxes(currentScaleX, currentScaleY);
            updateGrid(currentScaleX, currentScaleY);
        });

        // Price Axis Zoom/Drag Logic
        let yDragStartDomain: [number, number] | null = null;
        let yAxisZoom = yAxisDragRef.current;
        if (!yAxisZoom) {
            yAxisZoom = d3.drag<SVGGElement, unknown>();
            yAxisDragRef.current = yAxisZoom;
        }

        yAxisZoom.on("start", () => {
            isAutoPricedRef.current = false; // Disable auto-scale when manually zooming price
            yDragStartDomain = currentScaleY.domain() as [number, number];
        }).on("drag", (e) => {
            if (!yDragStartDomain) return;
            // Calculate scale factor based on drag distance
            const factor = Math.exp(-e.dy * 0.01);
            const cy = currentScaleY.invert(chartHeight / 2);
            const dMin = cy - (cy - yDragStartDomain[0]) * factor;
            const dMax = cy + (yDragStartDomain[1] - cy) * factor;

            yDragStartDomain = [dMin, dMax];
            currentScaleY.domain(yDragStartDomain);
            setYScale(() => currentScaleY);
            drawCandles(currentScaleX, currentScaleY);
            updateAxes(currentScaleX, currentScaleY);
            updateGrid(currentScaleX, currentScaleY);
        });

        yAxisGroup
            .style("cursor", "ns-resize")
            .on("dblclick", () => {
                // Double click to reset auto pricing
                isAutoPricedRef.current = true;
                const [s, ed] = currentScaleX.domain();
                const visible = candles.filter((_, i) => i >= s && i <= ed);
                if (visible.length > 0) {
                    const minP = d3.min(visible, d => d.low)!;
                    const maxP = d3.max(visible, d => d.high)!;
                    const pad = (maxP - minP) * 0.15;
                    currentScaleY.domain([minP - pad, maxP + pad]);
                    setYScale(() => currentScaleY);

                    drawCandles(currentScaleX, currentScaleY);
                    updateAxes(currentScaleX, currentScaleY);
                    updateGrid(currentScaleX, currentScaleY);
                }
            });

        // SVG transparent rect over Y-axis to catch events perfectly
        yAxisGroup.selectAll("rect.y-catch").data([null]).join("rect")
            .attr("class", "y-catch").attr("x", 0).attr("y", 0)
            .attr("width", margin.right).attr("height", chartHeight)
            .attr("fill", "transparent");

        // Apply Interaction Call-Bindings ONLY ONCE
        if (!isInteractionsBoundRef.current) {
            svg.call(zoom as any);
            yAxisGroup.call(yAxisZoom as any);
            isInteractionsBoundRef.current = true;
        }

        // Configure best fit "TradingView-like" initial zoom (last ~120 candles with right padding)
        const visibleCandlesCount = Math.max(1, Math.min(120, candles.length));
        const k = Math.max(1, candles.length / visibleCandlesCount);
        const rightPadding = Math.min(15, Math.floor(visibleCandlesCount * 0.15));
        const focusIndex = candles.length - 1 + rightPadding;
        const tx = chartWidth - k * x(focusIndex);
        defaultTransformRef.current = d3.zoomIdentity.translate(tx, 0).scale(k);

        // Restore previous zoom state if dragging/panning history was occurring
        if (transformRef.current !== d3.zoomIdentity) {
            // Apply silently without firing another zoom event during rendering
            zoom.transform(svg as any, transformRef.current);
        } else {
            // Auto applies initial custom transform natively 
            zoom.transform(svg as any, defaultTransformRef.current);
        }

        // Draw LTP Line (Re-added definition)
        // Draw LTP Line (Persistent and smooth)
        const ltpGroup = g.selectAll<SVGGElement, any>(".ltp-group").data(currentLivePrice !== undefined ? [currentLivePrice] : []).join("g").attr("class", "ltp-group");

        ltpGroup.each(function (price) {
            const group = d3.select(this);
            const yPos = currentScaleY(price);
            const isUp = price >= (candles[candles.length - 1]?.close || 0);
            const color = isUp ? "#10b981" : "#ef4444";

            if (yPos >= 0 && yPos <= chartHeight) {
                // Line
                group.selectAll("line.ltp-line").data([price]).join("line").attr("class", "ltp-line")
                    .attr("x1", 0).attr("x2", chartWidth).attr("y1", yPos).attr("y2", yPos)
                    .attr("stroke", color).attr("stroke-width", 1).attr("stroke-dasharray", "4,4");

                // Label Background
                yAxisGroup.selectAll("rect.ltp-label-bg").data([price]).join("rect").attr("class", "ltp-label-bg")
                    .attr("x", 0).attr("y", yPos - 10).attr("width", 50).attr("height", 20)
                    .attr("fill", color).attr("rx", 2);

                // Label Text
                yAxisGroup.selectAll("text.ltp-label-text").data([price]).join("text").attr("class", "ltp-label-text")
                    .attr("x", 25).attr("y", yPos + 4).attr("fill", "white").attr("font-size", "11px")
                    .attr("text-anchor", "middle").text(price.toFixed(2));
            } else {
                group.selectAll("*").remove();
                yAxisGroup.selectAll(".ltp-label-bg, .ltp-label-text").remove();
            }
        });

        // Cleanup if no price
        if (currentLivePrice === undefined) {
            g.selectAll(".ltp-group").remove();
            yAxisGroup.selectAll(".ltp-label-bg, .ltp-label-text").remove();
        }

        const crosshair = g.selectAll<SVGGElement, any>(".crosshair-container").data([null]).join("g").attr("class", "crosshair-container").style("display", "none").style("pointer-events", "none");
        const xL = crosshair.selectAll("line.x-cross").data([null]).join("line").attr("class", "x-cross").attr("stroke", colors.crosshair).attr("stroke-dasharray", "4,4");
        const yL = crosshair.selectAll("line.y-cross").data([null]).join("line").attr("class", "y-cross").attr("stroke", colors.crosshair).attr("stroke-dasharray", "4,4");

        svg.on("mousemove", (e) => {
            const [mx, my] = d3.pointer(e);

            const currentDragState = dragStateRef.current; // access ref

            // Handle Dragging Logic
            if (currentDragState) {
                e.preventDefault();
                const chartMx = mx - margin.left;
                const chartMy = my - margin.top;

                // Get inverted coordinates
                const idx = Math.round(currentScaleX.invert(chartMx));
                const time = getTimeAtIndex(Math.max(0, Math.min(idx, candles.length - 1))).toString();
                const price = currentScaleY.invert(chartMy);

                setDrawings(prev => prev.map(d => {
                    if (d.id !== currentDragState.drawingId) return d;

                    if (currentDragState.type === 'point' && currentDragState.pointIndex) {
                        return {
                            ...d,
                            [`t${currentDragState.pointIndex}`]: time,
                            [`p${currentDragState.pointIndex}`]: price
                        };
                    } else if (currentDragState.type === 'whole' && currentDragState.originalDrawing && currentDragState.startMouse) {
                        const startIdx = Math.round(currentScaleX.invert(currentDragState.startMouse.x - margin.left));
                        const currentIdx = Math.round(currentScaleX.invert(chartMx));
                        const idxDelta = currentIdx - startIdx;

                        const startPrice = currentScaleY.invert(currentDragState.startMouse.y - margin.top);
                        const priceDelta = price - startPrice;

                        const step = getIntervalStep();
                        const baseTime = candles[0]?.time || 0;
                        const origT1Idx = (parseInt(currentDragState.originalDrawing.t1) - baseTime) / step;
                        const newT1 = getTimeAtIndex(origT1Idx + idxDelta).toString();
                        const newP1 = currentDragState.originalDrawing.p1 + priceDelta;

                        if (currentDragState.originalDrawing.t2 && currentDragState.originalDrawing.p2 !== undefined) {
                            const origT2Idx = (parseInt(currentDragState.originalDrawing.t2) - baseTime) / step;
                            const newT2 = getTimeAtIndex(origT2Idx + idxDelta).toString();
                            const newP2 = currentDragState.originalDrawing.p2 + priceDelta;

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
                if (candles[idx]) setHoveredCandle(candles[idx]);
                if (activeToolRef.current !== 'cursor' && drawingPoints.current) setPreviewPoint({ t: getTimeAtIndex(idx).toString(), p: currentScaleY.invert(cy) });
            } else {
                crosshair.style("display", "none");
                setHoveredCandle(null);
            }
        });

        svg.on("mouseup", () => {
            // We update state here, which triggers re-render, effectively confirming the drag end
            setDragState(null);
        });

        svg.on("mouseleave", () => {
            if (dragStateRef.current) setDragState(null);
            crosshair.style("display", "none");
            setHoveredCandle(null);
        });

        svg.on("click", (e) => {
            if (dragStateRef.current) return;

            const [mx, my] = d3.pointer(e);
            const cx = mx - margin.left, cy = my - margin.top;
            const idx = Math.round(currentScaleX.invert(cx));
            const time = getTimeAtIndex(idx).toString(), price = currentScaleY.invert(cy);

            const tool = activeToolRef.current;

            if (tool !== 'cursor') {
                if (tool === 'horizontalLine' || tool === 'verticalLine') {
                    setDrawings(p => [...p, { id: Date.now(), type: tool as any, t1: time, p1: price, color: theme === 'dark' ? '#b2b5be' : '#2a2e39', width: 2, style: 'solid', locked: false, opacity: 100 }]);
                    onToolComplete?.();
                } else if (!drawingPoints.current) {
                    drawingPoints.current = { t: time, p: price };
                } else {
                    const p1 = drawingPoints.current;
                    if (p1) {
                        // Drawing creation logic using 'tool' variable
                        setDrawings(prev => [...prev, {
                            id: Date.now(),
                            type: tool as any,
                            t1: p1.t, p1: p1.p,
                            t2: time, p2: price,
                            color: theme === 'dark' ? '#b2b5be' : '#2a2e39',
                            width: 2, style: 'solid',
                            locked: false, opacity: 100,
                            fibSettings: tool === 'fibonacci' ? {
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

    }, [candles, dimensions, theme, colors, chartSettings, currentLivePrice]);

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
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

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
                                    <span className="text-gray-400">O</span><span className="dark:text-[#d1d4dc]">{currentCandle?.open?.toFixed(2) || '-'}</span>
                                    <span className="text-gray-400 ml-2">H</span><span className="dark:text-[#d1d4dc]">{currentCandle?.high?.toFixed(2) || '-'}</span>
                                    <span className="text-gray-400 ml-2">L</span><span className="dark:text-[#d1d4dc]">{currentCandle?.low?.toFixed(2) || '-'}</span>
                                    <span className="text-gray-400 ml-2">C</span><span className={currentCandle && currentCandle.close >= currentCandle.open ? 'text-emerald-500' : 'text-rose-500'}>{currentCandle?.close?.toFixed(2) || '-'}</span>
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

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                                    <Activity size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Synchronizing</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Dhan Live Market Feed</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[200px] bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#363a45] rounded shadow-2xl z-50 p-1 animate-in fade-in slide-in-from-right-1">
                    <ContextItem label="Reset Viewport" icon={<RotateCcw size={14} />} shortcut="Alt+R" onClick={() => {
                        if (svgRef.current && zoomBehaviorRef.current) {
                            isAutoPricedRef.current = true;
                            transformRef.current = defaultTransformRef.current;
                            d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, defaultTransformRef.current);
                        }
                    }} />
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
