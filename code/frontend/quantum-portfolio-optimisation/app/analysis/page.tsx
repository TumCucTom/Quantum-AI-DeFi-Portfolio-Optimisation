"use client";
import React from 'react';
import NavBar from './NavBar';
import SectionNav from './sectionBar';
// import TransferTable from '@/components/TransferTable'; // 위치에 맞게 수정

const FullGraphs: React.FC = () => {
  return (
    <>
      <NavBar />
      <SectionNav />

      <div style={styles.container}>
        <h2 id="montecarlo" className="scroll-target" style={styles.heading}>
          Quantum Monte Carlo Simulation
        </h2>
        <div style={styles.graphArea}>
          <p>Q-Monte Carlo Simulation goes here</p>
        </div>

        <h2 id="tda" className="scroll-target" style={styles.heading}>
          Quantum Topological Data Analysis (TDA)
        </h2>
        <div style={styles.graphArea}>
          <p>Q-TDA visualization goes here</p>
        </div>

        <h2 id="livedata" className="scroll-target" style={styles.heading}>
          Live Data
        </h2>
        <div style={styles.graphArea}>
          {/* <TransferTable /> */}
        </div>
      </div>
    </>
  );
};

export default FullGraphs;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    gap: '3rem',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: '0.5rem',
  },
  graphArea: {
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '2rem',
    borderRadius: '16px',
    minHeight: '500px',
    color: '#f1f5f9',
    backdropFilter: 'blur(6px)',
  },
};
