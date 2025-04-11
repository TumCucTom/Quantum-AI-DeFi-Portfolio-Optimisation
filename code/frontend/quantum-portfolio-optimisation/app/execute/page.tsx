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
    <div style={styles.container}>
      {/* Left Side - Chatbot */}
      <div style={styles.leftPane}>
        <h2>AI Chatbot</h2>
        <div style={styles.chatWindow}>
          {messages.map((msg, index) => (
            <div key={index} style={styles.chatMessage}>
              <strong>User:</strong> {msg}
            </div>
          ))}
        </div>
        <div style={styles.inputContainer}>
          <input
            style={styles.input}
            type="text"
            placeholder="Type your question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button style={styles.sendButton} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>

      {/* Right Side - Graphs */}
      <div style={styles.rightPane}>
        <h2>Graphs</h2>
        <div style={styles.graphPlaceholder}>
          {/* Replace this placeholder with your actual graph components */}
          <p>Graph(s) will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default HalfChatbotHalfGraphs;

// Inline styles for illustration
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ccc',
    padding: '1rem',
  },
  chatWindow: {
    flex: 1,
    border: '1px solid #ccc',
    marginBottom: '1rem',
    overflowY: 'auto',
    padding: '0.5rem',
  },
  chatMessage: {
    marginBottom: '0.5rem',
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
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
  },
  graphPlaceholder: {
    flex: 1,
    border: '1px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
