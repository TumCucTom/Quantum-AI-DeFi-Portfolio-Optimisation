'use client';

import Link from 'next/link';
import React, {useState} from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export const NavBar: React.FC = () => {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define navigation links
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Assistant', path: '/assistant' },
    { name: 'Analysis', path: '/analysis' },
  ];

  return (
    <nav className="bg-[#0f172a]/80 backdrop-blur-md border-b border-blue-400/20 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Left Logo -> Home Link */}
        <Link href="/" className="quantum-title text-xl font-bold text-white hover:opacity-90 transition">
          Cert<span className="text-orange-600">AI</span>nty Quantum
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden sm:flex gap-6">
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

        {/* Mobile Toggle */}
        <button
          className="sm:hidden text-blue-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <ul className="flex flex-col sm:hidden px-6 pb-4 gap-2">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                href={link.path}
                className={`block py-1 text-blue-100/80 hover:text-blue-100 transition-colors ${
                  pathname === link.path ? 'text-blue-100 font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default NavBar;
