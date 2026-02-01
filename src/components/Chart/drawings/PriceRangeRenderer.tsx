"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing } from "@/types/chart";

interface PriceRangeRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    isSelected: boolean;
    onSelect: (id: number) => void;
    baseTime: number;
    step: number;
}

export const PriceRangeRenderer: React.FC<PriceRangeRendererProps> = ({
    drawing,
    xScale,
    yScale,
    isSelected,
    onSelect,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    if (!drawing.t2 || drawing.p2 === undefined) return null;

    const x1 = getX(drawing.t1);
    const y1 = yScale(drawing.p1);
    const x2 = getX(drawing.t2);
    const y2 = yScale(drawing.p2);
    const pDiff = drawing.p2 - drawing.p1;
    const pPercent = (pDiff / drawing.p1) * 100;
    const isUp = pDiff >= 0;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return (
        <g onClick={(e) => { e.stopPropagation(); if (!drawing.locked) onSelect(drawing.id); }} className="cursor-pointer">
            <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={Math.abs(x2 - x1)}
                height={Math.abs(y2 - y1)}
                fill={isUp ? "#26a69a" : "#ef5350"}
                opacity={drawing.opacity / 400}
                stroke={isUp ? "#26a69a" : "#ef5350"}
                strokeWidth={1}
            />

            <g transform={`translate(${midX}, ${midY})`}>
                <rect x={-40} y={-12} width={80} height={24} rx={4} fill={isUp ? "#26a69a" : "#ef5350"} />
                <text textAnchor="middle" y={-2} fill="white" fontSize="10px" fontWeight="bold">{`${pDiff.toFixed(2)}`}</text>
                <text textAnchor="middle" y={8} fill="white" fontSize="9px">{`${pPercent.toFixed(2)}%`}</text>
            </g>
        </g>
    );
};
