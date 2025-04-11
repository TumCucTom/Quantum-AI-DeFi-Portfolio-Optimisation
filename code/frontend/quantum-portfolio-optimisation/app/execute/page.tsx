"use client";
import React, { useState } from 'react';

const HalfChatbotHalfGraphs: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');

  const sendMessage = () => {
    if (inputText.trim().length > 0) {
      setMessages([...messages, inputText]);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Side - Chatbot */}
      <div className="flex flex-col md:w-1/2 w-full border-b md:border-b-0 md:border-r border-gray-300 p-4">
        <h2 className="text-xl font-semibold mb-2">AI Chatbot</h2>
        <div className="flex-1 border border-gray-300 mb-4 overflow-y-auto p-2 rounded bg-white/5">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2 text-sm">
              <strong>User:</strong> {msg}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-3 py-2 border rounded text-black"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>

      {/* Right Side - Graphs */}
      <div className="flex flex-col md:w-1/2 w-full p-4">
        <h2 className="text-xl font-semibold mb-2">Graphs</h2>
        <div className="flex-1 border border-gray-300 flex items-center justify-center rounded bg-white/5">
          <p className="text-gray-400">Graph(s) will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default HalfChatbotHalfGraphs;
