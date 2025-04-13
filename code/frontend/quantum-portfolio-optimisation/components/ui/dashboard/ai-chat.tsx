"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant"; // updated to match Dashboard
  text: string;
}

interface AIChatProps {
  onSend: (userPrompt: string) => Promise<void>;
  chatHistory: Message[];
}

export function AIChat({ onSend, chatHistory }: AIChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-blue-400/20 bg-blue-900/30">
          <h3 className="text-sm font-medium text-blue-100">Brian - Quantum AI Assistant</h3>
        </div>

        <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
          {chatHistory.map((message, index) => (
              <div
                  key={index}
                  className={`${
                      message.role === "user" ? "ml-auto bg-blue-600/30" : "mr-auto bg-blue-900/30"
                  } max-w-[85%] p-3 rounded-lg border border-blue-400/20`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-blue-400/20">
          <div className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about DeFi, crypto, or portfolio strategies..."
                className="flex-grow p-2 rounded-md border border-blue-400/20 bg-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400/40 text-sm"
            />
            <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="p-2 rounded-md bg-blue-600/50 hover:bg-blue-600/70 disabled:opacity-50 transition-colors"
            >
              <Send size={18} className="text-blue-100" />
            </button>
          </div>
        </div>
      </div>
  );
}
