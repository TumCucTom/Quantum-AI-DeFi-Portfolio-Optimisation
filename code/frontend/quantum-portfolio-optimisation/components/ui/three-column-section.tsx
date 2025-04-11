"use client";

import Link from "next/link";

export function ThreeColumnSection() {
  const columns = [
    {
      title: "Analysis",
      link: "/analysis",
    },
    {
      title: "Execute",
      link: "/execute",
    },
    {
      title: "Assistant",
      link: "/assistant",
    },
  ];

  return (
    <section className="relative z-10 w-full" id="quantum-solutions">
      <div className="w-full border-y border-blue-400/20 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 w-full">
          {columns.map((column, index) => (
            <Link 
              href={column.link} 
              key={index} 
              className={`
                flex flex-col items-center 
                ${index !== 0 ? 'md:border-l border-blue-400/20' : ''} 
                ${index !== columns.length - 1 ? 'border-b md:border-b-0' : ''}
              `}
            >
              <div className="py-10 px-6 w-full h-full flex flex-col items-center justify-center hover:bg-blue-900/20 transition-all duration-300">
                <h3 className="quantum-title text-2xl font-bold text-center">{column.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}