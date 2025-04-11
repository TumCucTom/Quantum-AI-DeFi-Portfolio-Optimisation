"use client";

import React from "react";

export function PortfolioAllocation() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">Portfolio Value</div>
        <div className="text-blue-100">$24,583.45</div>
      </div>
      
      {/* Placeholder for the pie chart */}
      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-200/80 mb-2">Portfolio Distribution</p>
          <p className="text-xs text-blue-300/60">
            API integration will display your portfolio allocation across different assets.
          </p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
          <span className="text-blue-200/70">BTC (45%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
          <span className="text-blue-200/70">ETH (30%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
          <span className="text-blue-200/70">USDC (15%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
          <span className="text-blue-200/70">Other (10%)</span>
        </div>
      </div>
    </div>
  );
}