"use client";

import React from "react";
import { X } from "lucide-react";
import { PriceChart } from "./widgets/price-chart";
import { PortfolioAllocation } from "./widgets/portfolio-allocation";
import { MarketSentiment } from "./widgets/market-sentiment";
import { TradeHistory } from "./widgets/trade-history";
import { CrossChainSwapChart} from "./widgets/chainswapping"

interface PanelProps {
  id: string;
  widgetType: string;
  gridColumn: string;
  gridRow: string;
  onRemove: () => void;
}

export function Panel({ id, widgetType, gridColumn, gridRow, onRemove }: PanelProps) {
  // Render the appropriate widget based on type
  const renderWidget = () => {
    switch (widgetType) {
      case "price-chart":
        return <PriceChart />;
      case "portfolio-allocation":
        return <PortfolioAllocation />;
      case "market-sentiment":
        return <MarketSentiment />;
      case "trade-history":
        return <TradeHistory />;
      case "chainswapping":
        return <CrossChainSwapChart/>
      default:
        return <div className="flex items-center justify-center h-full">Widget type not supported</div>;
    }
  };

  return (
    <div
      className="relative bg-blue-900/20 backdrop-blur-sm border border-blue-400/20 rounded-lg overflow-hidden"
      style={{ gridColumn, gridRow }}
    >
      {/* Panel header */}
      <div className="p-3 border-b border-blue-400/20 flex justify-between items-center bg-blue-900/30">
        <h3 className="text-sm font-medium text-blue-100">
          {widgetType === "price-chart" && "Price Chart"}
          {widgetType === "portfolio-allocation" && "Portfolio Allocation"}
          {widgetType === "market-sentiment" && "Market Sentiment"}
          {widgetType === "trade-history" && "Trade History"}
        </h3>
        <button 
          onClick={onRemove}
          className="p-1 rounded-full hover:bg-blue-800/40 text-blue-300/60 hover:text-blue-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel content */}
      <div className="p-4 h-[calc(100%-40px)]">
        {renderWidget()}
      </div>
    </div>
  );
}