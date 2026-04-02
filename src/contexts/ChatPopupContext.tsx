import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ChatParticipant {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  nickname?: string | null;
  account_type?: string | null;
}

interface ChatPopupState {
  conversationId: string | null;
  participant: ChatParticipant | null;
  isOpen: boolean;
  isMinimized: boolean;
}

interface ChatPopupContextType {
  state: ChatPopupState;
  openChat: (conversationId: string, participant: ChatParticipant) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
}

const ChatPopupContext = createContext<ChatPopupContextType | null>(null);

export const ChatPopupProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ChatPopupState>({
    conversationId: null,
    participant: null,
    isOpen: false,
    isMinimized: false,
  });

  const openChat = useCallback((conversationId: string, participant: ChatParticipant) => {
    setState({
      conversationId,
      participant,
      isOpen: true,
      isMinimized: false,
    });
  }, []);

  const closeChat = useCallback(() => {
    setState({
      conversationId: null,
      participant: null,
      isOpen: false,
      isMinimized: false,
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  return (
    <ChatPopupContext.Provider value={{ state, openChat, closeChat, toggleMinimize }}>
      {children}
    </ChatPopupContext.Provider>
  );
};

export const useChatPopup = () => {
  const ctx = useContext(ChatPopupContext);
  if (!ctx) throw new Error("useChatPopup must be used within ChatPopupProvider");
  return ctx;
};
