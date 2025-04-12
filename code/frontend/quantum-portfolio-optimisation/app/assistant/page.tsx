'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings } from 'lucide-react'; // Icon
import '../globals.css';

interface Message {
  sender: 'user' | 'AI Assistant';
  text: string;
}

interface Conversation {
  title: string;
  messages: Message[];
}

const FullChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userApiKey, setUserApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(true);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          userApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API call failed");
      }

      const aiMessage: Message = {
        sender: 'AI Assistant',
        text: data?.choices?.[0]?.message?.content || 'Something went wrong!',
      };

      if (messages.length === 0) {
        const newTitle = input.length > 40 ? input.slice(0, 40) + '...' : input;
        const newConversation: Conversation = {
          title: newTitle,
          messages: [userMessage, aiMessage],
        };
        setConversations([newConversation, ...conversations]);
      } else {
        const updated = [...conversations];
        if (updated[0]) {
          updated[0].messages = [...messages, userMessage, aiMessage];
          setConversations(updated);
        }
      }

      setMessages((prev) => [...prev, aiMessage]);
      setInput('');
    } catch (error) {
      console.error('Error contacting Groq API:', error);
      const errorMsg: Message = {
        sender: 'AI Assistant',
        text: 'Failed to get response from Groq API.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleConversationClick = (index: number) => {
    setMessages(conversations[index].messages);
  };

  const handleSaveSettings = () => {
    setUserApiKey(tempApiKey);
    setShowSettings(false);
  };

  return (
    <>
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

      {/* Chat Layout */}
      <div className="flex flex-col md:flex-row w-full h-[95vh] p-3 gap-3">
        {/* Sidebar */}
        <div className="w-full md:w-52 bg-white/5 text-white rounded-2xl p-3 shadow-md backdrop-blur-md flex flex-col h-full">
          <button onClick={handleNewChat} style={styles.newChatButton}>
            + New Chat
          </button>
          <div style={styles.history}>
            <h4 className="text-slate-400 mb-2">History</h4>
            <ul className="text-slate-300">
              {conversations.map((conv, idx) => (
                <li
                  key={idx}
                  className="mb-2 cursor-pointer"
                  onClick={() => handleConversationClick(idx)}
                >
                  🗂 {conv.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Settings Button at Bottom */}
          <div className="mt-auto pt-6 border-t border-blue-400/20 flex justify-center">
            <button
              onClick={() => {
                setTempApiKey(userApiKey);
                setShowSettings(true);
              }}
              className="p-2 rounded-full bg-blue-900/30 border border-blue-400/30 hover:bg-blue-800/40 transition-colors"
              title="Change API Key"
            >
              <Settings size={20} className="text-blue-400" />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col flex-1 bg-white/5 text-white rounded-2xl p-3 shadow-xl backdrop-blur-md">
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor:
                    msg.sender === 'user'
                      ? 'rgba(99,102,241,0.15)'
                      : 'rgba(255,255,255,0.08)',
                }}
              >
                <strong>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</strong>
                <div className="mt-1">
                  {msg.sender === 'AI Assistant' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div style={styles.inputContainer}>
            <input
              style={styles.input}
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button style={styles.sendButton} onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullChatbot;

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  newChatButton: {
    marginBottom: '1rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },
  history: {
    marginTop: '1rem',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '1rem',
  },
  message: {
    margin: '0.5rem',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    maxWidth: '80%',
  },
  inputContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    color: '#000',
    borderRadius: '0.5rem',
  },
  sendButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0070f3',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: '0.5rem',
  },
};
