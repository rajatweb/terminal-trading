"use client";

import React from "react";
import * as d3 from "d3";

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

interface PreviewRendererProps {
    type: string;
    point1: { t: string, p: number };
    point2: { t: string, p: number };
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    textColor: string;
    baseTime: number;
    step: number;
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({
    type,
    point1,
    point2,
    xScale,
    yScale,
    textColor,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    const x1 = getX(point1.t);
    const x2 = getX(point2.t);
    const y1 = yScale(point1.p);
    const y2 = yScale(point2.p);

    if (type === 'fibonacci') {
        const diff = y2 - y1;
        return (
            <g opacity={0.5}>
                {FIB_LEVELS.map(lvl => {
                    const ly = y1 + diff * lvl;
                    return (
                        <line
                            key={lvl}
                            x1={Math.min(x1, x2)}
                            y1={ly}
                            x2={Math.max(x1, x2)}
                            y2={ly}
                            stroke="#2962ff"
                            strokeWidth={1}
                            strokeDasharray="2,2"
                        />
                    );
                })}
            </g>
        );
    }

    if (type === 'rectangle') {
        return (
            <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={Math.abs(x2 - x1)}
                height={Math.abs(y2 - y1)}
                fill="#2962ff"
                opacity={0.2}
                stroke="#2962ff"
                strokeWidth={1}
            />
        );
    }

    if (type === 'priceRange') {
        const priceDiff = point2.p - point1.p;
        const percent = (priceDiff / point1.p) * 100;
        return (
            <g>
                <rect
                    x={Math.min(x1, x2)}
                    y={Math.min(y1, y2)}
                    width={Math.abs(x2 - x1)}
                    height={Math.abs(y2 - y1)}
                    fill={priceDiff >= 0 ? "#26a69a" : "#ef5350"}
                    opacity={0.2}
                />
                <text
                    x={(x1 + x2) / 2}
                    y={Math.min(y1, y2) - 5}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize="10px"
                >
                    {`${priceDiff.toFixed(2)} (${percent.toFixed(2)}%)`}
                </text>
            </g>
        );
    }

    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#2962ff"
            strokeWidth={1.5}
            strokeDasharray="4,4"
            opacity={0.7}
        />
    );
};
