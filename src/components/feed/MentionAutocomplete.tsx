import { useNavigate } from "react-router-dom";
import { useMentionSearch, type MentionUser } from "@/hooks/useMentionSearch";
import { BadgeCheck } from "lucide-react";

interface MentionAutocompleteProps {
  query: string;
  onSelect: (user: MentionUser) => void;
  visible: boolean;
}

export const MentionAutocomplete = ({ query, onSelect, visible }: MentionAutocompleteProps) => {
  const { data: users, isLoading } = useMentionSearch(query, visible && query.length >= 1);

  if (!visible || query.length < 1) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-[80]">
      {isLoading ? (
        <div className="p-3 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : users && users.length > 0 ? (
        <div className="py-1">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <img
                src={user.avatar_url || "/placeholder.svg"}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {user.username}
                  </span>
                  {user.conta_verificada && (
                    <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary" />
                  )}
                </div>
                {user.full_name && (
                  <span className="text-xs text-muted-foreground truncate block">
                    {user.full_name}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-3 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  );
};
