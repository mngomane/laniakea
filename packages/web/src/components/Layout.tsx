import type { ReactNode } from "react";
import { Sidebar } from "./layout/Sidebar.js";
import { TopBar } from "./layout/TopBar.js";
import { TelemetryHUD } from "./layout/TelemetryHUD.js";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-24 pb-12 px-8 min-h-screen">
        {children}
      </main>
      <TelemetryHUD />
    </div>
  );
}
