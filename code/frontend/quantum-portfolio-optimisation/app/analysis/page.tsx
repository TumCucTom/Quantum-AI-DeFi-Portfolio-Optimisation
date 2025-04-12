"use client";
import React, { useEffect, useState } from 'react';
import SectionNav from './sectionBar';
// import TransferTable from '@/components/TransferTable';

const FullGraphs: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 공통 마진 적용 함수
  const getResponsiveMargins = (): React.CSSProperties =>
    isMobile ? { margin: '0 1rem' } : {};

  return (
    <>
      <SectionNav />

      <div style={styles.container}>
        <h2
          id="montecarlo"
          className="scroll-target"
          style={{ ...styles.heading, ...getResponsiveMargins() }}
        >
          Quantum Monte Carlo Simulation
        </h2>
        <div
          style={{ ...styles.graphArea, ...getResponsiveMargins() }}
        >
          <p>Q-Monte Carlo Simulation goes here</p>
        </div>

        <h2
          id="tda"
          className="scroll-target"
          style={{ ...styles.heading, ...getResponsiveMargins() }}
        >
          Quantum Topological Data Analysis (TDA)
        </h2>
        <div
          style={{ ...styles.graphArea, ...getResponsiveMargins() }}
        >
          <p>Q-TDA visualization goes here</p>
        </div>

        <h2
          id="livedata"
          className="scroll-target"
          style={{ ...styles.heading, ...getResponsiveMargins() }}
        >
          Live Data
        </h2>
        <div
          style={{ ...styles.graphArea, ...getResponsiveMargins() }}
        >
          {/* <TransferTable /> */}
        </div>
      </div>
    </>
  );
};

export default FullGraphs;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '3rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
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
