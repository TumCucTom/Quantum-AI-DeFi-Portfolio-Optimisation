"use client";

import React from "react";
import { X } from "lucide-react";
import { PriceChart } from "./widgets/price-chart";
import { PortfolioAllocation } from "./widgets/portfolio-allocation";
import { MarketSentiment } from "./widgets/market-sentiment";
import { TradeHistory } from "./widgets/trade-history";
import { CrossChainSwapChart } from "./widgets/cross-chain";

interface PanelProps {
  id: string;
  widgetType: string;
  gridColumn: string;
  gridRow: string;
  onRemove: () => void;
}

const widgetTitles: Record<string, string> = {
  "cross-chain": "Cross Chain Token Swap",
  "market-sentiment": "Market Sentiment",
  "portfolio-allocation": "Portfolio Allocation",
  "price-chart": "Price Chart",
  "trade-history": "Trade History",
  "ai-chat": "AI Chat",
};


export function Panel({ id, widgetType, gridColumn, gridRow, onRemove }: PanelProps) {
  // If a matching title isn't found, default to the widgetType or another fallback
  const panelTitle = widgetTitles[widgetType] || widgetType;

  // Helper function to render the appropriate widget
  function renderWidget() {
    switch (widgetType) {
      case "Cross chain swap":
        return <CrossChainSwapChart />;
      case "market-sentiment":
        return <MarketSentiment />;
      case "portfolio-allocation":
        return (
            <PortfolioAllocation
                walletAddress="0x123...abc"
                apiKey={process.env.NEXT_PUBLIC_INFURA_KEY!}
            />
        );
      case "price-chart":
        return <PriceChart />;
      case "trade-history":
        return <TradeHistory />;
      default:
        return <div>Unknown Widget</div>;
    }
  }

  return (
    <div
      style={{ gridColumn, gridRow }}
      className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col"
    >
      {/* Panel header */}
      <div className="p-2 bg-gray-800 flex items-center justify-between">
        <div className="font-medium text-white">
          {/* Use our panelTitle variable here */}
          {panelTitle}
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Panel content */}
      <div className="p-4 flex-grow">
        {renderWidget()}
      </div>
    </div>
  );
}
