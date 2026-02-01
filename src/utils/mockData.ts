import { OHLCV } from "../types/chart";

export function generateMockData(count: number = 200, interval: string = "5m"): OHLCV[] {
    const data: OHLCV[] = [];

    // Determine step in seconds
    let step = 60;
    if (interval === "5m") step = 300;
    else if (interval === "15m") step = 900;
    else if (interval === "1h") step = 3600;
    else if (interval === "D") step = 86400;

    let currentPrice = 18000;
    let currentTime = Math.floor(Date.now() / 1000) - count * step;

    for (let i = 0; i < count; i++) {
        const volatility = 20;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        const volume = Math.floor(Math.random() * 100000);

        data.push({
            time: currentTime,
            open,
            high,
            low,
            close,
            volume,
        });

        currentPrice = close;
        currentTime += step;
    }

    return data;
}

export function generateNextCandle(lastCandle: OHLCV): OHLCV {
    const volatility = 20;
    const open = lastCandle.close;
    const change = (Math.random() - 0.5) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * (volatility / 2);
    const low = Math.min(open, close) - Math.random() * (volatility / 2);
    const volume = Math.floor(Math.random() * 100000);

    return {
        time: lastCandle.time + 60,
        open,
        high,
        low,
        close,
        volume,
    };
}

export function updateLastCandle(lastCandle: OHLCV): OHLCV {
    const volatility = 5;
    const change = (Math.random() - 0.2) * volatility; // Slight bias
    const newClose = lastCandle.close + change;

    return {
        ...lastCandle,
        close: newClose,
        high: Math.max(lastCandle.high, newClose),
        low: Math.min(lastCandle.low, newClose),
    };
}
