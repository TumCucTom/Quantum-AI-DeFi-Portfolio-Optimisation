"use client";

import React from "react";
import { X, LineChart, PieChart, BarChart3, Clock, ArrowRightLeft } from "lucide-react";

interface WidgetMenuProps {
  onSelectWidget: (widgetType: string, widgetName: string) => void;
  onClose: () => void;
}

export function WidgetMenu({ onSelectWidget, onClose }: WidgetMenuProps) {
  const widgets = [
    {
      type: "price-chart",
      name: "Price Chart",
      description: "Real-time price chart for cryptocurrencies",
      icon: <LineChart className="h-10 w-10 text-blue-400" />,
    },
    {
      type: "portfolio-allocation",
      name: "Portfolio Allocation",
      description: "View your asset allocation and balance",
      icon: <PieChart className="h-10 w-10 text-blue-400" />,
    },
    {
      type: "market-sentiment",
      name: "Market Sentiment",
      description: "AI-powered market sentiment analysis",
      icon: <BarChart3 className="h-10 w-10 text-blue-400" />,
    },
    {
      type: "trade-history",
      name: "Trade History",
      description: "Recent trades and transaction history",
      icon: <Clock className="h-10 w-10 text-blue-400" />,
    },
    {
      type: "cross-chain",
      name: "Cross Chain Token Swap",
      description: "Swap tokens across chains through wormhole",
      icon: <ArrowRightLeft className="h-10 w-10 text-blue-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#001020] border border-blue-400/20 rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        {/* Menu header */}
        <div className="p-4 border-b border-blue-400/20 flex justify-between items-center">
          <h2 className="text-xl font-bold quantum-title">Add Widget</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blue-800/40 text-blue-300/60 hover:text-blue-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Widget options */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {widgets.map((widget) => (
            <button
              key={widget.type}
              className={`p-4 border border-blue-400/20 rounded-lg bg-blue-900/20 hover:bg-blue-900/30 transition-colors flex items-start text-left ${
                widget.type === "cross-chain" ? "md:col-span-2" : ""
              }`}
              onClick={() => onSelectWidget(widget.type, widget.name)}
            >
              <div className="mr-4 p-2 bg-blue-900/30 rounded-lg border border-blue-400/20">
                {widget.icon}
              </div>
              <div>
                <h3 className="font-medium text-blue-100">{widget.name}</h3>
                <p className="text-sm text-blue-200/70 mt-1">{widget.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* API Note */}
        <div className="p-4 border-t border-blue-400/20 text-sm text-blue-200/60">
          <p>NEED TO CONNECT TO API FOR REAL DATA</p>
        </div>
      </div>
    </div>
  );
}
