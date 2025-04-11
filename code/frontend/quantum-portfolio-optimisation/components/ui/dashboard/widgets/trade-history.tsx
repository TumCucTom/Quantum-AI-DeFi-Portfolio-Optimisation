"use client";

import React from "react";

export function TradeHistory() {
  const trades = [
    { id: 1, type: "BUY", asset: "BTC", amount: "0.05", price: "$29,345.67", time: "10:23 AM" },
    { id: 2, type: "SELL", asset: "ETH", amount: "0.75", price: "$1,845.22", time: "Yesterday" },
    { id: 3, type: "BUY", asset: "SOL", amount: "5.3", price: "$21.34", time: "2 days ago" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">Recent Transactions</div>
      </div>
      
      {/* Trade list */}
      <div className="flex-grow overflow-y-auto">
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.map((trade) => (
              <div key={trade.id} className="p-2 bg-blue-900/10 border border-blue-400/10 rounded-md flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${trade.type === "BUY" ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                    {trade.type}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-blue-100">{trade.asset}</div>
                    <div className="text-xs text-blue-200/70">{trade.amount} @ {trade.price}</div>
                  </div>
                </div>
                <div className="text-xs text-blue-200/60">{trade.time}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-blue-900/10 rounded-md border border-blue-400/10 p-4">
            <div className="text-center">
              <p className="text-blue-200/80 mb-2">No Recent Trades</p>
              <p className="text-xs text-blue-300/60">
                Transaction history will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          View All Transactions →
        </button>
      </div>
    </div>
  );
}