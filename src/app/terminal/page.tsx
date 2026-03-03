"use client";

import React, { useState } from "react";
import ZenithTerminal, { WatchlistItem } from "@/components/Chart/ZenithTerminal";
import { Position, OptionStrike } from "@/types/terminal";

import { useTradingStore } from "@/stores/tradingStore";
import { OHLCV, DEFAULT_CHART_SETTINGS } from "@/types/chart";
import { getSymbolConfig } from "@/lib/dhan/symbols";
import { calculateADRx2 } from "@/lib/indicator/adrIndicator";

/**
 * Static dummy data for the terminal.
 * In a real application, this would be fetched from an API.
 */
const STATIC_WATCHLIST: WatchlistItem[] = [

];

const STATIC_POSITIONS: Position[] = [
];

const STATIC_OPTION_CHAIN: OptionStrike[] = Array.from({ length: 21 }, (_, i) => {
  const strike = 22000 + (i * 50);
  return {
    strike,
    ce: { ltp: 240 - i * 10, change: 12.5, oi: 25.4, volume: 5.2, iv: 12.4 },
    pe: { ltp: 50 + i * 8, change: -8.2, oi: 18.9, volume: 3.1, iv: 14.8 }
  };
});

export default function Home() {
  // We now use a static set of data without real-time ticker updates
  const {
    isAuthenticated,
    isConnected,
    dhanConfig,
    brokerCredentials,
    activeBroker,
    watchlists,
    activeSymbol,
    setSymbol: setGlobalSymbol,
    terminalSettings,
    updateTerminalSettings,
    chartSettings
  } = useTradingStore();
  const [data, setData] = useState<OHLCV[]>([]);
  const [symbol, setSymbol] = useState(activeSymbol || "NIFTY");
  const [interval, setIntervalVal] = useState(terminalSettings.interval || "1m");
  const [isLoading, setIsLoading] = useState(false);

  // Date Range state
  const [fromDate, setFromDate] = useState<string>(terminalSettings.fromDate);
  const [toDate, setToDate] = useState<string>(terminalSettings.toDate);

  // Sync local symbol with global activeSymbol
  React.useEffect(() => {
    console.log("Global activeSymbol changed to:", activeSymbol, "Current local symbol:", symbol);
    if (activeSymbol && activeSymbol !== symbol) {
      setSymbol(activeSymbol);
    }
  }, [activeSymbol, symbol]);

  const fetchHistoricalData = React.useCallback(async (sym: string, int: string, from: string, to: string) => {
    console.log("fetchHistoricalData called with sym:", sym, "int:", int);
    const hasAuth = isAuthenticated || isConnected || !!brokerCredentials;

    // We allow fetching if config or broker credentials exist
    const finalConfig = dhanConfig || brokerCredentials;
    const finalBroker = activeBroker || (finalConfig ? 'dhan' : null);

    console.log("Auth Status:", { hasAuth, activeBroker: finalBroker, hasFinalConfig: !!finalConfig });

    if (!hasAuth || finalBroker !== 'dhan' || !finalConfig) {
      console.warn("Fetch blocked -> Not connected to Dhan or not authenticated!");
      // Fallback to empty if not connected
      setData([]);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Try to find in SYMBOL_MAP (Static/Legacy)
      let symbolConfig = getSymbolConfig(sym);

      // 2. If not found, try to find in current watchlist items
      if (!symbolConfig) {
        for (const group of watchlists) {
          const item = group.items.find(i => i.symbol === sym);
          if (item && item.securityId && item.segment) {
            symbolConfig = {
              id: item.securityId,
              segment: item.segment,
              type: item.instrumentType || (item.segment.includes('EQ') ? 'EQUITY' : (item.segment.includes('IDX') ? 'INDEX' : 'OPTION'))
            };
            break;
          }
        }
      }

      if (!symbolConfig) {
        console.warn("Symbol config not found for", sym);
        setData([]); // Fallback to empty
        setIsLoading(false);
        return;
      }
      // Calculate requested dates
      let finalFromDate = from || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let finalToDate = to || new Date().toISOString().split('T')[0];

      const isIntraday = int.includes('m') || int.includes('h') || !isNaN(Number(int));

      // Buffer the fetch by 20 calendar days securely to allow 14-trading-day ADR Indicator to warm up!
      const fetchFromDateObj = new Date(finalFromDate);
      fetchFromDateObj.setDate(fetchFromDateObj.getDate() - 20);
      const apiFromDate = fetchFromDateObj.toISOString().split('T')[0];

      if (isIntraday) {
        // Enforce max 90 days limit for Dhan Intraday INCLUDING the 20 day warmup buffer
        const apiFromD = new Date(apiFromDate);
        const toD = new Date(finalToDate);
        const diffTime = toD.getTime() - apiFromD.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays > 89) {
          console.warn(`Intraday chart restricted to 90 days (inc warmup). Adjusting toDate down.`);
          const newTo = new Date(apiFromD);
          newTo.setDate(newTo.getDate() + 89);
          finalToDate = newTo.toISOString().split('T')[0];
        }
      }

      const payload = {
        clientId: finalConfig.clientId,
        accessToken: finalConfig.accessToken,
        securityId: symbolConfig.id,
        exchangeSegment: symbolConfig.segment,
        instrument: (symbolConfig.segment === 'IDX_I' || symbolConfig.type === 'INDEX') ? 'INDEX' :
          (symbolConfig.segment.includes('FNO') || symbolConfig.type === 'OPTION') ? 'OPTIDX' : 'EQUITY',
        expiryCode: 0,
        fromDate: apiFromDate,
        toDate: finalToDate
      };

      const endpoint = isIntraday ? '/api/dhan/intraday' : '/api/dhan/historical';

      console.log("Fetching Historical Data Endpoint:", endpoint);
      console.log("Payload:", { ...payload, interval: int });

      // Map interval to Dhan format (1, 5, 15, 60, etc)
      let dhanInterval = int;
      if (int === '1m') dhanInterval = '1';
      else if (int === '5m') dhanInterval = '5';
      else if (int === '15m') dhanInterval = '15';
      else if (int === '1h') dhanInterval = '60';
      else if (int === 'D') dhanInterval = 'D';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ ...payload, interval: dhanInterval }),
        headers: { 'Content-Type': 'application/json' }
      });

      const json = await res.json();
      console.log("API Response:", json);

      if (json.success && Array.isArray(json.data)) {
        // Clean out blank/illiquid candles populated by the API (0 price)
        const validCandles = json.data.filter((c: any) => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0 && c.time > 0);

        // Hydrate data with ADR indicators utilizing the 20-day buffer
        const adrConf = chartSettings.indicators?.adr || DEFAULT_CHART_SETTINGS.indicators.adr;
        const { p1, p2, mult2 } = adrConf;
        const enrichedData = calculateADRx2(validCandles, p1, p2, mult2);

        // Trim back the 20-day buffer from the view exactly to the user's requested finalFromDate
        const requestedStartTs = new Date(finalFromDate).getTime();

        // Note: some indicator logic depends on daily mapping, so trimming here doesn't break values already mapped to candles
        let trimmedData = enrichedData;
        if (enrichedData.length > 0) {
          // Finding index of first candle that falls on or after finalFromDate
          // fallback timestamp keys are handled in the API response format
          const startIndex = enrichedData.findIndex((c: any) => {
            const candleTs = c.time * 1000; // API usually feeds epoch seconds but lets guarantee Date comparison natively
            return c.time.toString().includes('-') ? new Date(c.time).getTime() >= requestedStartTs : new Date(c.time * 1000).getTime() >= requestedStartTs;
          });

          if (startIndex !== -1) {
            trimmedData = enrichedData.slice(startIndex);
          }
        }

        setData(trimmedData as any);
      } else {
        console.warn("No data returned from Dhan API. Reason:", json.error || "Unknown");
        setData([]);
      }

    } catch (e) {
      console.error("Failed to fetch historical data", e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isConnected, activeBroker, dhanConfig, brokerCredentials, watchlists]);

  const handleSymbolChange = React.useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
    setGlobalSymbol(newSymbol);
  }, [setGlobalSymbol]);

  const handleIntervalChange = React.useCallback((newInterval: string) => {
    setIntervalVal(newInterval);
    updateTerminalSettings({ interval: newInterval });
  }, [updateTerminalSettings]);

  const handleFromDateChange = React.useCallback((date: string) => {
    setFromDate(date);
    updateTerminalSettings({ fromDate: date });
  }, [updateTerminalSettings]);

  const handleToDateChange = React.useCallback((date: string) => {
    setToDate(date);
    updateTerminalSettings({ toDate: date });
  }, [updateTerminalSettings]);

  // Initial fetch when auth changes or mount
  React.useEffect(() => {
    const isReady = isAuthenticated || isConnected;
    console.log("useEffect triggered for fetch. isReady:", isReady, "symbol:", symbol, "interval:", interval);

    // We fetch even if NOT authenticated so we can at least gracefully empty the chart or show mock data
    // The fetchHistoricalData function already checks `if (!hasAuth || ...)` and exits cleanly if missing auth
    const timer = setTimeout(() => {
      fetchHistoricalData(symbol, interval, fromDate, toDate);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [isAuthenticated, isConnected, symbol, interval, fromDate, toDate, fetchHistoricalData]);

  // Real-time chart updates
  // Real-time chart updates removed as per user request to avoid frequent re-renders.
  // The LTP line is still updated via the livePrice prop.

  return (
    <ZenithTerminal
      data={data}
      symbol={symbol}
      watchlist={STATIC_WATCHLIST}
      positions={STATIC_POSITIONS}
      optionChain={STATIC_OPTION_CHAIN}
      activeInterval={interval}
      onSymbolChange={handleSymbolChange}
      onIntervalChange={handleIntervalChange}
      isLoading={isLoading}
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={handleFromDateChange}
      onToDateChange={handleToDateChange}
      headerTitle="Institutional Suite"
    />
  );
}
