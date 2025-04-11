'use client';
import Link from 'next/link';
import React from 'react';

const NavBar: React.FC = () => {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Supremacy AI</div>
      <ul style={styles.links}>
        <li><Link href="/"><span style={styles.link}>Home</span></Link></li>
        <li><Link href="/dashboard"><span style={styles.link}>Portfolio Optimisation</span></Link></li>
        <li><Link href="/assistant"><span style={styles.link}>Assistant</span></Link></li>
      </ul>
    </nav>
  );
};

export default NavBar;

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    backgroundColor: '#0f172a',
    color: 'white',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    listStyle: 'none',
    gap: '1.5rem',
  },
  link: {
    cursor: 'pointer',
    color: '#cbd5e1',
    fontWeight: 500,
  },
};
