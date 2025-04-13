"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface SwapStep {
  label: string;
  status: "pending" | "in-progress" | "done";
}

const tokenOptions = ["USDC", "ETH", "DAI"];

export function CrossChainSwapChart() {
  const [steps, setSteps] = useState<SwapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("ETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSwapSteps() {
      try {
        const res = await fetch("http://localhost:8000/crosschain/status");
        const data = await res.json();

        if (data.steps) {
          setSteps(data.steps);
        } else {
          throw new Error("No 'steps' in response");
        }
      } catch (err: any) {
        console.error("Failed to load swap data", err);
        setError("Failed to load swap data");
      } finally {
        setLoading(false);
      }
    }

    fetchSwapSteps();

    const interval = setInterval(fetchSwapSteps, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchConversionRate() {
      if (fromToken === toToken) {
        setConversionRate(1);
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/price?from=${fromToken}&to=${toToken}`);
        const data = await res.json();
        if (data.price) {
          setConversionRate(data.price);
        }
      } catch (err) {
        console.error("Failed to fetch conversion rate");
        setConversionRate(null);
      }
    }

    fetchConversionRate();
  }, [fromToken, toToken]);

  useEffect(() => {
    if (conversionRate && amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        setConvertedAmount(parsedAmount * conversionRate);
      }
    } else {
      setConvertedAmount(null);
    }
  }, [conversionRate, amount]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4 items-center">
        <div className="flex gap-2">
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="bg-blue-950 text-blue-100 border border-blue-400/30 px-2 py-1 rounded"
          >
            {tokenOptions.map((token) => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
          <span className="text-blue-300">→</span>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="bg-blue-950 text-blue-100 border border-blue-400/30 px-2 py-1 rounded"
          >
            {tokenOptions.map((token) => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>
        <div className="text-blue-400 text-sm">Cross chain swap via Wormhole</div>
      </div>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Your wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full bg-blue-950 text-blue-100 border border-blue-400/30 px-3 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Amount to swap"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-blue-950 text-blue-100 border border-blue-400/30 px-3 py-2 rounded"
        />
        {convertedAmount !== null && (
          <div className="text-sm text-blue-200">
            ≈ {convertedAmount.toFixed(4)} {toToken} (1 {fromToken} ≈ {conversionRate?.toFixed(4)} {toToken})
          </div>
        )}
      </div>

      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex flex-col justify-center gap-4">
        {loading ? (
          <div className="text-blue-300 text-center text-sm">Loading swap status...</div>
        ) : error ? (
          <div className="text-red-400 text-center text-sm">{error}</div>
        ) : (
          steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {step.status === "done" && <CheckCircle className="text-green-400 w-5 h-5" />} 
              {step.status === "in-progress" && <Loader2 className="animate-spin text-yellow-400 w-5 h-5" />} 
              {step.status === "pending" && <div className="w-5 h-5 rounded-full border border-blue-400/40" />} 
              <span
                className={`text-sm ${
                  step.status === "done"
                    ? "text-green-300"
                    : step.status === "in-progress"
                    ? "text-yellow-300"
                    : "text-blue-300/50"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-blue-200/70 text-center">
        Powered by Wormhole Protocol
      </div>
    </div>
  );
}
