import type { ReactNode } from "react";
import { Sidebar } from "./layout/Sidebar.js";
import { TopBar } from "./layout/TopBar.js";
import { TelemetryHUD } from "./layout/TelemetryHUD.js";
import { BottomNav } from "./layout/BottomNav.js";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <Sidebar />
      <TopBar />
      <main className="md:ml-64 pt-20 md:pt-24 pb-24 md:pb-12 px-4 md:px-8 min-h-screen">
        {children}
      </main>
      <div className="hidden md:block">
        <TelemetryHUD />
      </div>
      <BottomNav />
    </div>
  );
}
