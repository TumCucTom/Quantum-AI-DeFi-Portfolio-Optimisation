"use client";

import React from "react";

export function MarketSentiment() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">Market Sentiment</div>
        <div className="text-green-400">Bullish</div>
      </div>
      
      {/* Placeholder for the sentiment chart */}
      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-200/80 mb-2">Sentiment Analysis</p>
          <p className="text-xs text-blue-300/60">
            AI-powered market sentiment analysis from social media and news sources.
          </p>
        </div>
      </div>
      
      {/* Sentiment metrics */}
      <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
        <div className="flex items-center">
          <span className="text-blue-200/70">Sentiment Score:</span>
        </div>
        <div className="text-right">
          <span className="text-green-400">78/100</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-blue-200/70">24h Change:</span>
        </div>
        <div className="text-right">
          <span className="text-green-400">+5.3%</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-blue-200/70">News Impact:</span>
        </div>
        <div className="text-right">
          <span className="text-yellow-400">Neutral</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-blue-200/70">Social Media:</span>
        </div>
        <div className="text-right">
          <span className="text-green-400">Positive</span>
        </div>
      </div>
    </div>
  );
}