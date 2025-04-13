"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

const tokenOptions = ["USDC", "WETH", "DAI"];

export function CrossChainSwapChart() {
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("WETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [conversion, setConversion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversion rate when fromToken, toToken, or amount changes
  useEffect(() => {
    async function fetchConversionRate() {
      if (!amount || !fromToken || !toToken || fromToken === toToken) {
        setConversion(null);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8000/price?from_token=${fromToken}&to_token=${toToken}`
        );
        const data = await res.json();

        if (data.price) {
          const result = (parseFloat(amount) * data.price).toFixed(6);
          setConversion(`${amount} ${fromToken} ≈ ${result} ${toToken}`);
        } else {
          setConversion("Conversion unavailable");
        }
      } catch (err) {
        console.error("Price fetch failed", err);
        setConversion("Conversion error");
      } finally {
        setLoading(false);
      }
    }

    fetchConversionRate();
  }, [fromToken, toToken, amount]);

  return (
    <div className="h-full flex flex-col">
      {/* Header Label */}
      <div className="text-blue-400 text-sm mb-2 text-center">
        Cross chain swap via Wormhole
      </div>

      {/* Title */}

      {/* Token Select */}
      <div className="flex justify-center gap-2 mb-4">
        <select
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          className="bg-blue-950 text-blue-100 border border-blue-400/30 px-2 py-1 rounded"
        >
          {tokenOptions.map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
        <span className="text-blue-300">→</span>
        <select
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          className="bg-blue-950 text-blue-100 border border-blue-400/30 px-2 py-1 rounded"
        >
          {tokenOptions.map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
      </div>

      {/* Input Fields */}
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
      </div>

      {/* Conversion Output */}
      {conversion && (
        <div className="mb-4 text-center text-sm text-blue-200">
          {loading ? (
            <span className="flex justify-center items-center gap-1 text-yellow-300">
              <Loader2 className="animate-spin h-4 w-4" /> Calculating...
            </span>
          ) : (
            conversion
          )}
        </div>
      )}

      {/* Powered By */}
      <div className="mt-auto text-xs text-blue-200/70 text-center">
        Powered by Wormhole Protocol
      </div>
    </div>
  );
}
