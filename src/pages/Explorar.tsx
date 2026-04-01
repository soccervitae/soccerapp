import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const Explorar = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Explorar Perfis de Futebol | Soccer Vitae</title>
        <meta name="description" content="Explore perfis de atletas, treinadores e times de futebol na Soccer Vitae. Busque por posicao, cidade e categoria." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://soccervitae.com/explorar" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src={logoGreen} alt="Soccer Vitae logo" className="h-7 w-auto" loading="eager" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </header>

        <section className="px-6 py-16 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Explorar Perfis</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Busque atletas, treinadores e times de futebol em todo o Brasil.
          </p>

          <div className="max-w-lg mx-auto relative mb-12">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Buscar por nome, posição ou cidade..." className="pl-10 py-6 text-base" />
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4 block">manage_search</span>
            <p className="text-muted-foreground mb-4">Faça login para explorar todos os perfis</p>
            <Button onClick={() => navigate("/auth")}>Entrar ou Criar Conta</Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Explorar;
