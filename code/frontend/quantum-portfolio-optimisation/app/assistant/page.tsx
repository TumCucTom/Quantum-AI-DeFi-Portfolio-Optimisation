'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../globals.css';

interface Message {
  sender: 'user' | 'AI Assistant';
  text: string;
}

interface Conversation {
  title: string;
  messages: Message[];
}

// Name the component the same as what we'll export
const FullChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<number>(1);
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const [userApiKey, setUserApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');


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
          userApiKey, // send user's key to backend
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        const text = await res.text(); // fallback
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response.");
      }
      
      if (!res.ok) {
        throw new Error(data.error || "API call failed");
      }
      const aiMessage: Message = {
        sender: 'AI Assistant',
        text: data?.choices?.[0]?.message?.content || 'Something went wrong!',
      };

      // If no existing conversation, create a new one
      if (messages.length === 0) {
        const newTitle =
            input.length > 40 ? input.slice(0, 40) + '...' : input;

        const newConversation: Conversation = {
          title: newTitle,
          messages: [userMessage, aiMessage],
        };
        setConversations([newConversation, ...conversations]);
      } else {
        // Otherwise, add to the first conversation
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

  if (!userApiKey) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white">
          <div className="bg-white/10 p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Enter your Groq API Key</h2>
            <input
                type="password"
                placeholder="sk-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full p-2 mb-4 text-black rounded"
            />
            <button
                onClick={() => setUserApiKey(keyInput)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save & Start Chatting
            </button>
          </div>
        </div>
    );
  }

  // @ts-ignore
  return (
    <div className="flex flex-col md:flex-row w-full h-[95vh] p-3 gap-3">
      {/* Sidebar */}
      <div className="w-full md:w-52 bg-white/5 text-white rounded-2xl p-3 shadow-md backdrop-blur-md">
        <button onClick={handleNewChat} style={styles.newChatButton}>
          + New Chat
        </button>
        <div style={styles.history}>
          <h4 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>History</h4>
          <ul style={{ listStyle: 'none', padding: 0, color: '#cbd5e1' }}>
            {conversations.map((conv, idx) => (
              <li
                key={idx}
                style={{ marginBottom: '0.4rem', cursor: 'pointer' }}
                onClick={() => handleConversationClick(idx)}
              >
                🗂 {conv.title}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-white/5 text-white rounded-2xl p-3 shadow-xl backdrop-blur-md">
        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf:
                  msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor:
                  msg.sender === 'user'
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(255,255,255,0.08)',
              }}
            >
              <strong>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</strong>
              <div style={{ margin: '6px 0 0' }}>
                {msg.sender === 'AI Assistant' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
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
    color: '#000'
  },
  sendButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0070f3',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },
};
