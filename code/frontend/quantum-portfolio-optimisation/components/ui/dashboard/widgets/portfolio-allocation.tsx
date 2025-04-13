"use client";

import React, { useEffect, useState } from "react";
import { JsonRpcProvider, formatUnits, formatEther, Contract } from "ethers";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface PortfolioAllocationProps {
  walletAddress: string;
  apiKey: string; // Accept the API key from props.
}

export const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  walletAddress,
  apiKey,
}) => {
  // Balances in token units.
  const [ethBalance, setEthBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [wbtcBalance, setWbtcBalance] = useState(0);

  // Prices in USD.
  const [prices, setPrices] = useState<{ eth: number; usdc: number; wbtc: number }>({
    eth: 0,
    usdc: 0,
    wbtc: 0,
  });

  // Track whether data is still loading or fully fetched.
  const [isFetching, setIsFetching] = useState(true);

  // Minimal ERC20 ABI
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

  // Use the user-provided API key to create your provider.
  const provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${apiKey}`);

  async function fetchEthBalance(wallet: string): Promise<number> {
    try {
      const balanceBN = await provider.getBalance(wallet);
      return parseFloat(formatEther(balanceBN));
    } catch (error) {
      console.error("Error fetching ETH balance:", error);
      return 0;
    }
  }

  async function fetchERC20Balance(wallet: string, tokenAddress: string): Promise<number> {
    try {
      const contract = new Contract(tokenAddress, erc20Abi, provider);
      const [balanceBN, decimals] = await Promise.all([
        contract.balanceOf(wallet),
        contract.decimals(),
      ]);
      return parseFloat(formatUnits(balanceBN, decimals));
    } catch (error) {
      console.error(`Error fetching token balance for ${tokenAddress}:`, error);
      return 0;
    }
  }

  async function fetchPrices(): Promise<{ eth: number; usdc: number; wbtc: number }> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,wrapped-bitcoin&vs_currencies=usd"
      );
      const data = await response.json();
      return {
        eth: data.ethereum.usd,
        usdc: data["usd-coin"].usd,
        wbtc: data["wrapped-bitcoin"].usd,
      };
    } catch (error) {
      console.error("Error fetching prices:", error);
      return { eth: 0, usdc: 0, wbtc: 0 };
    }
  }

  async function fetchAllData() {
    try {
      setIsFetching(true);
      const [ethBal, usdcBal, wbtcBal, fetchedPrices] = await Promise.all([
        fetchEthBalance(walletAddress),
        fetchERC20Balance(walletAddress, USDC_ADDRESS),
        fetchERC20Balance(walletAddress, WBTC_ADDRESS),
        fetchPrices(),
      ]);

      setEthBalance(ethBal);
      setUsdcBalance(usdcBal);
      setWbtcBalance(wbtcBal);
      setPrices(fetchedPrices);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    console.log("Current walletAddress:", walletAddress);
    if (walletAddress) {
      fetchAllData();
    } else {
      setEthBalance(0);
      setUsdcBalance(0);
      setWbtcBalance(0);
      setPrices({ eth: 0, usdc: 0, wbtc: 0 });
      setIsFetching(false);
    }
  }, [walletAddress]);

  const ethValueUSD = ethBalance * prices.eth;
  const usdcValueUSD = usdcBalance * prices.usdc;
  const wbtcValueUSD = wbtcBalance * prices.wbtc;
  const otherValueUSD = 0;
  const totalValue = ethValueUSD + usdcValueUSD + wbtcValueUSD + otherValueUSD;

  const chartData = {
    labels: ["ETH", "USDC", "WBTC", "Other"],
    datasets: [
      {
        data: [ethValueUSD, usdcValueUSD, wbtcValueUSD, otherValueUSD],
        backgroundColor: ["#60A5FA", "#A78BFA", "#4ADE80", "#FACC15"],
        hoverBackgroundColor: ["#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B"],
      },
    ],
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between mb-4">
        <div className="text-blue-100 font-medium">Portfolio Value</div>
        <div className="text-blue-100">
          {isFetching
            ? "Loading..."
            : `$${totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
        </div>
      </div>

      <div className="mb-4 text-blue-200 text-xs">
        Connected:{" "}
        {walletAddress
          ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
              walletAddress.length - 4
            )}`
          : "N/A"}
      </div>

      <div className="flex-grow bg-blue-900/10 rounded-md border border-blue-400/10 p-4 flex items-center justify-center">
        {isFetching ? (
          <span className="text-sm text-blue-300">Fetching data...</span>
        ) : (
          <div className="w-full">
            <Pie data={chartData} />
          </div>
        )}
      </div>

      {!isFetching && totalValue > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
            <span className="text-blue-200/70">
              ETH ({((ethValueUSD / totalValue) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
            <span className="text-blue-200/70">
              USDC ({((usdcValueUSD / totalValue) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
            <span className="text-blue-200/70">
              WBTC ({((wbtcValueUSD / totalValue) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-blue-200/70">
              Other ({((otherValueUSD / totalValue) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
