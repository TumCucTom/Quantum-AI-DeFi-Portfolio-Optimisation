"use client";

import React from "react";

export function PriceChart() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">BTC/USD</div>
        <div className="text-green-400">+2.45%</div>
      </div>
      
      {/* Placeholder for the chart */}
      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-200/80 mb-2">Price Chart Data</p>
          <p className="text-xs text-blue-300/60">
            API integration will connect to cryptocurrency price data sources.
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-blue-200/70">
        <span>24h</span>
        <span>7d</span>
        <span>30d</span>
        <span>3m</span>
        <span>1y</span>
        <span>All</span>
      </div>
    </div>
  );
}