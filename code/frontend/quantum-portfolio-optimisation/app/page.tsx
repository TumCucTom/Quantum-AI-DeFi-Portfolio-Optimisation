"use client";

import { Button } from "@/components/ui/button";
import { Bot, LineChart, Wallet } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}vw`;
      document.getElementById("particleContainer")?.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 10000);
    };

    const interval = setInterval(() => {
      createParticle();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div id="particleContainer" className="absolute inset-0 pointer-events-none" />
      <div className="quantum-grid absolute inset-0 opacity-30" />

      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center mb-16 floating">
          <h1 className="quantum-title text-6xl font-bold mb-4">Supremacy AI</h1>
          <p className="text-xl text-blue-200/80">
            Quantum Computation and Information - Working offline
          </p>
        </div>

        {/* Cards with arrows above */}
        <div className="flex justify-center gap-6 w-full max-w-5xl">
          {[
            {
              icon: <Bot className="h-10 w-10 text-blue-400" />,
              text: "Quantum x DeFi AI Assistant",
              delay: "0s",
              link: "/assistant",
            },
            {
              icon: <Wallet className="h-10 w-10 text-blue-400" />,
              text: "Quantum x DeFi Portfolio Optimisation",
              delay: "0.5s",
              link: "/execute",
            },
            {
              icon: <LineChart className="h-10 w-10 text-blue-400" />,
              text: "Quantum x DeFi Analysis",
              delay: "1s",
              link: "/analysis",
            },
          ].map(({ icon, text, delay, link }, i) => (
            <div key={i} className="flex flex-col items-center relative">
              <div
                className="arrow"
                style={{
                  top: "-40px",
                  animationDelay: delay,
                }}
              />
              <Link href={link}>
                <Button
                  className="quantum-card p-6 h-auto flex flex-col items-center justify-center gap-4 glow"
                  variant="ghost"
                >
                  {icon}
                  <span className="text-sm font-medium text-blue-100 leading-tight">{text}</span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
