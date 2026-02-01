"use client";

import React from "react";
import * as d3 from "d3";
import { Drawing } from "@/types/chart";
import { TrendlineRenderer } from "./TrendlineRenderer";
import { RectangleRenderer } from "./RectangleRenderer";
import { LineRenderer } from "./LineRenderer";
import { FibonacciRenderer } from "./FibonacciRenderer";
import { PriceRangeRenderer } from "./PriceRangeRenderer";

interface DrawingRendererProps {
    drawing: Drawing;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    chartWidth: number;
    chartHeight: number;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onDragStart: (id: number, type: 'point' | 'whole', pointIndex?: 1 | 2, e?: React.MouseEvent) => void;
    theme: string;
    textColor: string;
    baseTime: number;
    step: number;
}

export const DrawingRenderer: React.FC<DrawingRendererProps> = (props) => {
    const { drawing } = props;

    switch (drawing.type) {
        case 'trendline':
        case 'ray':
        case 'arrow':
            return <TrendlineRenderer {...props} />;

        case 'rectangle':
            return <RectangleRenderer {...props} />;

        case 'horizontalLine':
        case 'verticalLine':
            return <LineRenderer {...props} />;

        case 'fibonacci':
            return <FibonacciRenderer {...props} />;

        case 'priceRange':
            return <PriceRangeRenderer {...props} />;

        default:
            return null;
    }
};
