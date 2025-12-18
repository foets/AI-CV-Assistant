"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";

interface ResizableLayoutProps {
  children: React.ReactNode;
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const minWidth = 300;
  const maxWidth = 600;

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex h-screen">
      {/* Sidebar with dynamic width */}
      <div style={{ width: sidebarWidth, minWidth: sidebarWidth }} className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 cursor-col-resize hover:bg-indigo-400 transition-colors relative group ${
          isResizing ? "bg-indigo-500" : "bg-gray-200"
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-100/50" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${
          isResizing ? "bg-indigo-600" : "bg-gray-300 group-hover:bg-indigo-400"
        }`} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>

      {/* Overlay during resize to prevent iframe from capturing mouse events */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}

