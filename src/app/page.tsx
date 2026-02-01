"use client";

import React, { useState } from "react";
import ZenithTerminal, { WatchlistItem } from "@/components/Chart/ZenithTerminal";
import { Position, OptionStrike } from "@/types/terminal";
import { generateMockData } from "@/utils/mockData";

/**
 * Static dummy data for the terminal.
 * In a real application, this would be fetched from an API.
 */
const STATIC_WATCHLIST: WatchlistItem[] = [
  { symbol: "NIFTY 50", price: "22,123.40", change: "+0.85%", isUp: true, exchange: "NSE" },
  { symbol: "BANK NIFTY", price: "46,500.20", change: "-0.20%", isUp: false, exchange: "NSE" },
  { symbol: "RELIANCE", price: "2,540.20", change: "+1.24%", isUp: true, exchange: "NSE" },
  { symbol: "TCS", price: "3,421.05", change: "-0.42%", isUp: false, exchange: "NSE" },
  { symbol: "HDFC BANK", price: "1,650.00", change: "+0.81%", isUp: true, exchange: "NSE" },
  { symbol: "INFOSYS", price: "1,420.30", change: "+2.10%", isUp: true, exchange: "NSE" },
  { symbol: "ICICI BANK", price: "910.45", change: "-0.23%", isUp: false, exchange: "NSE" },
];

const STATIC_POSITIONS: Position[] = [
  { symbol: "NIFTY 50", qty: 50, entryPrice: 22100.50, currentPrice: 22123.40, pnl: 1145.00, pnlPercent: 0.10, type: 'BUY', status: 'ACTIVE' },
  { symbol: "RELIANCE", qty: 100, entryPrice: 2520.00, currentPrice: 2540.20, pnl: 2020.00, pnlPercent: 0.80, type: 'BUY', status: 'ACTIVE' },
  { symbol: "TCS", qty: 25, entryPrice: 3450.00, currentPrice: 3421.05, pnl: -723.75, pnlPercent: -0.84, type: 'BUY', status: 'ACTIVE' },
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
  const [data, setData] = useState(() => generateMockData(300, "5m"));
  const [symbol, setSymbol] = useState("NIFTY");
  const [interval, setIntervalVal] = useState("5m");
  const [isLoading, setIsLoading] = useState(false);

  const handleSymbolChange = (newSymbol: string) => {
    setIsLoading(true);
    setSymbol(newSymbol);

    // Simulate a network request for static data of the new symbol
    setTimeout(() => {
      setData(generateMockData(300, interval));
      setIsLoading(false);
    }, 600);
  };

  const handleIntervalChange = (newInterval: string) => {
    setIsLoading(true);
    setIntervalVal(newInterval);

    // Simulate a network request for the new timeframe
    setTimeout(() => {
      setData(generateMockData(300, newInterval));
      setIsLoading(false);
    }, 400);
  };

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
      headerTitle="Institutional Suite"
    />
  );
}
