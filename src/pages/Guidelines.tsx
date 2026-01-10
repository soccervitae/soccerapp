import { ArrowLeft, Shield, AlertTriangle, Ban, Eye, Users, MessageSquare, Camera, Flag, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Guidelines = () => {
  const navigate = useNavigate();

  const prohibitedContent = [
    {
      icon: Ban,
      title: "Conteúdo Violento ou Perigoso",
      description: "Ameaças, incitação à violência, brigas entre torcidas, ou qualquer conteúdo que promova danos físicos.",
      examples: ["Ameaças a jogadores ou árbitros", "Vídeos de violência em estádios", "Incitação a confrontos"]
    },
    {
      icon: Users,
      title: "Discurso de Ódio",
      description: "Racismo, xenofobia, homofobia, machismo ou qualquer discriminação contra jogadores, torcedores ou grupos.",
      examples: ["Insultos racistas", "Discriminação por nacionalidade", "Comentários preconceituosos"]
    },
    {
      icon: Eye,
      title: "Nudez e Conteúdo Sexual",
      description: "Qualquer tipo de conteúdo adulto, nudez ou material sexualmente explícito não é permitido.",
      examples: ["Imagens de nudez", "Conteúdo pornográfico", "Assédio sexual"]
    },
    {
      icon: Camera,
      title: "Fake News e Desinformação",
      description: "Notícias falsas sobre transferências, resultados ou informações enganosas sobre clubes e jogadores.",
      examples: ["Contratações inventadas", "Resultados falsos", "Rumores sem fonte"]
    },
    {
      icon: MessageSquare,
      title: "Assédio e Bullying",
      description: "Perseguição, humilhação pública, cyberbullying ou qualquer forma de assédio a outros usuários.",
      examples: ["Mensagens ofensivas repetidas", "Exposição de dados pessoais", "Difamação"]
    },
    {
      icon: Flag,
      title: "Spam e Fraudes",
      description: "Publicações repetitivas, links maliciosos, golpes financeiros ou promoção de apostas ilegais.",
      examples: ["Links de phishing", "Promessas de ganhos fáceis", "Venda de ingressos falsos"]
    }
  ];

  const consequences = [
    { severity: "Leve", action: "Aviso + remoção do conteúdo", color: "text-yellow-500" },
    { severity: "Moderada", action: "Suspensão temporária (7 dias)", color: "text-orange-500" },
    { severity: "Grave", action: "Suspensão prolongada (30 dias)", color: "text-red-400" },
    { severity: "Gravíssima", action: "Banimento permanente", color: "text-red-600" }
  ];

  return (
    <>
      <Helmet>
        <title>Diretrizes da Comunidade - Soccer Vitae</title>
        <meta name="description" content="Conheça as diretrizes e regras de uso da comunidade Soccer Vitae. Saiba o que é permitido e proibido na plataforma." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Diretrizes da Comunidade</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Jogue Limpo</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              O Soccer Vitae é uma comunidade para celebrar o futebol. Para manter o campo em ordem, 
              algumas regras são inegociáveis.
            </p>
          </section>

          {/* Intro */}
          <section className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Por que temos regras?</h3>
                <p className="text-muted-foreground">
                  Assim como no futebol, precisamos de árbitros. Nossas diretrizes existem para garantir 
                  que todos possam curtir a plataforma sem enfrentar conteúdo prejudicial, ofensivo ou ilegal. 
                  Violações resultam em penalidades que vão desde advertências até banimento permanente.
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Content */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Ban className="h-6 w-6 text-destructive" />
              Conteúdo Proibido
            </h3>
            
            <div className="grid gap-4">
              {prohibitedContent.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl p-5 border border-border hover:border-destructive/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <item.icon className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.examples.map((example, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Consequences */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Penalidades
            </h3>
            
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-border">
                <div className="bg-muted px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Gravidade</span>
                </div>
                <div className="bg-muted px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Consequência</span>
                </div>
                {consequences.map((item, index) => (
                  <>
                    <div key={`severity-${index}`} className="bg-card px-4 py-3">
                      <span className={`font-medium ${item.color}`}>{item.severity}</span>
                    </div>
                    <div key={`action-${index}`} className="bg-card px-4 py-3">
                      <span className="text-foreground text-sm">{item.action}</span>
                    </div>
                  </>
                ))}
              </div>
            </div>
          </section>

          {/* Report Section */}
          <section className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
            <div className="text-center space-y-4">
              <Flag className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Viu algo errado?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use o botão de denúncia (três pontinhos no post) para reportar conteúdo que viola nossas diretrizes. 
                Sua denúncia é anônima e nos ajuda a manter o jogo limpo.
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <section className="text-center pb-8">
            <p className="text-sm text-muted-foreground">
              Última atualização: Janeiro 2026
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ao usar o Soccer Vitae, você concorda com estas diretrizes. 
              Reservamo-nos o direito de atualizar estas regras quando necessário.
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default Guidelines;