import { Button } from "@/components/ui/button";
import { Search, Play, Eye, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logoText from "@/assets/soccervitae-logo-text.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Soccer Vitae - A Rede Social do Atleta Profissional</title>
        <meta
          name="description"
          content="A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal."
        />
      </Helmet>
      
      <div className="min-h-screen bg-[#102216] text-white font-sans">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-10 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <img src={logoText} alt="Soccer Vitae" className="h-8" />
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="text-white hover:bg-white/10 font-medium"
          >
            Entrar
          </Button>
        </header>

        {/* Hero Section */}
        <section className="w-full">
          <div className="p-0 md:p-4">
            <div
              className="relative flex min-h-[560px] flex-col gap-6 md:gap-8 md:rounded-xl items-center justify-end pb-12 p-4 overflow-hidden bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(16, 34, 22, 1) 0%, rgba(16, 34, 22, 0.6) 40%, rgba(16, 34, 22, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDT2pTn64tn7UxRaCLdSIqqE1y1Z0AYtCLNTzIggqae4i-MIj4O3l7tX9caZtZ7ZqPJ9QY47044d0PP8IK4sV2NLRz7RxAWknfxoUNw7M8eVGGAGOW7fPI0iPg6KxJ71fbDC5TH4Qt0Q4T-BEbTrHCkhmwDXJi05EtfmMPuOaMIHy7Z09KCn6Z5BtGiShd8QAjXzkpNoVOx_AWfXpZ-5gYFtHpXhhNDtbJ1MBjtiTDfcGIth28u2rz08qXv_bZgIe8pxPwJnzQvf4E")`
              }}
            >
              <div className="flex flex-col gap-4 text-center z-10 max-w-[600px]">
                <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight uppercase">
                  Conecte-se.
                  <br />
                  Compita.
                  <br />
                  Conquiste.
                </h1>
                <p className="text-white/80 text-base md:text-lg">
                  A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal.
                </p>
              </div>
              
              <div className="flex gap-3 z-10">
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-6 h-12 rounded-full"
                >
                  Criar Perfil Grátis
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center">
              <span className="text-[#1cb15c] text-4xl font-black">50k+</span>
              <span className="text-white/60 text-sm">Atletas</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#1cb15c] text-4xl font-black">2k+</span>
              <span className="text-white/60 text-sm">Clubes</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#1cb15c] text-4xl font-black">500+</span>
              <span className="text-white/60 text-sm">Olheiros</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-12">
            <p className="text-[#1cb15c] text-sm font-medium uppercase tracking-wider">
              Recursos Principais
            </p>
            <h2 className="text-white text-3xl md:text-4xl font-black max-w-[720px]">
              Tudo que você precisa para evoluir
            </h2>
            <p className="text-white/60 text-base max-w-[720px]">
              Ferramentas profissionais desenhadas especificamente para o ecossistema do futebol amador e semiprofissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature Card 1 */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a3d26] p-6">
              <div className="w-12 h-12 rounded-full bg-[#1cb15c]/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-[#1cb15c]" />
              </div>
              <h3 className="text-white text-lg font-bold">Encontre Times</h3>
              <p className="text-white/60 text-sm">
                Busque equipes na sua região que precisam da sua posição e habilidades específicas para completar o elenco.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a3d26] p-6">
              <div className="w-12 h-12 rounded-full bg-[#1cb15c]/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-[#1cb15c]" />
              </div>
              <h3 className="text-white text-lg font-bold">Compartilhe Destaques</h3>
              <p className="text-white/60 text-sm">
                Publique seus melhores vídeos, gols e lances defensivos para ganhar visibilidade na comunidade.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a3d26] p-6">
              <div className="w-12 h-12 rounded-full bg-[#1cb15c]/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#1cb15c]" />
              </div>
              <h3 className="text-white text-lg font-bold">Conecte-se com Olheiros</h3>
              <p className="text-white/60 text-sm">
                Seu perfil pode ser visto por recrutadores e olheiros de clubes profissionais em busca de novos talentos.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-white text-2xl md:text-3xl font-black mb-4">
              Pronto para entrar em campo?
            </h2>
            <p className="text-white/60 mb-8">
              Junte-se a milhares de jogadores e comece sua jornada profissional hoje.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-8 h-12 rounded-full"
            >
              Baixar App
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoText} alt="Soccer Vitae" className="h-6" />
            </div>
            <div className="flex gap-6 text-white/60 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Soccer Vitae. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
