"use client";

export function ThreeColumnSection() {
  const columns = [
    { title: "Analysis" },
    { title: "Execute" },
    { title: "Assistant" }
  ];

  return (
    <section className="relative z-10 w-full" id="quantum-solutions">
      <div className="w-full border-y border-blue-400/20 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 w-full min-h-[500px]">
          {/* Analysis Column - 3 rows */}
          <div className={`flex flex-col border-b md:border-b-0 md:border-r border-blue-400/20`}>
            <div className="py-6 px-6 w-full flex flex-col items-center border-b border-blue-400/20 h-1/3">
              <h3 className="quantum-title text-2xl font-bold text-center mb-4">{columns[0].title}</h3>
              <div className="w-full p-4 flex-grow border border-blue-400/20 rounded-md bg-blue-900/10">
                <p className="text-blue-200/80 text-sm">Dummy text box for Analysis section 1</p>
              </div>
            </div>
            <div className="py-6 px-6 w-full flex flex-col items-center border-b border-blue-400/20 h-1/3">
              <div className="w-full p-4 flex-grow border border-blue-400/20 rounded-md bg-blue-900/10">
                <p className="text-blue-200/80 text-sm">Dummy text box for Analysis section 2</p>
              </div>
            </div>
            <div className="py-6 px-6 w-full flex flex-col items-center h-1/3">
              <div className="w-full p-4 flex-grow border border-blue-400/20 rounded-md bg-blue-900/10">
                <p className="text-blue-200/80 text-sm">Dummy text box for Analysis section 3</p>
              </div>
            </div>
          </div>
          
          {/* Execute Column - 1 row */}
          <div className={`flex flex-col border-b md:border-b-0 md:border-r border-blue-400/20`}>
            <div className="py-6 px-6 w-full h-full flex flex-col">
              <h3 className="quantum-title text-2xl font-bold text-center mb-4">{columns[1].title}</h3>
              <div className="w-full flex-grow p-4 border border-blue-400/20 rounded-md bg-blue-900/10 flex items-center justify-center">
                <p className="text-blue-200/80 text-sm">Dummy text box for Execute section</p>
              </div>
            </div>
          </div>
          
          {/* Assistant Column - 2 rows */}
          <div className={`flex flex-col`}>
            <div className="py-6 px-6 w-full flex flex-col items-center border-b border-blue-400/20 h-1/2">
              <h3 className="quantum-title text-2xl font-bold text-center mb-4">{columns[2].title}</h3>
              <div className="w-full p-4 flex-grow border border-blue-400/20 rounded-md bg-blue-900/10">
                <p className="text-blue-200/80 text-sm">Dummy text box for Assistant section 1</p>
              </div>
            </div>
            <div className="py-6 px-6 w-full flex flex-col items-center h-1/2">
              <div className="w-full p-4 flex-grow border border-blue-400/20 rounded-md bg-blue-900/10">
                <p className="text-blue-200/80 text-sm">Dummy text box for Assistant section 2</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}