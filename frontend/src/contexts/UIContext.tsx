import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;

  isRegisterOpen: boolean;
  openRegister: () => void;
  closeRegister: () => void;

  isCreateHackathonOpen: boolean;
  editingHackathon: any;
  openCreateHackathon: (hackathon?: any) => void;
  closeCreateHackathon: () => void;

  // Deprecated Modals (Keeping for compat if needed, but unused in new flow)
  isHackathonListOpen: boolean;
  openHackathonList: () => void;
  closeHackathonList: () => void;

  isDashboardOpen: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
  
  // Detail Modal (Deprecated)
  isDetailOpen: boolean;
  selectedHackathonId: number | null;
  openDetail: (id: number) => void;
  closeDetail: () => void;

  // Language
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCreateHackathonOpen, setIsCreateHackathonOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<any>(null);
  
  const [isHackathonListOpen, setIsHackathonListOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  const openDetail = (id: number) => {
    setSelectedHackathonId(id);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedHackathonId(null);
  };

  const openCreateHackathon = (hackathon?: any) => {
      if (hackathon) {
          setEditingHackathon(hackathon);
      } else {
          setEditingHackathon(null);
      }
      setIsCreateHackathonOpen(true);
  };

  const closeCreateHackathon = () => {
      setIsCreateHackathonOpen(false);
      setEditingHackathon(null);
  };

  return (
    <UIContext.Provider value={{
      isLoginOpen, openLogin: () => setIsLoginOpen(true), closeLogin: () => setIsLoginOpen(false),
      isRegisterOpen, openRegister: () => setIsRegisterOpen(true), closeRegister: () => setIsRegisterOpen(false),
      isCreateHackathonOpen, editingHackathon, openCreateHackathon, closeCreateHackathon,
      isHackathonListOpen, openHackathonList: () => setIsHackathonListOpen(true), closeHackathonList: () => setIsHackathonListOpen(false),
      isDashboardOpen, openDashboard: () => setIsDashboardOpen(true), closeDashboard: () => setIsDashboardOpen(false),
      isDetailOpen, selectedHackathonId, openDetail, closeDetail,
      lang, setLang
    }}>
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
