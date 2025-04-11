"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (walletAddress: string, apiKey: string) => void;
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [apiKey, setApiKey] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(walletAddress, apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#001020] border border-blue-400/30 rounded-lg w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
        {/* Modal header */}
        <div className="p-4 border-b border-blue-400/30 flex justify-between items-center bg-blue-900/30">
          <h2 className="text-xl font-bold quantum-title">Dashboard Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blue-800/40 text-blue-300/60 hover:text-blue-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="walletAddress" className="block text-sm font-medium text-blue-200">
                Wallet Address
              </label>
              <input
                type="text"
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your wallet address (0x...)"
                className="w-full p-3 rounded-md border border-blue-400/30 bg-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400 text-blue-100"
              />
              <p className="text-xs text-blue-300/60">
                Your wallet address will be used to fetch your portfolio data.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-blue-200">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 rounded-md border border-blue-400/30 bg-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400 text-blue-100"
              />
              <p className="text-xs text-blue-300/60">
                API key is required to access market data and analytics.
              </p>
            </div>
          </div>

          {/* Modal footer */}
          <div className="p-4 border-t border-blue-400/30 flex justify-end bg-blue-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 rounded-md border border-blue-400/30 text-blue-200 hover:bg-blue-900/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600/50 hover:bg-blue-600/70 text-white flex items-center gap-2 transition-colors"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}