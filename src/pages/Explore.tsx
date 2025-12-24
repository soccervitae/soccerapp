import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { Search, CheckCircle } from "lucide-react";

interface Athlete {
  name: string;
  username: string;
  avatar: string;
  position: string;
  team: string;
  verified: boolean;
}

const athletes: Athlete[] = [
  {
    name: "Gabriel Santos",
    username: "gabriel.santos_9",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    position: "Meio-Campo",
    team: "Flamengo",
    verified: true,
  },
  {
    name: "Ana Carolina",
    username: "ana.carolina_11",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    position: "Atacante",
    team: "Corinthians Feminino",
    verified: true,
  },
  {
    name: "Lucas Oliveira",
    username: "lucas.oliveira_10",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    position: "Atacante",
    team: "Palmeiras",
    verified: false,
  },
  {
    name: "Marina Costa",
    username: "marina.costa_7",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    position: "Zagueira",
    team: "São Paulo Feminino",
    verified: true,
  },
  {
    name: "Pedro Henrique",
    username: "pedro.henrique_3",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    position: "Zagueiro",
    team: "Santos",
    verified: false,
  },
  {
    name: "Julia Fernandes",
    username: "julia.fernandes_1",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    position: "Goleira",
    team: "Grêmio Feminino",
    verified: true,
  },
  {
    name: "Rafael Almeida",
    username: "rafael.almeida_6",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    position: "Lateral",
    team: "Internacional",
    verified: false,
  },
  {
    name: "Camila Souza",
    username: "camila.souza_8",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    position: "Meio-Campo",
    team: "Fluminense Feminino",
    verified: true,
  },
];

const positions = ["Todos", "Atacante", "Meio-Campo", "Zagueiro", "Zagueira", "Lateral", "Goleiro", "Goleira"];

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("Todos");

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPosition =
      selectedPosition === "Todos" || athlete.position === selectedPosition;

    return matchesSearch && matchesPosition;
  });

  const handleAthleteClick = (athlete: Athlete) => {
    navigate("/profile", { state: { athlete } });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Explorar</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar atletas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </header>

      {/* Position Filters */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {positions.map((position) => (
            <button
              key={position}
              onClick={() => setSelectedPosition(position)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedPosition === position
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      {/* Athletes List */}
      <div className="px-4 py-2">
        <div className="flex flex-col gap-2">
          {filteredAthletes.map((athlete) => (
            <button
              key={athlete.username}
              onClick={() => handleAthleteClick(athlete)}
              className="bg-card border border-border rounded-xl p-3 text-left hover:bg-muted/50 hover:border-primary/30 transition-all group flex items-center gap-3"
            >
              <div className="relative shrink-0">
                <img
                  src={athlete.avatar}
                  alt={athlete.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
                />
                {athlete.verified && (
                  <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-primary fill-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {athlete.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  @{athlete.username}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-primary font-medium">
                    {athlete.position}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {athlete.team}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum atleta encontrado</p>
          </div>
        )}
      </div>

      <BottomNavigation activeTab="search" />
    </div>
  );
};

export default Explore;
