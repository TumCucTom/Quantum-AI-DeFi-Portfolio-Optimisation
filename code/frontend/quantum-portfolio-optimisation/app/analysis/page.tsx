"use client";
import React, { useEffect, useState } from 'react';
import SectionNav from './sectionBar';
import axios from 'axios';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
}

type TokenMap = Record<string, TokenInfo>;

const FullGraphs: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [tokens, setTokens] = useState<TokenMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const fetchTokens = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/tokens/supply');
        setTokens(res.data);
        setError(null);
      } catch (err) {
        setError('⚠️ 데이터를 불러오는 중 오류가 발생했습니다.');
        setTokens({});
        console.error('❌ API 오류:', err);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 5000);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
        <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
          <p>Q-Monte Carlo Simulation goes here</p>
        </div>

        <h2
          id="tda"
          className="scroll-target"
          style={{ ...styles.heading, ...getResponsiveMargins() }}
        >
          Quantum Topological Data Analysis (TDA)
        </h2>
        <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
          <p>Q-TDA visualization goes here</p>
        </div>

        <h2
          id="livedata"
          className="scroll-target"
          style={{ ...styles.heading, ...getResponsiveMargins() }}
        >
          Live Data
        </h2>

        <div style={{ ...styles.graphArea, ...getResponsiveMargins() }}>
          {error && <p className="text-red-500">{error}</p>}

          {!error && Object.keys(tokens).length === 0 && (
            <p>📡 Loading token info...</p>
          )}

          {Object.entries(tokens).map(([symbol, token]) => (
            <div key={symbol} className="space-y-2 mb-6 p-4 border border-white/20 rounded-xl bg-white/10">
              <p><b>Name:</b> {token.name}</p>
              <p><b>Symbol:</b> {token.symbol}</p>
              <p><b>Decimals:</b> {token.decimals}</p>
              <p><b>Total Supply:</b> {BigInt(token.totalSupply ?? "0").toLocaleString()}</p>
            </div>
          ))}
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