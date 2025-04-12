"use client";
import React, { useState } from 'react';
import '../globals.css';

interface Message {
  sender: 'user' | 'AI Assistant';
  text: string;
}

interface Conversation {
  title: string;
  messages: Message[];
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<number>(1);

  const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage: Message = { sender: 'user', text: input };
  const thinkingMessage: Message = { sender: 'AI Assistant', text: 'Thinking ...' };
  setMessages((prev) => [...prev, userMessage]);

  try {
    const res = await fetch('http://localhost:3002/quantum/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();

    const aiMessage: Message = {
      sender: 'AI Assistant',
      text: data.response || 'Something went wrong!',
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
        <button onClick={handleNewChat} style={styles.newChatButton}>+ New Chat</button>
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
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className="chat-message"
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
              <p style={{ margin: '6px 0 0' }}>{msg.text}</p>
            </div>
          ))}
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={styles.input}
          />
          <button onClick={handleSend} style={styles.button}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

const styles: { [key: string]: React.CSSProperties } = {
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingBottom: '0.75rem',
  },
  message: {
    maxWidth: '75%',
    padding: '0.9rem',
    borderRadius: '10px',
    lineHeight: '1.4',
    fontSize: '0.9rem',
  },
  inputContainer: {
    display: 'flex',
    gap: '0.4rem',
  },
  input: {
    flex: 1,
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
  },
  button: {
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 500,
  },
  newChatButton: {
    padding: '0.5rem 0.9rem',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: 500,
    marginBottom: '0.8rem',
    cursor: 'pointer',
  },
  history: {
    flex: 1,
    overflowY: 'auto',
  },
};