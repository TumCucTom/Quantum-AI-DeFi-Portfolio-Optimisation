"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your Quantum AI assistant. How can I help you with your portfolio today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    // In a real implementation, this would be an API call to your AI backend
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: "This is a placeholder for the AI response. In a production environment, this would connect to your AI backend API for real-time responses.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 border-b border-blue-400/20 bg-blue-900/30">
        <h3 className="text-sm font-medium text-blue-100">Quantum AI Assistant</h3>
      </div>

      {/* Chat messages */}
      <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.sender === "user" ? "ml-auto bg-blue-600/30" : "mr-auto bg-blue-900/30"
            } max-w-[85%] p-3 rounded-lg border border-blue-400/20`}
          >
            <p className="text-sm">{message.content}</p>
            <p className="text-xs text-blue-300/60 mt-1 text-right">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center mr-auto bg-blue-900/30 p-3 rounded-lg border border-blue-400/20">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-blue-400/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask about your portfolio..."
            className="flex-grow p-2 rounded-md border border-blue-400/20 bg-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400/40 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="p-2 rounded-md bg-blue-600/50 hover:bg-blue-600/70 disabled:opacity-50 transition-colors"
          >
            <Send size={18} className="text-blue-100" />
          </button>
        </div>
        <p className="text-xs text-blue-200/60 mt-2 text-center">
          CONNECT TO REAL AI SERVICE.
        </p>
      </div>
    </div>
  );
}