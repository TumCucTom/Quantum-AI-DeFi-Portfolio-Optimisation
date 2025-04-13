"use client";

import { useEffect, useState, useRef } from "react";
import { LayoutPanelProps } from "@/components/ui/dashboard/layout";
import { WidgetMenu } from "@/components/ui/dashboard/widget-menu";
import { AIChat } from "@/components/ui/dashboard/ai-chat";
import { SettingsModal } from "@/components/ui/dashboard/settings-modal";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { CrossChainSwapChart } from "@/components/ui/dashboard/widgets/cross-chain";
import { PortfolioAllocation } from "@/components/ui/dashboard/widgets/portfolio-allocation";
import { PriceChart } from "@/components/ui/dashboard/widgets/price-chart";
import { MarketSentiment } from "@/components/ui/dashboard/widgets/market-sentiment";


export default function Dashboard() {
  const router = useRouter();
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [panels, setPanels] = useState<LayoutPanelProps[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const infoPopupRef = useRef<HTMLDivElement | null>(null);

  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    TWAP: false,
    VWAP: false,
    QOS: false,
    QOR: false,
    QLCA: false,
  });

  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);

  const toggleFeature = (key: string) => {
    const exclusiveKeys = ["TWAP", "VWAP", "QOS"];
    if (exclusiveKeys.includes(key)) {
      setToggles((prev) => {
        const newState = { ...prev };
        exclusiveKeys.forEach((k) => {
          newState[k] = false;
        });
        newState[key] = !prev[key];
        return newState;
      });
    } else {
      setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // Fixed the template literal by closing the backticks properly.
  const addPanel = (widgetType: string, widgetTitle: string) => {
    const uniqueId = `${widgetTitle}`;
    const newPanel: LayoutPanelProps = {
      id: uniqueId,
      widgetType,
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { w: 6, h: 4 },
    };
    setPanels([...panels, newPanel]);
    setShowWidgetMenu(false);
  };

  const removePanel = (id: string) => {
    setPanels(panels.filter((panel) => panel.id !== id));
  };

  const handleSaveSettings = (walletAddress: string, apiKey: string) => {
    setWalletAddress(walletAddress);
    setApiKey(apiKey);
    setIsConfigured(true);
    setShowSettings(false);
  };

  useEffect(() => {
    if (!showSettings && !isConfigured) router.push("/");
  }, [showSettings, isConfigured, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoPopupRef.current && !infoPopupRef.current.contains(event.target as Node)) {
        setShowInfoPopup(false);
      }
    }
    if (showInfoPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfoPopup]);

  const handleSendPrompt = async (userPrompt: string) => {
    setChatHistory((prev) => [...prev, { role: "user", text: userPrompt }]);
    const activeEnhancements = Object.keys(toggles).filter((key) => toggles[key]);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          userApiKey: apiKey,
          active: activeEnhancements,
          address: walletAddress,
        }),
      });
      const result = await res.json();
      const message =
        result.transactions?.map((t: any) => JSON.stringify(t)).join("\n\n") ||
        JSON.stringify(result);
      setChatHistory((prev) => [...prev, { role: "assistant", text: message }]);
    } catch (error) {
      console.error("Error executing prompt: ", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Error executing prompt." },
      ]);
    }
  };

  if (!isConfigured && showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#000510] to-[#002240] text-white">
        <SettingsModal
          isOpen={true}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-[#000510] to-[#002240] text-white">
      <div className="p-4 flex justify-between items-center border-b border-blue-400/20">
        <h2 className="text-lg font-medium">Dashboard Controls</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
            title="Dashboard Settings"
          >
            <Settings size={20} className="text-blue-400" />
          </button>
          <button
            onClick={() => setShowWidgetMenu(!showWidgetMenu)}
            className="p-2 rounded-full bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
            title="Add Widgets"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex lg:flex-row h-auto lg:h-[calc(100vh-124px)]">
        <main className="flex-grow p-4 overflow-auto">
          <div className="mb-6 px-4 py-3 bg-blue-900/20 border border-blue-400/20 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-sm text-blue-200/80">Connected Wallet:</span>
              <span className="ml-2 text-sm font-medium text-blue-100">
                {walletAddress
                  ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
                      walletAddress.length - 4
                    )}`
                  : "Not connected"}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="relative bg-blue-900/50 border border-blue-400/30 rounded p-6 text-white min-h-[300px] max-h-[400px] overflow-y-auto">
              <p className="font-semibold text-lg mb-4 flex justify-between items-center">
                Control
                <button
                  onClick={() => setShowInfoPopup(!showInfoPopup)}
                  className="ml-2 text-blue-300 hover:text-blue-100"
                  title="More information"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
              </p>
              <div className="space-y-3">
                {[
                  { key: "TWAP", label: "Order Slicing TWAP" },
                  { key: "VWAP", label: "Order Slicing VWAP" },
                  { key: "QOS", label: "Quantum Order Slicing" },
                  { key: "QOR", label: "Quantum Order Routing" },
                  { key: "QLCA", label: "Quantum Latency Cost Awareness" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm">{label}</span>
                    <Switch checked={toggles[key]} onCheckedChange={() => toggleFeature(key)} />
                  </div>
                ))}
              </div>

              {showInfoPopup && (
                <div
                  ref={infoPopupRef}
                  className="fixed top-1/2 left-1/2 w-[70rem] z-50 p-16 bg-blue-950 border border-blue-400/30 rounded text-base text-blue-100 shadow-2xl transform -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    onClick={() => setShowInfoPopup(false)}
                    className="absolute top-3 left-4 text-red-400 hover:text-red-300 text-4xl font-bold"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <ul className="text-xl list-disc list-inside space-y-5">
                    <li>
                      <strong>TWAP</strong>: Time-weighted average price slicing...
                    </li>
                    <li>
                      <strong>VWAP</strong>: Volume-weighted average price slicing...
                    </li>
                    <li>
                      <strong>QOS</strong>: Quantum-optimized slicing...
                    </li>
                    <li>
                      <strong>QOR</strong>: Quantum-optimized route selection...
                    </li>
                    <li>
                      <strong>QLCA</strong>: Quantum latency cost awareness...
                    </li>
                  </ul>
                  <div className="mt-8 flex justify-center">
                    <button
                      className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded"
                      onClick={() => setShowInfoPopup(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {panels.map((panel) => (
              <div
                key={panel.id}
                className="bg-white/5 border border-blue-400/20 rounded p-6 text-white min-h-[300px] max-h-[400px] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-semibold capitalize">{panel.id}</span>
                  <button
                    onClick={() => removePanel(panel.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                {panel.widgetType === "cross-chain" ? (
                  <CrossChainSwapChart />
                ) : panel.widgetType === "portfolio-allocation" ? (
                    <PortfolioAllocation walletAddress={walletAddress} apiKey={apiKey} />
                ) : panel.widgetType === "price-chart" ? (
                    <PriceChart />
                ) : panel.widgetType === "market-sentiment" ? (
                    <MarketSentiment />

                ):(
                  <p className="text-sm text-blue-200">Widget Content Here</p>
                )}
              </div>
            ))}
          </div>
        </main>

        <aside className="w-full lg:w-[45rem] border-t lg:border-t-0 lg:border-l border-blue-400/20">
          <AIChat onSend={handleSendPrompt} chatHistory={chatHistory} />
        </aside>
      </div>

      {showWidgetMenu && (
        <WidgetMenu
          onSelectWidget={(type, name) => addPanel(type, name)}
          onClose={() => setShowWidgetMenu(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
