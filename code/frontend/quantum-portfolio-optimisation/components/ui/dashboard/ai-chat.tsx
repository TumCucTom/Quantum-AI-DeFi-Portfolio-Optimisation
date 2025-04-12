"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  content: string;
  sender: "user" | "ai";
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hello! I'm Brian, your Quantum AI assistant. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send to Brian API
      const response = await fetch("http://localhost:3003/brian/auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      
      // Create AI message with response
      const aiMessage: Message = {
        content: data.reply || "I'm sorry, I couldn't process that request.",
        sender: "ai",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling Brian API:", error);
      
      // Create error message
      const errorMessage: Message = {
        content: "Sorry, I couldn't connect to the server. Please try again later.",
        sender: "ai",
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 border-b border-blue-400/20 bg-blue-900/30">
        <h3 className="text-sm font-medium text-blue-100">Brian - Quantum AI Assistant</h3>
      </div>

      {/* Chat messages */}
      <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.sender === "user" ? "ml-auto bg-blue-600/30" : "mr-auto bg-blue-900/30"
            } max-w-[85%] p-3 rounded-lg border border-blue-400/20`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 items-center mr-auto bg-blue-900/30 p-3 rounded-lg border border-blue-400/20">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
          </div>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
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
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-md bg-blue-600/50 hover:bg-blue-600/70 disabled:opacity-50 transition-colors"
          >
            <Send size={18} className="text-blue-100" />
          </button>
        </div>
      </div>
    </div>
  );
}