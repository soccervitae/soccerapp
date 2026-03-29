import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PwaHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-16 px-6">
      <div className="flex-1 flex items-center justify-center">
        <img 
          src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/escudotime/LOGOSITE/soccervitaeoff.png" 
          alt="Soccer Vitae"
          className="h-16 object-contain"
        />
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
