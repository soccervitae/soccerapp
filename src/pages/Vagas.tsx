import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const Vagas = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Vagas no Futebol | Oportunidades | Soccer Vitae</title>
        <meta name="description" content="Encontre vagas e oportunidades no futebol brasileiro. Para atletas, treinadores e profissionais do esporte." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://soccervitae.com/vagas" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src={logoGreen} alt="Soccer Vitae logo" className="h-7 w-auto" loading="eager" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </header>

        <section className="px-6 py-16 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Vagas no Futebol</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Em breve: oportunidades abertas para atletas, treinadores e profissionais.
          </p>
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4 block">work</span>
            <p className="text-muted-foreground">Vagas em breve. Cadastre-se para ser notificado!</p>
          </div>
          <Button size="lg" className="mt-8" onClick={() => navigate("/auth")}>Criar Conta</Button>
        </section>
      </div>
    </>
  );
};

export default Vagas;
