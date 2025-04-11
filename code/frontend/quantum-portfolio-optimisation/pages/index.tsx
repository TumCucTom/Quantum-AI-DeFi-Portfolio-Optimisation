import React from 'react';
import Link from 'next/link';

const LandingPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Product Name</h1>
      <p style={styles.subtitle}>Quantum Computation and Information - Working offline</p>
      
      <div style={styles.buttonsContainer}>
        {/* Button to Full AI Chatbot Page */}
        <Link href="/assistant" style={styles.button}>
          Quantum x DeFi AI Assistant
        </Link>
        
        {/* Button to Half Chatbot / Half Graphs Page */}
        <Link href="/execute" style={styles.button}>
          Quantum x DeFi Portfolio Optimisation
        </Link>
        
        {/* Button to Full Graphs Page */}
        <Link href="/analysis" style={styles.button}>
          Quantum x DeFi Analysis
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;

// Simple inline styles for quick illustration:
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#fafafa',
    textAlign: 'center',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  button: {
    display: 'inline-block',
    padding: '1rem 2rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};
