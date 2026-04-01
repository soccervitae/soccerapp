import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Search, Trophy, BarChart3 } from "lucide-react";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const ParaTimes = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Users, title: "Monte Seu Elenco", desc: "Gerencie o plantel do seu time com perfis completos de cada atleta." },
    { icon: Search, title: "Encontre Jogadores", desc: "Busque atletas por posição, idade, pé preferido e localização." },
    { icon: Trophy, title: "Histórico do Clube", desc: "Exiba títulos, campeonatos e a história do seu time na plataforma." },
    { icon: BarChart3, title: "Visibilidade", desc: "Seu time visível para atletas, comissões técnicas e parceiros em todo o Brasil." },
  ];

  return (
    <>
      <Helmet>
        <title>Para Times | Cadastre Seu Clube | Soccer Vitae</title>
        <meta name="description" content="Cadastre seu time de futebol na Soccer Vitae. Encontre jogadores, monte seu elenco e dê visibilidade ao seu clube. Amador ou profissional." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://soccervitae.com/para-times" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src={logoGreen} alt="Soccer Vitae logo" className="h-7 w-auto" loading="eager" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </header>

        <section className="px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Cadastre Seu Time e Encontre Jogadores e Staff
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Para clubes amadores e profissionais. Gerencie seu elenco, encontre novos talentos e mostre seu time para o mercado.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Cadastrar Meu Time Grátis
          </Button>
        </section>

        <section className="px-6 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Benefícios para clubes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((b, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Comece agora</h2>
          <p className="text-muted-foreground mb-6">Cadastro gratuito para qualquer time.</p>
          <Button size="lg" onClick={() => navigate("/auth")}>Criar Conta</Button>
        </section>
      </div>
    </>
  );
};

export default ParaTimes;
