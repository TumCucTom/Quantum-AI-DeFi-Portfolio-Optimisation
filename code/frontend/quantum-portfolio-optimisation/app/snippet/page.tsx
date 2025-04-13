'use client';

import React, { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/a11y-dark.css"; // or another theme
import { Settings } from 'lucide-react'; // Icon
import ReactMarkdown from "react-markdown";

export default function NewPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedQuantum, setSelectedQuantum] = useState<string | null>(null);
  const [selectedClassical, setSelectedClassical] = useState<string | null>(null);
  const [selectedSimple, setSelectedSimple] = useState<"QMC" | "QTDA" | null>("QTDA");
  const [chatLog, setChatLog] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [codeContent, setCodeContent] = useState<string>("");

  // Settings state for Groq API key
  const [userApiKey, setUserApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(true);

  const quantumOptions = [
    "Quantum order slicing",
    "Quantum order routing",
    "Quantum Latency cost Awareness",
  ];
  const classicalOptions = ["Order slicing TWAP", "Order Slicing VWAP"];

  const infoMap: Record<string, { description: string; result: string }> = {
    "Quantum order slicing": {
      description: "Splits quantum orders based on time or segments.",
      result: "Expected 30% increase in order efficiency.",
    },
    "Quantum order routing": {
      description: "Routes orders through the most optimal exchange path.",
      result: "Minimized latency and improved market responsiveness.",
    },
    "Quantum Latency cost Awareness": {
      description: "Predicts and responds to latency-based cost impact.",
      result: "Reduced projected loss by 12%.",
    },
    "Order slicing TWAP": {
      description: "Executes orders at fixed time intervals.",
      result: "Minimized market impact.",
    },
    "Order Slicing VWAP": {
      description: "Executes orders based on volume distribution.",
      result: "Improved average pricing.",
    },
  };

  const selectedOption = selectedQuantum || selectedClassical;
  const dynamicInfo = selectedOption ? infoMap[selectedOption] : null;

  const boxTitle =
      selectedOption === "Quantum order slicing"
          ? "quantum_order_slicing.py"
          : selectedOption === "Quantum order routing"
              ? "quantum_order_routing.py"
              : selectedOption === "Quantum Latency cost Awareness"
                  ? "quantum_latency_cost_aware.py"
                  : selectedOption === "Order slicing TWAP"
                      ? "twap.py"
                      : selectedOption === "Order Slicing VWAP"
                          ? "vwap.py"
                          : selectedSimple === "QMC"
                              ? "quantum_monte_carlo_simulations.py"
                              : selectedSimple === "QTDA"
                                  ? "quantum_TDA.py"
                                  : selectedOption || "";

  const descriptionText =
      dynamicInfo?.description ||
      (selectedSimple === "QMC"
          ? "QMC is based on quantum momentum clustering techniques."
          : selectedSimple === "QTDA"
              ? "QTDA focuses on time-delay driven analytics."
              : "");

  const chatKey = `chat_${selectedOption || selectedSimple || "default"}`;

  useEffect(() => {
    const saved = localStorage.getItem(chatKey);
    if (saved) {
      setChatLog(JSON.parse(saved));
    } else {
      setChatLog([]);
    }
  }, [chatKey]);

  useEffect(() => {
    if (chatLog.length > 0) {
      localStorage.setItem(chatKey, JSON.stringify(chatLog));
    }
  }, [chatLog, chatKey]);

  useEffect(() => {
    if (!boxTitle.endsWith(".py")) return;
    fetch(`/scripts/${boxTitle}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load script");
          return res.text();
        })
        .then(setCodeContent)
        .catch(() => setCodeContent("# Unable to load code"));
  }, [boxTitle]);

  const generateBotResponse = (userInput: string) => {
    return `You said: "${userInput}". I'm a placeholder bot and more advanced responses are coming soon! 🤖`;
  };

  const handleSend = async () => {
    if (chatInput.trim() === "") return;
    const userMessage = { role: "user" as const, content: chatInput };
    setChatLog((prev) => [...prev, userMessage]);

    try {
      // Send request to the updated API endpoint. We include the current script (codeContent).
      const res = await fetch("/api/jesko-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: chatInput,
          script: codeContent, // Pass the currently displayed Python script
          userApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "API call failed");
      }

      const aiMessage = {
        role: "bot" as const,
        content: (data?.choices?.[0]?.message?.content || "Something went wrong!").replace(/\n/g, '\n\n\n'),
      };

      setChatLog((prev) => [...prev, aiMessage]);
      setChatInput("");
    } catch (error) {
      console.error("Error contacting Groq API:", error);
      const errorMsg = {
        role: "bot" as const,
        content: "Failed to get response from Groq API.",
      };
      setChatLog((prev) => [...prev, errorMsg]);
    }
  };

  const handleToggle = (menu: string) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSelect = (menu: string, option: string) => {
    if (menu === "Quantum") {
      setSelectedQuantum(option);
      setSelectedClassical(null);
      setSelectedSimple(null);
    } else if (menu === "Classical") {
      setSelectedClassical(option);
      setSelectedQuantum(null);
      setSelectedSimple(null);
    }
    setOpenMenu(null);
  };

  const handleSimpleClick = (label: "QMC" | "QTDA") => {
    setSelectedSimple(label);
    setSelectedQuantum(null);
    setSelectedClassical(null);
  };

  const handleSaveSettings = () => {
    setUserApiKey(tempApiKey);
    setShowSettings(false);
  };

  return (
      <div className="min-h-screen bg-gradient-to-b from-[#000510] to-[#002240] text-white flex flex-col items-center pt-12">
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-[#0f172a] border border-blue-400/20 p-6 rounded-lg shadow-lg text-white w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Enter Your Groq API Key</h2>
                <input
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full p-2 mb-4 text-black rounded"
                />
                <div className="flex justify-end gap-3">
                  {userApiKey && (
                      <button
                          onClick={() => setShowSettings(false)}
                          className="text-sm text-blue-300 underline"
                      >
                        Cancel
                      </button>
                  )}
                  <button
                      onClick={handleSaveSettings}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Save & Start Chatting
                  </button>
                </div>
              </div>
            </div>
        )}

        <h1 className="text-5xl font-semibold mb-10">Code Explaination</h1>

        {/* Top Button Group */}
        <div className="flex gap-32 flex-wrap justify-center">
          {/* Quantum Dropdown */}
          <div className="relative flex flex-col items-center">
            <button
                onClick={() => handleToggle("Quantum")}
                className="px-14 py-4 text-sm rounded bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
            >
              Quantum
            </button>
            {openMenu === "Quantum" && (
                <div
                    className="absolute top-full mt-1 w-60 bg-blue-950 border border-blue-400/30 rounded shadow-lg flex flex-col z-10">
                  {quantumOptions.map((option) => (
                      <button
                          key={option}
                          onClick={() => handleSelect("Quantum", option)}
                          className="px-4 py-3 text-sm text-center whitespace-normal break-words hover:bg-blue-800/30 transition-colors"
                      >
                        {option}
                        {selectedQuantum === option && <span className="ml-2">✔</span>}
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* Classical Dropdown */}
          <div className="relative flex flex-col items-center">
            <button
                onClick={() => handleToggle("Classical")}
                className="px-14 py-4 text-sm rounded bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
            >
              Classical
            </button>
            {openMenu === "Classical" && (
                <div
                    className="absolute top-full mt-1 w-60 bg-blue-950 border border-blue-400/30 rounded shadow-lg flex flex-col z-10">
                  {classicalOptions.map((option) => (
                      <button
                          key={option}
                          onClick={() => handleSelect("Classical", option)}
                          className="px-4 py-3 text-sm text-center whitespace-normal break-words hover:bg-blue-800/30 transition-colors"
                      >
                        {option}
                        {selectedClassical === option && <span className="ml-2">✔</span>}
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* QMC / QTDA Buttons */}
          <button
              onClick={() => handleSimpleClick("QMC")}
              className={`px-14 py-4 text-sm rounded border transition-colors ${
                  selectedSimple === "QMC"
                      ? "bg-blue-800/60 border-blue-400"
                      : "bg-blue-900/30 border-blue-400/30 hover:bg-blue-800/40"
              }`}
          >
            QMC
          </button>
          <button
              onClick={() => handleSimpleClick("QTDA")}
              className={`px-14 py-4 text-sm rounded border transition-colors ${
                  selectedSimple === "QTDA"
                      ? "bg-blue-800/60 border-blue-400"
                      : "bg-blue-900/30 border-blue-400/30 hover:bg-blue-800/40"
              }`}
          >
            QTDA
          </button>
          <button
              onClick={() => {
                setTempApiKey(userApiKey);
                setShowSettings(true);
              }}
              className="p-2 rounded-full bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
              title="Change API Key"
          >
            <Settings size={20} className="text-blue-400"/>
          </button>
        </div>

        {/* Info + Chatbot Boxes */}
        {(selectedOption || selectedSimple) && (
            <div className="mt-12 flex flex-col md:flex-row gap-6 w-[80%]">
              {/* Info Box */}
              <div className="flex-1 h-[36rem] max-w-[50%] bg-blue-900/30 border border-blue-400/30 rounded-lg shadow-md p-6">
                <p className="text-lg font-semibold text-white">{boxTitle}</p>
                <pre className="overflow-auto h-full bg-blue-950/20 p-4 rounded-lg">
              <code
                  className="language-python text-sm text-blue-100"
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(codeContent, { language: "python" }).value,
                  }}
              />
            </pre>
              </div>

              {/* Chatbot Box */}
              <div className="flex-1 h-[36rem] bg-blue-900/30 border border-blue-400/30 rounded-lg shadow-md p-4 flex flex-col">
                <p className="text-lg font-semibold text-white mb-2">Chatbot</p>
                <div className="flex-1 overflow-y-auto space-y-2 text-sm text-blue-200 bg-blue-950/30 rounded p-3 mb-3">
                  {chatLog.map((msg, idx) => (
                      <div
                          key={idx}
                          className={`p-2 rounded ${
                              msg.role === "user"
                                  ? "bg-blue-800/30 text-right"
                                  : "bg-blue-700/30 text-left"
                          }`}
                      >
                    <span className="font-medium text-blue-100">
                      {msg.role === "user" ? "You" : "Bot"}:
                    </span>{" "}
                        <div className="mt-1">
                          {msg.role === "bot" ? (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                          ) : (
                              <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                  ))}

                </div>
                <div className="flex">
                  <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 rounded-l bg-blue-950 border border-blue-400/30 text-white outline-none"
                  />
                  <button
                      onClick={handleSend}
                      className="px-4 py-2 rounded-r bg-blue-700 hover:bg-blue-600 border border-blue-400/30 text-white text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
