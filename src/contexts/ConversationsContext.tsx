import { createContext, useContext, ReactNode, useMemo } from "react";
import { useConversations, ConversationWithDetails } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";

interface ConversationsContextType {
  conversations: ConversationWithDetails[];
  isLoading: boolean;
  isFetching: boolean;
  isOffline: boolean;
  totalUnread: number;
  refetch: () => Promise<void>;
}

const defaultValue: ConversationsContextType = {
  conversations: [],
  isLoading: false,
  isFetching: false,
  isOffline: false,
  totalUnread: 0,
  refetch: async () => {},
};

const ConversationsContext = createContext<ConversationsContextType>(defaultValue);

const ConversationsProviderInner = ({ children }: { children: ReactNode }) => {
  const value = useConversations();
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const ConversationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <ConversationsContext.Provider value={defaultValue}>
        {children}
      </ConversationsContext.Provider>
    );
  }

  return <ConversationsProviderInner>{children}</ConversationsProviderInner>;
};

export const useConversationsContext = (): ConversationsContextType => {
  return useContext(ConversationsContext);
};
