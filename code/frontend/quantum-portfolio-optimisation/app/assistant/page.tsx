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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch('http://localhost:3002/quantum/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      const aiMessage: Message = {
        sender: 'AI Assistant',
        text: data.response || 'Something went wrong!',
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
        // Otherwise, add to the first conversation for now
        const updated = [...conversations];
        if (updated[0]) {
          updated[0].messages = [...messages, userMessage, aiMessage];
          setConversations(updated);
        }
      }

      setMessages((prev) => [...prev, aiMessage]);
      setInput('');
    } catch (error) {
      console.error('Error contacting backend:', error);
      const errorMsg: Message = {
        sender: 'AI Assistant',
        text: 'Failed to get response from the server.',
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
  },
  sendButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0070f3',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },
};
