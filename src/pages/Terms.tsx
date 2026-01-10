import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Aceitação dos Termos",
      content: `Ao criar uma conta ou usar o Soccer Vitae, você concorda com estes Termos de Uso. Se você não concordar, não utilize a plataforma. Reservamo-nos o direito de modificar estes termos a qualquer momento, e o uso continuado após alterações constitui aceitação das mudanças.`
    },
    {
      title: "2. Elegibilidade",
      content: `Para usar o Soccer Vitae, você deve ter pelo menos 13 anos de idade. Se você for menor de 18 anos, deve ter permissão de um responsável legal. Ao se cadastrar, você confirma que atende a estes requisitos.`
    },
    {
      title: "3. Sua Conta",
      content: `Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado. É proibido criar contas falsas, múltiplas contas ou contas em nome de terceiros sem autorização.`
    },
    {
      title: "4. Conteúdo do Usuário",
      content: `Você mantém os direitos sobre o conteúdo que publica, mas nos concede uma licença mundial, não exclusiva, transferível e sublicenciável para usar, reproduzir, modificar e exibir seu conteúdo na plataforma. Você é o único responsável pelo conteúdo que publica e garante que possui os direitos necessários para compartilhá-lo.`
    },
    {
      title: "5. Conduta Proibida",
      content: `É estritamente proibido: violar leis aplicáveis; publicar conteúdo ilegal, difamatório ou ofensivo; assediar outros usuários; disseminar spam ou malware; tentar hackear ou comprometer a segurança da plataforma; criar contas falsas; infringir direitos autorais ou propriedade intelectual de terceiros.`
    },
    {
      title: "6. Propriedade Intelectual",
      content: `O Soccer Vitae, incluindo logo, design, código e funcionalidades, é propriedade exclusiva da plataforma e está protegido por leis de propriedade intelectual. É proibido copiar, modificar, distribuir ou criar obras derivadas sem autorização expressa.`
    },
    {
      title: "7. Suspensão e Encerramento",
      content: `Podemos suspender ou encerrar sua conta a qualquer momento, com ou sem aviso, se você violar estes termos ou por qualquer outro motivo a nosso critério. Você pode encerrar sua conta nas configurações. Após o encerramento, alguns dados podem ser retidos conforme exigido por lei.`
    },
    {
      title: "8. Isenção de Garantias",
      content: `O Soccer Vitae é fornecido "como está" sem garantias de qualquer tipo. Não garantimos que a plataforma será ininterrupta, livre de erros ou segura. Você usa a plataforma por sua conta e risco.`
    },
    {
      title: "9. Limitação de Responsabilidade",
      content: `Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais, especiais ou consequentes resultantes do uso ou incapacidade de uso da plataforma, mesmo que tenhamos sido avisados da possibilidade de tais danos.`
    },
    {
      title: "10. Lei Aplicável",
      content: `Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida nos tribunais competentes do Brasil, renunciando a qualquer outro foro por mais privilegiado que seja.`
    }
  ];

  const userRights = [
    "Acessar e usar a plataforma gratuitamente",
    "Controlar a visibilidade do seu perfil",
    "Excluir sua conta e dados a qualquer momento",
    "Denunciar conteúdo que viole as diretrizes"
  ];

  const userObligations = [
    "Fornecer informações verdadeiras no cadastro",
    "Respeitar outros usuários e as diretrizes",
    "Não usar a plataforma para fins ilegais",
    "Manter suas credenciais de acesso seguras"
  ];

  return (
    <>
      <Helmet>
        <title>Termos de Uso - Soccer Vitae</title>
        <meta name="description" content="Leia os Termos de Uso do Soccer Vitae. Entenda seus direitos e obrigações ao usar nossa plataforma." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Termos de Uso</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Termos de Uso</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Estes termos regem o uso do Soccer Vitae. Ao usar a plataforma, você concorda com as condições descritas abaixo.
            </p>
            <p className="text-sm text-muted-foreground">
              Última atualização: Janeiro 2026
            </p>
          </section>

          {/* Quick Summary */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-foreground">Seus Direitos</h3>
              </div>
              <ul className="space-y-2">
                {userRights.map((right, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 mt-1">•</span>
                    {right}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-foreground">Suas Obrigações</h3>
              </div>
              <ul className="space-y-2">
                {userObligations.map((obligation, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-yellow-500 mt-1">•</span>
                    {obligation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full Terms */}
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
            <Users className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Dúvidas?</h3>
            <p className="text-muted-foreground">
              Entre em contato conosco pelo e-mail <span className="text-primary">contato@soccervitae.com</span>
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default Terms;