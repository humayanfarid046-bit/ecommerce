"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type MobileDrawerMode = "menu" | "categories";

type MobileDrawerContextValue = {
  drawerOpen: boolean;
  /** `menu` = full site overview (hamburger). `categories` = browse categories only (bottom nav). */
  drawerMode: MobileDrawerMode;
  openDrawer: (mode?: MobileDrawerMode) => void;
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
  const [drawerMode, setDrawerMode] = useState<MobileDrawerMode>("menu");
  const openDrawer = useCallback((mode: MobileDrawerMode = "menu") => {
    setDrawerMode(mode);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => {
    setDrawerMode("menu");
    setDrawerOpen((o) => !o);
  }, []);
  const value = useMemo(
    () => ({
      drawerOpen,
      drawerMode,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [drawerOpen, drawerMode, openDrawer, closeDrawer, toggleDrawer]
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
