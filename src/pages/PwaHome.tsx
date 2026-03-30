import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SoccerAnimation from "@/components/pwa/SoccerAnimation";

const PwaHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-12 px-6">
      <div className="flex flex-col items-center">
        <img 
          src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/escudotime/LOGOSITE/soccervitaeoff.png" 
          alt="Soccer Vitae"
          className="h-10 object-contain"
        />
      </div>
      
      <div className="flex flex-col items-center">
        <p className="text-4xl md:text-6xl font-black leading-tight tracking-tight my-0 py-[16px] text-primary text-center">
          Onde talentos<br />encontram<br />oportunidades
        </p>
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          className="w-full h-12 text-base font-bold uppercase tracking-wide"
          onClick={() => navigate("/auth", { state: { tab: "signup" } })}
        >
          Criar Conta
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-base font-bold uppercase tracking-wide"
          onClick={() => navigate("/auth", { state: { tab: "login" } })}
        >
          Entrar em Campo
        </Button>
      </div>
    </div>
  );
};

export default PwaHome;
