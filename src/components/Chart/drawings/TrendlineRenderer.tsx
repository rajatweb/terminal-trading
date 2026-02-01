"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing, LineStyle } from "@/types/chart";

interface TrendlineRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    chartWidth: number;
    chartHeight: number;
    isSelected: boolean;
    onSelect: (id: number) => void;
    theme: string;
    textColor: string;
    baseTime: number;
    step: number;
}

export const TrendlineRenderer: React.FC<TrendlineRendererProps> = ({
    drawing,
    xScale,
    yScale,
    chartWidth,
    isSelected,
    onSelect,
    theme,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    if (!drawing.t2 || drawing.p2 === undefined) return null;

    let x1 = getX(drawing.t1);
    let y1 = yScale(drawing.p1);
    let x2 = getX(drawing.t2);
    let y2 = yScale(drawing.p2);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const slope = dy / dx;

    if (drawing.type === 'ray' || drawing.extendRight) {
        x2 = chartWidth;
        y2 = y1 + slope * (x2 - x1);
    }
    if (drawing.extendLeft) {
        const oldX1 = x1;
        x1 = 0;
        y1 = y1 + slope * (x1 - oldX1);
    }

    const getStrokeDashArray = (style: LineStyle) => {
        if (style === 'dashed') return "6,6";
        if (style === 'dotted') return "2,4";
        return "none";
    };

    const color = isSelected ? "#2962ff" : drawing.color;
    const width = isSelected ? Math.max(drawing.width, 2.5) : drawing.width;
    const opacity = drawing.locked ? 0.4 : drawing.opacity / 100;

    return (
        <g onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }} className="cursor-pointer">
            {/* Main Line */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={getStrokeDashArray(drawing.style)}
                opacity={opacity}
                markerEnd={drawing.type === 'arrow' ? "url(#arrow-head)" : "none"}
            />

            {/* Hitbox */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={15}
            />

            {/* Selection Handles */}
            {isSelected && !drawing.locked && (
                <>
                    <circle
                        cx={getX(drawing.t1)}
                        cy={yScale(drawing.p1)}
                        r={5}
                        fill="white"
                        stroke="#2962ff"
                        strokeWidth={2}
                    />
                    <circle
                        cx={getX(drawing.t2)}
                        cy={yScale(drawing.p2)}
                        r={5}
                        fill="white"
                        stroke="#2962ff"
                        strokeWidth={2}
                    />
                </>
            )}

            {/* Price Stats */}
            {drawing.showStats && !drawing.extendLeft && !drawing.extendRight && drawing.type === 'trendline' && (
                <TrendlineStats x1={x1} y1={y1} x2={x2} y2={y2} p1={drawing.p1} p2={drawing.p2} theme={theme} />
            )}
        </g>
    );
};

const TrendlineStats = ({ x1, y1, x2, y2, p1, p2, theme }: any) => {
    const pDiff = p2 - p1;
    const pPercent = (pDiff / p1) * 100;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 15;

    return (
        <g transform={`translate(${midX}, ${midY})`}>
            <rect
                x={-35}
                y={-10}
                width={70}
                height={20}
                rx={4}
                fill={theme === 'dark' ? "#1e222d" : "#f3f4f6"}
                stroke={theme === 'dark' ? "#2d3436" : "#e5e7eb"}
            />
            <text
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={pDiff >= 0 ? "#26a69a" : "#ef5350"}
                fontSize="10px"
                fontWeight="bold"
            >
                {`${pDiff.toFixed(2)} (${pPercent.toFixed(2)}%)`}
            </text>
        </g>
    );
};
