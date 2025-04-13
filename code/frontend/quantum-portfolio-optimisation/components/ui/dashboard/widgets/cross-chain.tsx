"use client";

import React from "react";

export function CrossChainTokenSwap() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="text-blue-100 font-medium">Cross Chain Token Swap</div>
        <div className="text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.836 0H20V4m0 0l-6 6m6-6l-6 6m0 8v5h-.582m-15.836 0H4v-5m0 5l6-6m-6 6l6-6"
            />
          </svg>
        </div>
      </div>

      {/* Placeholder for the swap action panel */}
      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-blue-200/80 mb-2">Swap Your Tokens</p>
          <p className="text-xs text-blue-300/60">
            Seamlessly swap assets across multiple blockchains.
          </p>
          <div className="mt-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Swap Now
            </button>
          </div>
        </div>
      </div>

      {/* Swap details */}
      <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
        <div className="flex items-center">
          <span className="text-blue-200/70">From:</span>
        </div>
        <div className="text-right">
          <span className="text-green-400">Ethereum</span>
        </div>

        <div className="flex items-center">
          <span className="text-blue-200/70">To:</span>
        </div>
        <div className="text-right">
          <span className="text-green-400">Binance Smart Chain</span>
        </div>

        <div className="flex items-center">
          <span className="text-blue-200/70">Fee:</span>
        </div>
        <div className="text-right">
          <span className="text-yellow-400">0.1%</span>
        </div>

        <div className="flex items-center">
          <span className="text-blue-200/70">Slippage:</span>
        </div>
        <div className="text-right">
          <span className="text-yellow-400">±0.5%</span>
        </div>
      </div>
    </div>
  );
}
