// layout.tsx

"use client";

import React from "react";
import { Panel } from "./panel";

export interface LayoutPanelProps {
  id: string;
  widgetType: string;
  defaultPosition: { x: number; y: number };
  defaultSize: { w: number; h: number };
}

interface LayoutProps {
  panels: LayoutPanelProps[];
  onRemovePanel: (id: string) => void;
}

export function Layout({ panels, onRemovePanel }: LayoutProps) {
  return (
    <div className="relative min-h-full grid grid-cols-12 gap-4 auto-rows-[100px]">
      {panels.map((panel) => (
        <Panel
          key={panel.id}
          id={panel.id}
          widgetType={panel.widgetType}
          gridColumn={`span ${panel.defaultSize.w}`}
          gridRow={`span ${panel.defaultSize.h}`}
          onRemove={() => onRemovePanel(panel.id)}
        />
      ))}
    </div>
  );
}
