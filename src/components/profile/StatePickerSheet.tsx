import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check } from "lucide-react";

interface State {
  id: number;
  nome: string;
  uf: string;
  bandeira_url: string | null;
}

interface StatePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  states: State[];
  selectedStateId: string;
  onSelectState: (stateId: string) => void;
}

export function StatePickerSheet({
  open,
  onOpenChange,
  states,
  selectedStateId,
  onSelectState,
}: StatePickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sort states alphabetically and filter by search
  const sortedAndFilteredStates = useMemo(() => {
    const sorted = [...states].sort((a, b) => a.nome.localeCompare(b.nome));
    
    if (!searchQuery.trim()) return sorted;
    
    const query = searchQuery.toLowerCase();
    return sorted.filter(s => 
      s.nome.toLowerCase().includes(query) || 
      s.uf.toLowerCase().includes(query)
    );
  }, [states, searchQuery]);

  const handleSelect = (stateId: string) => {
    onSelectState(stateId);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] px-0">
        <SheetHeader className="px-4 pb-4">
          <SheetTitle>Selecionar Estado</SheetTitle>
        </SheetHeader>
        
        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus={false}
            />
          </div>
        </div>
        
        {/* States list */}
        <ScrollArea className="h-[calc(85dvh-140px)]">
          <div className="px-4 space-y-1">
            {sortedAndFilteredStates.map((state) => {
              const isSelected = selectedStateId === state.id.toString();
              return (
                <button
                  key={state.id}
                  onClick={() => handleSelect(state.id.toString())}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isSelected 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  {state.bandeira_url && (
                    <img 
                      src={state.bandeira_url} 
                      alt="" 
                      className="w-8 h-5 object-cover rounded-sm shadow-sm" 
                    />
                  )}
                  <span className="flex-1 text-left font-medium">
                    {state.nome} ({state.uf})
                  </span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
            
            {sortedAndFilteredStates.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum estado encontrado
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
