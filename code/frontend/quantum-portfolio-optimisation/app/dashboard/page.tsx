"use client";

import { useEffect, useState, useRef } from "react";
import { Layout, LayoutPanelProps } from "@/components/ui/dashboard/layout";
import { WidgetMenu } from "@/components/ui/dashboard/widget-menu";
import { AIChat } from "@/components/ui/dashboard/ai-chat";
import { SettingsModal } from "@/components/ui/dashboard/settings-modal";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

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

  const toggleFeature = (key: string) => {
    const exclusiveKeys = ['TWAP', 'VWAP', 'QOS'];

    if (exclusiveKeys.includes(key)) {
      setToggles(prev => {
        const isCurrentlyOn = prev[key];
        const newState = { ...prev };

        // Turn off all exclusive keys first
        exclusiveKeys.forEach(k => {
          newState[k] = false;
        });

        // Toggle the clicked key (allow OFF state)
        newState[key] = !isCurrentlyOn;

        return newState;
      });
    } else {
      // Non-exclusive toggles can be toggled freely
      setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const addPanel = (widgetType: string) => {
    const newPanel: LayoutPanelProps = {
      id: `panel-${panels.length + 1}`,
      widgetType,
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { w: 6, h: 4 },
    };
    setPanels([...panels, newPanel]);
    setShowWidgetMenu(false);
  };

  const removePanel = (id: string) => {
    setPanels(panels.filter(panel => panel.id !== id));
  };

  const handleSaveSettings = (walletAddress: string, apiKey: string) => {
    setWalletAddress(walletAddress);
    setApiKey(apiKey);
    setIsConfigured(true);
    setShowSettings(false);
  };

  useEffect(() => {
    if (!showSettings && !isConfigured) {
      router.push("/");
    }
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfoPopup]);

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
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-blue-400/20 gap-2">
        <h2 className="text-lg sm:text-xl font-medium">Dashboard Controls</h2>
        <div className="flex items-center gap-3">
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

      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-124px)]">
        <main className="flex-grow p-4 overflow-auto">
          <div className="mb-6 px-4 py-3 bg-blue-900/20 border border-blue-400/20 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-sm text-blue-200/80">Connected Wallet:</span>
              <span className="ml-2 text-sm font-medium text-blue-100">
                {walletAddress ? (
                  `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                ) : (
                  "Not connected"
                )}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative bg-blue-900/50 border border-blue-400/30 rounded p-6 text-white aspect-square min-h-[300px]">
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
                  { key: 'TWAP', label: 'Order Slicing TWAP' },
                  { key: 'VWAP', label: 'Order Slicing VWAP' },
                  { key: 'QOS', label: 'Quantum Order Slicing' },
                  { key: 'QOR', label: 'Quantum Order Routing' },
                  { key: 'QLCA', label: 'Quantum Latency Cost Awareness' },
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
                  className="absolute top-14 right-4 w-80 z-10 p-4 bg-blue-950 border border-blue-400/30 rounded text-sm text-blue-100 shadow-lg"
                >
                  <p className="mb-2 font-semibold text-blue-200">Feature Descriptions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>TWAP</strong>: Time-Weighted Average Price slicing.</li>
                    <li><strong>VWAP</strong>: Volume-Weighted Average Price slicing.</li>
                    <li><strong>QOS</strong>: Quantum-based order segmentation logic.</li>
                    <li><strong>QOR</strong>: Quantum-enhanced route optimization.</li>
                    <li><strong>QLCA</strong>: Delayed cost impact awareness via quantum modeling.</li>
                  </ul>
                </div>
              )}
            </div>

            {panels.map((panel) => (
              <div key={panel.id} className="bg-white/5 border border-blue-400/20 rounded p-6 text-white aspect-square min-h-[300px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-semibold">{panel.id}</span>
                  <button
                    onClick={() => removePanel(panel.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm">Widget Content Here</p>
              </div>
            ))}
          </div>
        </main>

        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-blue-400/20 flex flex-col">
          <AIChat />
        </div>
      </div>

      {showWidgetMenu && (
        <WidgetMenu onSelectWidget={(type) => addPanel(type)} onClose={() => setShowWidgetMenu(false)} />
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
