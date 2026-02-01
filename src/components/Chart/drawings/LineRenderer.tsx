"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing, LineStyle } from "@/types/chart";

interface LineRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    chartWidth: number;
    chartHeight: number;
    isSelected: boolean;
    onSelect: (id: number) => void;
    baseTime: number;
    step: number;
}

export const LineRenderer: React.FC<LineRendererProps> = ({
    drawing,
    xScale,
    yScale,
    chartWidth,
    chartHeight,
    isSelected,
    onSelect,
    baseTime,
    step
}) => {
    const x = xScale((parseInt(drawing.t1) - baseTime) / step);
    const y = yScale(drawing.p1);

    const getStrokeDashArray = (style: LineStyle) => {
        if (style === 'dashed') return "6,6";
        if (style === 'dotted') return "2,4";
        return "none";
    };

    const color = isSelected ? "#2962ff" : drawing.color;
    const width = isSelected ? Math.max(drawing.width, 2.5) : drawing.width;
    const opacity = drawing.locked ? 0.4 : drawing.opacity / 100;

    if (drawing.type === 'horizontalLine') {
        return (
            <g onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }} className="cursor-pointer">
                <line x1={0} y1={y} x2={chartWidth} y2={y} stroke={color} strokeWidth={width} strokeDasharray={getStrokeDashArray(drawing.style)} opacity={opacity} />
                <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="transparent" strokeWidth={15} />
                {isSelected && !drawing.locked && <circle cx={x} cy={y} r={5} fill="white" stroke="#2962ff" strokeWidth={2} />}
            </g>
        );
    }

    if (drawing.type === 'verticalLine') {
        return (
            <g onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }} className="cursor-pointer">
                <line x1={x} y1={0} x2={x} y2={chartHeight} stroke={color} strokeWidth={width} strokeDasharray={getStrokeDashArray(drawing.style)} opacity={opacity} />
                <line x1={x} y1={0} x2={x} y2={chartHeight} stroke="transparent" strokeWidth={15} />
                {isSelected && !drawing.locked && <circle cx={x} cy={y} r={5} fill="white" stroke="#2962ff" strokeWidth={2} />}
            </g>
        );
    }

    return null;
};
