import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface InviteDrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const InviteDrawerContext = createContext<InviteDrawerContextValue | null>(null);

export function InviteDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  return (
    <InviteDrawerContext.Provider value={{ open, setOpen, openDrawer, closeDrawer }}>
      {children}
    </InviteDrawerContext.Provider>
  );
}

export function useInviteDrawer() {
  const ctx = useContext(InviteDrawerContext);
  if (!ctx) {
    return {
      open: false,
      setOpen: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };
  }
  return ctx;
}
