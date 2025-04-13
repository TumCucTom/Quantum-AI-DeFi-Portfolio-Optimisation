// app/analysis/page.tsx
import dynamic from "next/dynamic";

// Disable SSR for FullGraphs
const FullGraphs = dynamic(() => import("@/components/ui/analysis/FullGraphs"), {
  ssr: false,
});

export default function AnalysisPage() {
  return <FullGraphs />;
}
