"use client";

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components.
ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

interface Coin {
  id: string;
  label: string;
  color: string;
}

const allCoins: Coin[] = [
  { id: "bitcoin", label: "BTC/USD", color: "#60A5FA" },
  { id: "ethereum", label: "ETH/USD", color: "#A78BFA" },
  { id: "litecoin", label: "LTC/USD", color: "#4ADE80" },
];

export function PriceChart() {
  const [chartData, setChartData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  // This state determines which coins are toggled on (displayed).
  const [selectedCoins, setSelectedCoins] = useState<string[]>(allCoins.map((coin) => coin.id));

  // Fetch market chart data for one coin.
  async function fetchCoinMarketChart(coinId: string) {
    const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`
    );
    const data = await response.json();
    return data.prices; // Returns an array of [timestamp, price]
  }

  async function fetchPriceData() {
    setIsFetching(true);
    try {
      // Fetch data for all coins concurrently.
      const results = await Promise.all(
          allCoins.map(async (coin) => {
            const prices = await fetchCoinMarketChart(coin.id);
            return { coinId: coin.id, prices };
          })
      );

      // Use the first coin's timestamps as the labels.
      const primaryPrices = results[0]?.prices || [];
      const labels = primaryPrices.map((point: number[]) => {
        const date = new Date(point[0]);
        return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`;
      });

      // Build datasets only for the coins that are selected.
      const datasets = results
          .filter((result) => selectedCoins.includes(result.coinId))
          .map((result) => {
            const coinInfo = allCoins.find((c) => c.id === result.coinId);
            const dataPoints = result.prices.map((point: number[]) => point[1]);
            return {
              label: coinInfo?.label,
              data: dataPoints,
              borderColor: coinInfo?.color,
              backgroundColor: coinInfo?.color,
              fill: false,
              tension: 0.1,
              pointRadius: 2,
            };
          });

      const updatedChartData = {
        labels,
        datasets,
      };

      setChartData(updatedChartData);
    } catch (error) {
      console.error("Error fetching market chart data:", error);
    } finally {
      setIsFetching(false);
    }
  }

  // Update data when selectedCoins change
  useEffect(() => {
    fetchPriceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoins]);

  // Refresh every minute.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPriceData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handler to toggle coins on/off.
  const handleToggleCoin = (coinId: string) => {
    setSelectedCoins((prev) =>
        prev.includes(coinId)
            ? prev.filter((id) => id !== coinId)
            : [...prev, coinId]
    );
  };

  return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between mb-4">
          <div className="text-blue-100 font-medium">Multi-Coin Price Chart</div>
          <div className="text-green-400">+2.45%</div>
        </div>

        {/* Toggle Controls */}
        <div className="mb-4 flex gap-4">
          {allCoins.map((coin) => (
              <label key={coin.id} className="flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={selectedCoins.includes(coin.id)}
                    onChange={() => handleToggleCoin(coin.id)}
                />
                <span className="text-blue-100">{coin.label}</span>
              </label>
          ))}
        </div>

        {/* Chart Display */}
        <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
          {isFetching || !chartData ? (
              <div className="text-center">
                <p className="text-blue-200/80 mb-2">Loading Price Chart Data</p>
                <p className="text-xs text-blue-300/60">
                  Please wait while we fetch the latest data.
                </p>
              </div>
          ) : (
              <Line data={chartData} />
          )}
        </div>

        {/* Time Range Controls (display only for now) */}
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
