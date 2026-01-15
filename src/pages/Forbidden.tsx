import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

const Forbidden = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="relative h-48 bg-gradient-to-br from-destructive via-red-600 to-red-800 flex items-end justify-center pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <ShieldX className="h-12 w-12 text-white" />
          <h1 className="text-3xl font-bold text-white">403</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 -mt-8 bg-background rounded-t-3xl px-6 pt-8 pb-6">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground mb-8">
            Você não tem permissão para acessar esta página. 
            Se acredita que isso é um erro, entre em contato com o administrador.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Ir para o Início
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Fazer Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
