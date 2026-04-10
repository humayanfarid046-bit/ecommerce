"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type MobileDrawerContextValue = {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const MobileDrawerContext = createContext<MobileDrawerContextValue | null>(
  null
);

export function MobileDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);
  const value = useMemo(
    () => ({ drawerOpen, openDrawer, closeDrawer, toggleDrawer }),
    [drawerOpen, openDrawer, closeDrawer, toggleDrawer]
  );
  return (
    <MobileDrawerContext.Provider value={value}>
      {children}
    </MobileDrawerContext.Provider>
  );
}

export function useMobileDrawer(): MobileDrawerContextValue {
  const ctx = useContext(MobileDrawerContext);
  if (!ctx) {
    throw new Error("useMobileDrawer requires MobileDrawerProvider");
  }
  return ctx;
}
