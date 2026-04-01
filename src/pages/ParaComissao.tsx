import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Search, Award, Shield } from "lucide-react";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const ParaComissao = () => {
  const navigate = useNavigate();

  const benefits = [
    { icon: Briefcase, title: "Perfil Profissional", desc: "Cadastre sua experiência como treinador, preparador físico, analista ou médico esportivo." },
    { icon: Search, title: "Encontre Atletas", desc: "Pesquise perfis de jogadores por posição, idade, cidade e características técnicas." },
    { icon: Award, title: "Credibilidade", desc: "Mostre seus títulos, certificações e histórico de clubes onde trabalhou." },
    { icon: Shield, title: "Rede Exclusiva", desc: "Conecte-se com clubes, outros profissionais e atletas em um ambiente focado no futebol." },
  ];

  return (
    <>
      <Helmet>
        <title>Para Comissão Técnica | Treinadores e Staff | Soccer Vitae</title>
        <meta name="description" content="A plataforma para treinadores, preparadores físicos e profissionais do futebol. Encontre atletas, mostre seu trabalho e conecte-se com clubes." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://soccervitae.com/para-comissao" />
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
            A Plataforma para Treinadores e Profissionais do Futebol
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Para treinadores, preparadores físicos, analistas de desempenho e médicos esportivos. Mostre seu trabalho e encontre oportunidades.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Criar Meu Perfil Grátis
          </Button>
        </section>

        <section className="px-6 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Benefícios para profissionais
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
          <p className="text-muted-foreground mb-6">Cadastro gratuito. Leva menos de 2 minutos.</p>
          <Button size="lg" onClick={() => navigate("/auth")}>Criar Conta</Button>
        </section>
      </div>
    </>
  );
};

export default ParaComissao;
