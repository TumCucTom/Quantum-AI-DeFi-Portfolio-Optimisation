"use client";

import React, { useEffect, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/a11y-dark.css"; // or another theme

export default function NewPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedQuantum, setSelectedQuantum] = useState<string | null>(null);
  const [selectedClassical, setSelectedClassical] = useState<string | null>(null);
  const [selectedSimple, setSelectedSimple] = useState<"QMC" | "QTDA" | null>("QTDA");
  const [chatLog, setChatLog] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [codeContent, setCodeContent] = useState<string>("");

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

  const handleSend = () => {
    if (chatInput.trim() === "") return;
    const newLog = [...chatLog, { role: "user" as const, content: chatInput }];
    setChatLog([...newLog, { role: "bot" as const, content: generateBotResponse(chatInput) }]);
    setChatInput("");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000510] to-[#002240] text-white flex flex-col items-center pt-12">
      <h1 className="text-5xl font-semibold mb-10">Code snippet</h1>

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
            <div className="absolute top-full mt-1 w-60 bg-blue-950 border border-blue-400/30 rounded shadow-lg flex flex-col z-10">
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
            <div className="absolute top-full mt-1 w-60 bg-blue-950 border border-blue-400/30 rounded shadow-lg flex flex-col z-10">
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
      </div>

      {/* Info + Chatbot Boxes */}
      {(selectedOption || selectedSimple) && (
        <div className="mt-12 flex flex-col md:flex-row gap-6 w-[80%]">
          {/* Info Box */}
          <div className="flex-1 h-[36rem] bg-blue-900/30 border border-blue-400/30 rounded-lg shadow-md p-6">
            <p className="text-lg font-semibold text-white">{boxTitle}</p>
            <pre className="overflow-auto h-full bg-blue-950/20 p-4 rounded-lg">
              <code
                  className="language-python text-sm text-blue-100"
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(codeContent, {language: "python"}).value,
                  }}
              />
            </pre>
          </div>

          {/* Chatbot Box */}
          <div
              className="flex-1 h-[36rem] bg-blue-900/30 border border-blue-400/30 rounded-lg shadow-md p-4 flex flex-col">
            <p className="text-lg font-semibold text-white mb-2">Chatbot</p>
            <div className="flex-1 overflow-y-auto space-y-2 text-sm text-blue-200 bg-blue-950/30 rounded p-3 mb-3">
              {chatLog.length === 0 ? (
                  <p className="italic text-blue-400">
                    Ask me something about {selectedOption || selectedSimple}...
                  </p>
              ) : (
                  chatLog.map((msg, idx) => (
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
                        {msg.content}
                      </div>
                  ))
              )}
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
