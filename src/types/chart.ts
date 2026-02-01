export interface OHLCV {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ChartDimensions {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

export type DrawingType = 'trendline' | 'horizontalLine' | 'verticalLine' | 'ray' | 'arrow' | 'fibonacci' | 'rectangle' | 'priceRange';
export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface Drawing {
    t1: string;
    p1: number;
    t2?: string;
    p2?: number;
    id: number;
    type: DrawingType;
    color: string;
    width: number;
    style: LineStyle;
    locked: boolean;
    opacity: number;
    extendLeft?: boolean;
    extendRight?: boolean;
    showStats?: boolean;
    fibSettings?: {
        levels: { level: number, color: string, visible: boolean }[];
        showBackground: boolean;
        extendLeft: boolean;
        extendRight: boolean;
    };
}
export interface ToolbarConfig {
    showLock?: boolean;
    showColor?: boolean;
    showWidth?: boolean;
    showStyle?: boolean;
    showExtend?: boolean;
    showStats?: boolean;
    showSettings?: boolean;
    showDelete?: boolean;
    showPrice1?: boolean;
    showPrice2?: boolean;
}

export const TOOL_CONFIGS: Record<DrawingType, ToolbarConfig> = {
    trendline: { showLock: true, showColor: true, showWidth: true, showStyle: true, showExtend: true, showStats: true, showSettings: true, showDelete: true, showPrice1: true, showPrice2: true },
    horizontalLine: { showLock: true, showColor: true, showWidth: true, showStyle: true, showSettings: true, showDelete: true, showPrice1: true },
    verticalLine: { showLock: true, showColor: true, showWidth: true, showStyle: true, showSettings: true, showDelete: true, showPrice1: false }, // Vertical doesn't need price
    ray: { showLock: true, showColor: true, showWidth: true, showStyle: true, showSettings: true, showDelete: true, showPrice1: true, showPrice2: true },
    arrow: { showLock: true, showColor: true, showWidth: true, showStyle: true, showExtend: true, showSettings: true, showDelete: true, showPrice1: true, showPrice2: true },
    fibonacci: { showLock: true, showColor: true, showSettings: true, showDelete: true, showPrice1: true, showPrice2: true },
    rectangle: { showLock: true, showColor: true, showWidth: true, showStyle: true, showExtend: true, showSettings: true, showDelete: true, showPrice1: true, showPrice2: true },
    priceRange: { showLock: true, showDelete: true },
};
export interface ChartSettings {
    symbol: {
        upColor: string;
        downColor: string;
        borderUpColor: string;
        borderDownColor: string;
        wickUpColor: string;
        wickDownColor: string;
    };
    appearance: {
        background: string;
        gridColor: string;
        gridVisible: boolean;
        vertGridVisible: boolean;
        horzGridVisible: boolean;
        watermarkVisible: boolean;
        watermarkOpacity: number;
        watermarkSize: number;
        crosshairVisible: boolean;
        legendVisible: boolean;
    };
    scales: {
        textColor: string;
        fontSize: number;
    };
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
    symbol: {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    },
    appearance: {
        background: '#131722',
        gridColor: '#2d3436',
        gridVisible: true,
        vertGridVisible: true,
        horzGridVisible: true,
        watermarkVisible: true,
        watermarkOpacity: 5,
        watermarkSize: 8,
        crosshairVisible: true,
        legendVisible: true,
    },
    scales: {
        textColor: '#9ca3af',
        fontSize: 11,
    }
};
