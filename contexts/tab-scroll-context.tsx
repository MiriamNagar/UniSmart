import React, { createContext, ReactNode, useContext, useMemo, useRef } from "react";

type TabScrollApi = {
  getOffset: (key: string) => number;
  setOffset: (key: string, y: number) => void;
};

const TabScrollContext = createContext<TabScrollApi | null>(null);

export function TabScrollProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<Map<string, number>>(new Map());

  const api = useMemo<TabScrollApi>(
    () => ({
      getOffset: (key: string) => mapRef.current.get(key) ?? 0,
      setOffset: (key: string, y: number) => {
        const clamped = Math.max(0, y);
        mapRef.current.set(key, clamped);
      },
    }),
    [],
  );

  return (
    <TabScrollContext.Provider value={api}>{children}</TabScrollContext.Provider>
  );
}

export function useTabScroll() {
  const ctx = useContext(TabScrollContext);
  if (!ctx) {
    throw new Error("useTabScroll must be used within TabScrollProvider");
  }
  return ctx;
}
