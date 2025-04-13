"use client";

import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";

import {
  CandlestickController,
  CandlestickElement
} from 'chartjs-chart-financial';


// Register Chart.js components and financial chart types
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    CandlestickController,
    CandlestickElement
);


// Register date adapter
import "chartjs-adapter-date-fns";

// ✅ Import the React wrapper last, using an alias to avoid name collision
import { Chart as ReactChart } from "react-chartjs-2";

export function MarketSentiment() {
  const [chartData, setChartData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function fetchMarketData() {
      setIsFetching(true);
      try {
        // Fetch 1h interval candlestick data for BTC/USDT for the past 24 hours.
        const res = await fetch(
          "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24"
        );
        const data = await res.json();
        // Transform Binance response to the format required by chartjs-chart-financial.
        // Each element: [openTime, open, high, low, close, volume, ...]
        const candlestickData = data.map((item: any[]) => ({
          x: new Date(item[0]),      // Open time (in milliseconds).
          o: parseFloat(item[1]),      // Open price.
          h: parseFloat(item[2]),      // High price.
          l: parseFloat(item[3]),      // Low price.
          c: parseFloat(item[4]),      // Close price.
        }));

        const dataObject = {
          // Labels are optional when the dataset has its own x-values.
          labels: candlestickData.map((point: { x: any; }) => point.x),
          datasets: [
            {
              label: "BTC/USDT Candlestick",
              data: candlestickData,
              borderColor: "#60A5FA",
              // Color configuration for candlesticks.
              color: {
                up: "#00FF00",         // When close > open.
                down: "#FF0000",       // When close < open.
                unchanged: "#999999",  // When no change.
              },
            },
          ],
        };

        setChartData(dataObject);
      } catch (error) {
        console.error("Error fetching candlestick data:", error);
      } finally {
        setIsFetching(false);
      }
    }
    fetchMarketData();
  }, []);

  // Chart options to configure time scales and tooltips.
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "nearest", intersect: false } // ✅ Valid for candlestick
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "hour",
          tooltipFormat: "MMM d, hA",
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">Market Sentiment</div>
        <div className="text-green-400">Bullish</div>
      </div>

      {/* Candlestick Chart Display */}
      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
        {isFetching || !chartData ? (
          <div className="text-center">
            <p className="text-blue-200/80 mb-2">Loading candlestick data...</p>
            <p className="text-xs text-blue-300/60">
              Please wait while we fetch the latest market data.
            </p>
          </div>
        ) : (
            <ReactChart type="candlestick" data={chartData} options={options} />
        )}
      </div>

      {/* Sentiment Metrics */}
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
