"use client";

import { Button } from "@/components/ui/button";
import { Bot, LineChart, Wallet, LayoutDashboard } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { ThreeColumnSection } from "@/components/ui/three-column-section";

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
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div id="particleContainer" className="absolute inset-0 pointer-events-none" />
      <div className="quantum-grid absolute inset-0 opacity-30" />

      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start px-6 h-[calc(100vh-60px)]">
        {/* Title + Subtitle */}
        <div className="text-center mt-16">
          <h1 className="quantum-title text-7xl md:text-9xl font-bold mb-4">
            Cert<span className="text-orange-600">AI</span>nty Quantum
          </h1>
          <p className="text-xl mt-16 text-blue-200/80">
            Quantum enhanced portfolio optimisation tools – made easy with AI
          </p>
        </div>

        {/* Buttons around 75% down */}
        <div className="text-xl mt-auto mb-[30vh] flex justify-center gap-40 w-full max-w-5xl">
          {[
            {
              icon: <Bot className="h-10 w-10 text-blue-400"/>,
              text: "Quantum Informed AI Assistant",
              delay: "0s",
              link: "/assistant",
            },
            {
              icon: <Wallet className="h-10 w-10 text-blue-400"/>,
              text: "AI x Quantum Execution",
              delay: "0.5s",
              link: "/dashboard",
            },
            {
              icon: <LineChart className="h-10 w-10 text-blue-400"/>,
              text: "Quantum x Wormhole analysis",
              delay: "1s",
              link: "/analysis",
            },
          ].map(({icon, text, delay, link}, i) => (
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
                    <span className="text-sm font-medium text-blue-100 leading-tight">
              {text}
            </span>
                  </Button>
                </Link>
              </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <Link href="#quantum-solutions" scroll={false}>
          <div
              className="scroll-indicator mb-8"
              onClick={() => {
                document.getElementById("quantum-solutions")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
          >
            <div className="scroll-arrow"></div>
            <div className="scroll-arrow"></div>
            <div className="scroll-text">Explore</div>
          </div>
        </Link>
      </div>


      {/* Full-width three-column section */}
      <div className="w-full">
        <ThreeColumnSection/>
      </div>
    </div>
  );
}
