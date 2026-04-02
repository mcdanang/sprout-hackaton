"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      {/* Sidebar Container */}
      <DashboardSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar} 
      />

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen",
          "bg-[#F8FAFC]", // Modern dashboard background
          "md:rounded-tl-[40px] md:ml-0", // Rounded shell effect
          isCollapsed ? "md:pl-0" : "md:pl-0" 
        )}
      >
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
