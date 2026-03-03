export interface AdrValues {
    adr1h: number; // R1 High
    adr1l: number; // S1 Low
    adr2h: number; // R2 High
    adr2l: number; // S2 Low
    adrUp2: number | null; // Secondary Resistance level based on mult2
    adrDn2: number | null; // Secondary Support level based on mult2
    open: number;
}

export interface CandleWithAdr extends Record<string, any> {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    adr?: AdrValues; // Will be attached per candle
}

function normalizeToSeconds(ts: number) {
    if (!ts) return 0;
    return ts > 10000000000 ? Math.floor(ts / 1000) : ts;
}

function getIstDateStr(ts: number) {
    const timestampSeconds = normalizeToSeconds(ts);
    const offsetDate = new Date(timestampSeconds * 1000 + (330 * 60 * 1000));
    return offsetDate.toISOString().split('T')[0];
}

export function calculateADRx2(candles: any[], p1 = 14, p2 = 7, mult2 = 0.25): CandleWithAdr[] {
    if (!candles || candles.length === 0) return [];

    // 1. Group by daily date string to compute Daily OHLC
    const dailyMap = new Map<string, { o: number; h: number; l: number; c: number }>();
    const datesOrdered: string[] = [];

    candles.forEach((c) => {
        c.time = normalizeToSeconds(c.time);
        const dStr = getIstDateStr(c.time);
        if (!dailyMap.has(dStr)) {
            datesOrdered.push(dStr);
            dailyMap.set(dStr, { o: c.open, h: c.high, l: c.low, c: c.close });
        } else {
            const day = dailyMap.get(dStr)!;
            day.h = Math.max(day.h, c.high);
            day.l = Math.min(day.l, c.low);
            day.c = c.close; // continuously updates as day goes
        }
    });

    // 2. Pre-calculate the prior days' ADR for each day, to prevent O(N^2)
    // We need SMA of high and SMA of low for past periods (p1, p2, p3)
    const dayAdrs = new Map<string, AdrValues>();

    for (let i = 0; i < datesOrdered.length; i++) {
        const todayStr = datesOrdered[i];
        const todaySummary = dailyMap.get(todayStr)!;

        // Find previous days available
        const pastDays: Array<{ o: number; h: number; l: number; c: number }> = [];
        // Walk backwards starting from yesterday
        for (let j = i - 1; j >= 0; j--) {
            pastDays.push(dailyMap.get(datesOrdered[j])!);
        }

        const getAdrs = (period: number) => {
            if (pastDays.length === 0) return 0; // Not enough data
            const lookback = pastDays.slice(0, period); // Take most recent `period` days
            const sumH = lookback.reduce((acc, obj) => acc + obj.h, 0);
            const sumL = lookback.reduce((acc, obj) => acc + obj.l, 0);

            const smaH = sumH / lookback.length;
            const smaL = sumL / lookback.length;

            return Math.max(0, smaH - smaL); // ADR is difference of SMA(high) and SMA(low)
        };
        const adr1 = getAdrs(p1);
        const adr2 = getAdrs(p2);

        const open = todaySummary.o; // exact today's actual open

        const adrUp2 = adr2 > 0 ? open + (adr2 * mult2) : null;
        const adrDn2 = adr2 > 0 ? open - (adr2 * mult2) : null;

        dayAdrs.set(todayStr, {
            open,
            adr1h: adr1 > 0 ? open + (adr1 / 2) : 0,
            adr1l: adr1 > 0 ? open - (adr1 / 2) : 0,
            adr2h: adr2 > 0 ? open + (adr2 / 2) : 0,
            adr2l: adr2 > 0 ? open - (adr2 / 2) : 0,
            adrUp2,
            adrDn2
        });
    }

    const volWindow: number[] = [];

    return candles.map((c, idx) => {
        const dStr = getIstDateStr(c.time);
        const adrVals = dayAdrs.get(dStr);

        // Find previous day's close
        const dateIdx = datesOrdered.indexOf(dStr);
        const prevDayStr = dateIdx > 0 ? datesOrdered[dateIdx - 1] : null;
        const prevClose = prevDayStr ? dailyMap.get(prevDayStr)!.c : c.open;

        // Rolling Volume (last 20)
        volWindow.push(c.volume || 0);
        if (volWindow.length > 20) volWindow.shift();
        const avgVol = volWindow.reduce((a, b) => a + b, 0) / volWindow.length;

        return {
            ...c,
            adr: adrVals,
            prevClose,
            avgVol
        };
    });
}
