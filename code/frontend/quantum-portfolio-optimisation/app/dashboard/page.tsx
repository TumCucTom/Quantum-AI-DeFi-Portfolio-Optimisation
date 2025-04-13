// app/analysis/page.tsx
import dynamic from "next/dynamic";

// Disable SSR for FullGraphs
const Dash = dynamic(() => import("@/components/ui/dashboard/dashboard"), {
  ssr: false,
});

export default function AnalysisPage() {
  return <Dash />;
}
