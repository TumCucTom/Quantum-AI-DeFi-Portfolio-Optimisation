'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

export const NavBar: React.FC = () => {
  const pathname = usePathname();
  
  // Define navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Assistant', path: '/assistant' },
    { name: 'Analysis', path: '/analysis' },
  ];

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-blue-400/20 sticky top-0 z-50">
      <div className="quantum-title text-xl font-bold">Cert<span className="text-orange-600">AI</span>nty Quantum</div>
      <ul className="flex gap-6">
        {navLinks.map((link) => (
          <li key={link.path}>
            <Link 
              href={link.path}
              className={`text-blue-100/80 hover:text-blue-100 transition-colors ${
                pathname === link.path ? 'text-blue-100 font-medium' : ''
              }`}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default NavBar;