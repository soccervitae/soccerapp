import { createContext, useContext, ReactNode } from "react";
import { useConversations, ConversationWithDetails } from "@/hooks/useConversations";

interface ConversationsContextType {
  conversations: ConversationWithDetails[];
  isLoading: boolean;
  isFetching: boolean;
  isOffline: boolean;
  totalUnread: number;
  refetch: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextType | null>(null);

export const ConversationsProvider = ({ children }: { children: ReactNode }) => {
  const value = useConversations();
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversationsContext = (): ConversationsContextType => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error("useConversationsContext must be used within a ConversationsProvider");
  }
  return context;
};
