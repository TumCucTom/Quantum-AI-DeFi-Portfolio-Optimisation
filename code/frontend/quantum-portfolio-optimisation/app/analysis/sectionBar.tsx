"use client";
import React from 'react';

const SectionNav: React.FC = () => {
  return (
    <div style={styles.nav}>
      <a href="#montecarlo" style={styles.pill}>Quantum Monte Carlo</a>
      <a href="#tda" style={styles.pill}>Quantum TDA</a>
      <a href="#livedata" style={styles.pill}>Wormhole Live Data</a>
    </div>
  );
};

export default SectionNav;

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    padding: '0.75rem 0',
    position: 'sticky',
    top: '60px', // Adjusted to account for the main navbar
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 900, // Slightly lower than main navbar
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#f1f5f9',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: '9999px', // pill shape
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s ease-in-out',
  },
};
