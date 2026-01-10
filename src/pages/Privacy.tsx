import { ArrowLeft, Lock, Database, Eye, Share2, Trash2, Bell, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Privacy = () => {
  const navigate = useNavigate();

  const dataCollected = [
    {
      icon: Database,
      title: "Dados de Cadastro",
      description: "Nome, e-mail, data de nascimento, gênero, foto de perfil e informações do seu perfil de jogador."
    },
    {
      icon: Eye,
      title: "Dados de Uso",
      description: "Interações na plataforma, posts curtidos, perfis visitados, tempo de uso e preferências."
    },
    {
      icon: Globe,
      title: "Dados Técnicos",
      description: "Endereço IP, tipo de dispositivo, sistema operacional, navegador e localização aproximada."
    }
  ];

  const howWeUse = [
    "Fornecer e melhorar nossos serviços",
    "Personalizar sua experiência na plataforma",
    "Enviar notificações relevantes sobre sua conta",
    "Detectar e prevenir fraudes e abusos",
    "Cumprir obrigações legais",
    "Analisar tendências de uso para melhorias"
  ];

  const yourRights = [
    {
      icon: Eye,
      title: "Acesso",
      description: "Você pode acessar todos os seus dados pessoais a qualquer momento nas configurações."
    },
    {
      icon: Share2,
      title: "Portabilidade",
      description: "Solicite uma cópia de todos os seus dados em formato legível."
    },
    {
      icon: Trash2,
      title: "Exclusão",
      description: "Delete sua conta e todos os dados associados permanentemente."
    },
    {
      icon: Bell,
      title: "Opt-out",
      description: "Controle quais notificações você recebe e como usamos seus dados."
    }
  ];

  const sections = [
    {
      title: "1. Quem Somos",
      content: `O Soccer Vitae é uma plataforma social voltada para jogadores, profissionais e entusiastas do futebol. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.`
    },
    {
      title: "2. Base Legal para Processamento",
      content: `Processamos seus dados com base no seu consentimento ao criar uma conta, na execução do contrato de serviço, em nossos interesses legítimos (como segurança e prevenção de fraudes) e no cumprimento de obrigações legais.`
    },
    {
      title: "3. Compartilhamento de Dados",
      content: `Não vendemos seus dados pessoais. Podemos compartilhar informações com: prestadores de serviço que nos ajudam a operar a plataforma; autoridades legais quando exigido por lei; outros usuários conforme suas configurações de privacidade permitem.`
    },
    {
      title: "4. Armazenamento e Segurança",
      content: `Seus dados são armazenados em servidores seguros com criptografia. Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou alteração. Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer nossos serviços.`
    },
    {
      title: "5. Cookies e Tecnologias Similares",
      content: `Usamos cookies e tecnologias similares para manter você logado, lembrar suas preferências, analisar o uso da plataforma e melhorar sua experiência. Você pode gerenciar cookies nas configurações do seu navegador.`
    },
    {
      title: "6. Transferências Internacionais",
      content: `Seus dados podem ser transferidos e processados em países diferentes do seu. Garantimos que essas transferências sejam realizadas com salvaguardas adequadas para proteger suas informações.`
    },
    {
      title: "7. Menores de Idade",
      content: `O Soccer Vitae não é destinado a menores de 13 anos. Se soubermos que coletamos dados de uma criança menor de 13 anos sem consentimento parental, tomaremos medidas para excluir essas informações.`
    },
    {
      title: "8. Alterações nesta Política",
      content: `Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou através da plataforma. O uso continuado após as alterações constitui aceitação da nova política.`
    }
  ];

  return (
    <>
      <Helmet>
        <title>Política de Privacidade - Soccer Vitae</title>
        <meta name="description" content="Saiba como o Soccer Vitae coleta, usa e protege seus dados pessoais. Transparência e segurança são nossas prioridades." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Política de Privacidade</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Sua Privacidade Importa</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No Soccer Vitae, levamos a proteção dos seus dados a sério. 
              Esta política explica de forma clara como tratamos suas informações.
            </p>
            <p className="text-sm text-muted-foreground">
              Última atualização: Janeiro 2026
            </p>
          </section>

          {/* Data We Collect */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Dados que Coletamos</h3>
            <div className="grid gap-4">
              {dataCollected.map((item, index) => (
                <div key={index} className="bg-card rounded-xl p-5 border border-border flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How We Use */}
          <section className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Como Usamos seus Dados</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {howWeUse.map((use, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  {use}
                </div>
              ))}
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Seus Direitos (LGPD)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {yourRights.map((right, index) => (
                <div key={index} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <right.icon className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">{right.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{right.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Full Policy */}
          <section className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            ))}
          </section>

          {/* Contact */}
          <section className="bg-primary/5 rounded-2xl p-6 border border-primary/20 text-center">
            <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Contato do DPO</h3>
            <p className="text-muted-foreground">
              Para questões sobre privacidade, entre em contato com nosso Encarregado de Proteção de Dados:
              <br />
              <span className="text-primary">privacidade@soccervitae.com</span>
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default Privacy;