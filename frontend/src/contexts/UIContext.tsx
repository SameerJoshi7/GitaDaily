import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Tab = 'daily' | 'browse' | 'search' | 'bookmarks' | 'guidance' | 'about' | 'shloka-detail' | 'journal';

interface UIContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<Tab>('guidance');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <UIContext.Provider value={{ activeTab, setActiveTab, toast, showToast }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
