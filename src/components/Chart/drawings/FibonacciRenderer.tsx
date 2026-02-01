"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing } from "@/types/chart";

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

interface FibonacciRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onDragStart: (id: number, type: 'point' | 'whole', pointIndex?: 1 | 2, e?: React.MouseEvent) => void;
    textColor: string;
    baseTime: number;
    step: number;
}

export const FibonacciRenderer: React.FC<FibonacciRendererProps> = ({
    drawing,
    xScale,
    yScale,
    isSelected,
    onSelect,
    onDragStart,
    textColor,
    baseTime,
    step
}) => {
    const getX = (t: string) => xScale((parseInt(t) - baseTime) / step);

    if (!drawing.t2 || drawing.p2 === undefined) return null;

    const x1 = getX(drawing.t1);
    const y1 = yScale(drawing.p1);
    const x2 = getX(drawing.t2);
    const y2 = yScale(drawing.p2);
    const diff = y2 - y1;

    const settings = drawing.fibSettings || {
        levels: [
            { level: 0, color: drawing.color, visible: true },
            { level: 0.236, color: drawing.color, visible: true },
            { level: 0.382, color: drawing.color, visible: true },
            { level: 0.5, color: drawing.color, visible: true },
            { level: 0.618, color: drawing.color, visible: true },
            { level: 0.786, color: drawing.color, visible: true },
            { level: 1, color: drawing.color, visible: true }
        ],
        showBackground: true,
        extendLeft: false,
        extendRight: false
    };

    const minX = settings.extendLeft ? 0 : Math.min(x1, x2);
    const maxX = settings.extendRight ? 10000 : Math.max(x1, x2); // 10000 is a safe large number for SVG overflow

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
            {/* Transparent Hitbox for easier selection/dragging */}
            <rect x={minX} y={Math.min(y1, y2)} width={maxX - minX} height={Math.abs(y2 - y1)} fill="transparent" />

            {settings.showBackground && (
                <rect x={minX} y={Math.min(y1, y2)} width={maxX - minX} height={Math.abs(y2 - y1)} fill={drawing.color} opacity={0.05} />
            )}

            {settings.levels.filter(l => l.visible).map(lvl => {
                const ly = y1 + diff * lvl.level;
                return (
                    <React.Fragment key={lvl.level}>
                        <line
                            x1={minX}
                            y1={ly}
                            x2={maxX}
                            y2={ly}
                            stroke={isSelected ? "#2962ff" : lvl.color}
                            strokeWidth={1}
                            opacity={drawing.opacity / 100}
                        />
                        <text
                            x={maxX + 5}
                            y={ly}
                            fill={textColor}
                            fontSize="9px"
                            alignmentBaseline="middle"
                            style={{ display: settings.extendRight ? 'none' : 'block' }}
                        >
                            {`${(lvl.level * 100).toFixed(1)}% (${yScale.invert(ly).toFixed(2)})`}
                        </text>
                    </React.Fragment>
                );
            })}

            {isSelected && !drawing.locked && (
                <>
                    <circle cx={x1} cy={y1} r={5} fill="white" stroke="#2962ff" strokeWidth={2} />
                    <circle cx={x2} cy={y2} r={5} fill="white" stroke="#2962ff" strokeWidth={2} />
                </>
            )}
        </g>
    );
};
