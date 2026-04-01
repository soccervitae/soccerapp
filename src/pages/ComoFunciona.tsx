import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, Link2, Eye } from "lucide-react";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const ComoFunciona = () => {
  const navigate = useNavigate();

  const steps = [
    { icon: UserPlus, step: "1", title: "Crie seu perfil", desc: "Cadastre-se gratuitamente, escolha seu tipo de conta (atleta, comissão técnica ou time) e preencha suas informações." },
    { icon: Link2, step: "2", title: "Conecte-se", desc: "Siga outros perfis, envie mensagens, compartilhe seus melhores momentos e construa sua rede no futebol." },
    { icon: Eye, step: "3", title: "Apareça", desc: "Seu perfil fica visível para clubes, olheiros e profissionais. Receba convites, propostas e oportunidades." },
  ];

  return (
    <>
      <Helmet>
        <title>Como Funciona | Soccer Vitae</title>
        <meta name="description" content="Veja como a Soccer Vitae funciona em 3 passos simples: crie seu perfil, conecte-se com o mercado do futebol e seja descoberto por clubes e olheiros." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://soccervitae.com/como-funciona" />
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
            Como a Soccer Vitae Funciona
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Em 3 passos simples você cria seu perfil profissional e começa a ser visto pelo mercado do futebol.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-8 text-center relative">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {s.step}
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-3">{s.title}</h2>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 text-center bg-muted/30">
          <h2 className="text-2xl font-bold text-foreground mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-6">Cadastro gratuito. Sem cartão de crédito.</p>
          <Button size="lg" onClick={() => navigate("/auth")}>Criar Minha Conta</Button>
        </section>
      </div>
    </>
  );
};

export default ComoFunciona;
