'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings } from 'lucide-react';
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

    // Create the user's message and construct a fresh messages array.
    const userMessage: Message = { sender: 'user', text: input };
    // Note: We create a new local array to avoid asynchronous state issues.
    const updatedMessages = [...messages, userMessage];

    try {
      const res = await fetch("/api/jesko-main", {
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

      console.log(data);

      // Build and add a separate message for reasoning if provided.
      if (data?.reasoning_steps && Array.isArray(data.reasoning_steps) && data.reasoning_steps.length > 0) {
        const aiReasoningMessage: Message = {
          sender: 'AI Assistant',
          text: `**Reasoning:**\n\n${data.reasoning_steps.join('\n')}`
        };
        updatedMessages.push(aiReasoningMessage);
      }

      // Build separate message for the natural response.
      const aiResponseMessage: Message = {
        sender: 'AI Assistant',
        text: `**Response:**\n\n${data?.natural_response || 'Something went wrong!'}`
      };

      updatedMessages.push(aiResponseMessage);

      // Update the messages state with the new array.
      setMessages(updatedMessages);

      // Update conversation history.
      if (conversations.length === 0) {
        // New conversation: use the first prompt as title (trimmed if too long)
        const newTitle = input.length > 40 ? input.slice(0, 40) + '...' : input;
        const newConversation: Conversation = {
          title: newTitle,
          messages: updatedMessages,
        };
        setConversations([newConversation]);
      } else {
        // Update the active (first) conversation.
        const updatedConversations = [...conversations];
        updatedConversations[0].messages = updatedMessages;
        setConversations(updatedConversations);
      }

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

        <div className="flex flex-col md:flex-row w-full h-[95vh] p-3 gap-3">
          <div
              className="w-full md:w-52 bg-white/5 text-white rounded-2xl p-3 shadow-md backdrop-blur-md flex flex-col h-full">
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
            <div className="mt-auto pt-6 border-t border-blue-400/20 flex justify-center">
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
          </div>
          <div className="flex flex-col flex-1 bg-white/5 text-white rounded-2xl p-3 shadow-xl backdrop-blur-md">
            {/*
              The key change: display messages from bottom to top.
              Note flexDirection: 'column-reverse'
            */}
            <div
                style={{
                  display: 'flex',
                  flexDirection: 'column', // stack messages from bottom to top
                  flex: 1,
                  overflowY: 'auto',
                  marginBottom: '1rem',
                }}
            >
              {messages.map((msg, i) => {
                const isReasoning = msg.text.startsWith('**Reasoning:**');
                return (
                    <div
                        key={i}
                        style={{
                          ...styles.message,
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          backgroundColor:
                              msg.sender === 'user'
                                  ? 'rgba(99,102,241,0.15)'
                                  : 'rgba(255,255,255,0.08)',
                          opacity: isReasoning ? 0.7 : 1,
                        }}
                    >
                      <strong>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</strong>
                      <div className="mt-1">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>);
              })}
            </div>

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
    borderRadius: '0.5rem',
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
