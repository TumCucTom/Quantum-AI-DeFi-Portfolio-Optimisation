"use client";
import React, { useState } from 'react';

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    const aiMessage: Message = {
      sender: 'AI Assistant',
      text: "This is a sample response from Supremacy AI 🤖",
    };

    if (messages.length === 0) {
      const newTitle = input.length > 40 ? input.slice(0, 40) + "..." : input;
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

    setMessages([...messages, userMessage, aiMessage]);
    setInput('');
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleConversationClick = (index: number) => {
    setMessages(conversations[index].messages);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
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

      <div style={styles.chatContainer}>
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
  wrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: '3rem',
    gap: '2rem',
    height: '100vh',
    boxSizing: 'border-box',
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '1.5rem',
    width: '1000px',
    height: '100%',
    boxShadow: '0 0 20px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    color: '#f1f5f9',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingBottom: '1rem',
  },
  message: {
    maxWidth: '80%',
    padding: '1rem',
    borderRadius: '12px',
    lineHeight: '1.4',
    fontSize: '0.95rem',
  },
  inputContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
  },
  button: {
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '12px',
    padding: '0.8rem 1.2rem',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 500,
  },
  sidebar: {
    width: '180px',
    marginLeft: '0',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 0 15px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    color: '#f1f5f9',
  },
  newChatButton: {
    padding: '0.6rem 1rem',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: 500,
    marginBottom: '1rem',
    cursor: 'pointer',
  },
  history: {
    flex: 1,
    overflowY: 'auto',
  },
};
