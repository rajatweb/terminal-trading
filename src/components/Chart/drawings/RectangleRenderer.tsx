"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing, LineStyle } from "@/types/chart";

interface RectangleRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    chartWidth: number;
    chartHeight: number;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onDragStart: (id: number, type: 'point' | 'whole', pointIndex?: 1 | 2, e?: React.MouseEvent) => void;
    baseTime: number;
    step: number;
}

export const RectangleRenderer: React.FC<RectangleRendererProps> = ({
    drawing,
    xScale,
    yScale,
    chartWidth,
    chartHeight,
    isSelected,
    onSelect,
    onDragStart,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    if (!drawing.t2 || drawing.p2 === undefined) return null;

    let x1 = getX(drawing.t1);
    let y1 = yScale(drawing.p1);
    let x2 = getX(drawing.t2);
    let y2 = yScale(drawing.p2);

    if (drawing.extendLeft) x1 = 0;
    if (drawing.extendRight) x2 = chartWidth;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    const color = isSelected ? "#2962ff" : drawing.color;
    const strokeWidth = isSelected ? Math.max(drawing.width, 2.5) : drawing.width;

    const getStrokeDashArray = (style: LineStyle) => {
        if (style === 'dashed') return "6,6";
        if (style === 'dotted') return "2,4";
        return "none";
    };

    return (
        <g
            onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }}
            onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!drawing.locked) {
                    onSelect(drawing.id);
                    onDragStart(drawing.id, 'whole', undefined, e);
                }
            }}
            className={drawing.locked ? "cursor-default" : (isSelected ? "cursor-move" : "cursor-pointer")}
        >
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={drawing.color}
                fillOpacity={0.1}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={getStrokeDashArray(drawing.style)}
            />

            {isSelected && !drawing.locked && (
                <>
                    <circle
                        cx={getX(drawing.t1)}
                        cy={yScale(drawing.p1)}
                        r={5}
                        fill="white"
                        stroke="#2962ff"
                        strokeWidth={2}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDragStart(drawing.id, 'point', 1, e);
                        }}
                        className="cursor-crosshair"
                    />
                    <circle
                        cx={getX(drawing.t2)}
                        cy={yScale(drawing.p2)}
                        r={5}
                        fill="white"
                        stroke="#2962ff"
                        strokeWidth={2}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDragStart(drawing.id, 'point', 2, e);
                        }}
                        className="cursor-crosshair"
                    />
                </>
            )}
        </g>
    );
};
