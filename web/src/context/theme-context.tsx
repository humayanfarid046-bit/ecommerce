"use client";

import { useLayoutEffect } from "react";

/** Locks the document to dark UI (no system or stored preference). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);
  return <>{children}</>;
}
