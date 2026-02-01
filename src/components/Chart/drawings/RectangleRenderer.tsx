"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing, LineStyle } from "@/types/chart";

interface RectangleRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    chartWidth: number;
    isSelected: boolean;
    onSelect: (id: number) => void;
    baseTime: number;
    step: number;
}

export const RectangleRenderer: React.FC<RectangleRendererProps> = ({
    drawing,
    xScale,
    yScale,
    chartWidth,
    isSelected,
    onSelect,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    if (!drawing.t2 || drawing.p2 === undefined) return null;

    let rx1 = getX(drawing.t1);
    let rx2 = getX(drawing.t2);
    const ry1 = Math.min(yScale(drawing.p1), yScale(drawing.p2));
    const ry2 = Math.max(yScale(drawing.p1), yScale(drawing.p2));

    if (drawing.extendLeft) rx1 = 0;
    if (drawing.extendRight) rx2 = chartWidth;

    const getStrokeDashArray = (style: LineStyle) => {
        if (style === 'dashed') return "6,6";
        if (style === 'dotted') return "2,4";
        return "none";
    };

    return (
        <g onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }} className="cursor-pointer">
            <rect
                x={Math.min(rx1, rx2)}
                y={ry1}
                width={Math.abs(rx2 - rx1)}
                height={ry2 - ry1}
                fill={drawing.color}
                opacity={drawing.opacity / 500}
                stroke={isSelected ? "#2962ff" : drawing.color}
                strokeWidth={drawing.width}
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
        </g>
    );
};
