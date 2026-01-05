import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check } from "lucide-react";

interface Country {
  id: number;
  nome: string;
  bandeira_url: string | null;
}

interface CountryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
}

export function CountryPickerSheet({
  open,
  onOpenChange,
  countries,
  selectedCountryId,
  onSelectCountry,
}: CountryPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sort countries with Brazil at top, then filter by search
  const sortedAndFilteredCountries = useMemo(() => {
    // Find Brazil
    const brazil = countries.find(c => c.nome.toLowerCase() === "brasil");
    const otherCountries = countries.filter(c => c.nome.toLowerCase() !== "brasil");
    
    // Sort others alphabetically
    otherCountries.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Brazil first, then others
    const sorted = brazil ? [brazil, ...otherCountries] : otherCountries;
    
    // Filter by search
    if (!searchQuery.trim()) return sorted;
    
    const query = searchQuery.toLowerCase();
    return sorted.filter(c => c.nome.toLowerCase().includes(query));
  }, [countries, searchQuery]);

  const handleSelect = (countryId: string) => {
    onSelectCountry(countryId);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] px-0">
        <SheetHeader className="px-4 pb-4">
          <SheetTitle>Selecionar País</SheetTitle>
        </SheetHeader>
        
        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus={false}
            />
          </div>
        </div>
        
        {/* Countries list */}
        <ScrollArea className="h-[calc(85dvh-140px)]">
          <div className="px-4 space-y-1">
            {sortedAndFilteredCountries.map((country) => {
              const isSelected = selectedCountryId === country.id.toString();
              return (
                <button
                  key={country.id}
                  onClick={() => handleSelect(country.id.toString())}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isSelected 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  {country.bandeira_url && (
                    <img 
                      src={country.bandeira_url} 
                      alt="" 
                      className="w-8 h-5 object-cover rounded-sm shadow-sm" 
                    />
                  )}
                  <span className="flex-1 text-left font-medium">{country.nome}</span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
            
            {sortedAndFilteredCountries.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum país encontrado
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
