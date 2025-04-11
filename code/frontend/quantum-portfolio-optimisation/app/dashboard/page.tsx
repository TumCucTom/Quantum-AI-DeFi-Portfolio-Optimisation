"use client";

import { useEffect, useState } from "react";
import { Layout, LayoutPanelProps } from "@/components/ui/dashboard/layout";
import { WidgetMenu } from "@/components/ui/dashboard/widget-menu";
import { AIChat } from "@/components/ui/dashboard/ai-chat";
import { Panels } from "@/components/ui/dashboard/panels";
import { SettingsModal } from "@/components/ui/dashboard/settings-modal";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [panels, setPanels] = useState<LayoutPanelProps[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [apiKey, setApiKey] = useState("");

  const addPanel = (widgetType: string) => {
    const newPanel: LayoutPanelProps = {
      id: `panel-${panels.length + 1}`,
      widgetType,
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { w: 6, h: 4 }
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
      router.push('/');
    }
  }, [showSettings, isConfigured, router]);

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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
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

          <Layout panels={panels} onRemovePanel={removePanel} />

          {panels.length === 0 && (
            <div className="min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center text-center text-blue-200/60 px-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <h2 className="text-lg sm:text-xl mb-2">Your dashboard is empty</h2>
              <p className="max-w-md mb-6">Click the widget menu button in the top right to add graphs, charts, and analytical tools to your dashboard.</p>
              <button 
                onClick={() => setShowWidgetMenu(true)}
                className="px-4 py-2 rounded bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
              >
                Open Widget Menu
              </button>
            </div>
          )}
        </main>

        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-blue-400/20 flex flex-col">
          <AIChat />
        </div>
      </div>

      {showWidgetMenu && (
        <WidgetMenu onSelectWidget={addPanel} onClose={() => setShowWidgetMenu(false)} />
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