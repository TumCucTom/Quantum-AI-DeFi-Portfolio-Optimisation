import React, { useState } from 'react';

const FullChatbot: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // Handle sending a message
  const sendMessage = () => {
    if (inputText.trim().length > 0) {
      setMessages([...messages, inputText]);
      setInputText('');
    }
  };

  return (
    <div style={styles.container}>
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
  );
};

export default FullChatbot;

// Inline styles for illustration
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    display: 'flex',
    flexDirection: 'column',
  },
  chatWindow: {
    flex: 1,
    minHeight: '400px',
    border: '1px solid #ccc',
    padding: '1rem',
    marginBottom: '1rem',
    overflowY: 'auto',
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
};
