import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Helmet } from "react-helmet-async";

const Landing = () => {
  return (
    <>
      <Helmet>
        <title>Soccer Vitae - A Rede Social do Atleta Profissional</title>
        <meta
          name="description"
          content="Conecte-se com atletas, técnicos e olheiros do mundo inteiro. Construa seu currículo esportivo, compartilhe conquistas e impulsione sua carreira no futebol."
        />
        <meta property="og:title" content="Soccer Vitae - A Rede Social do Atleta Profissional" />
        <meta
          property="og:description"
          content="Conecte-se com atletas, técnicos e olheiros do mundo inteiro. Construa seu currículo esportivo, compartilhe conquistas e impulsione sua carreira no futebol."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Soccer Vitae - A Rede Social do Atleta Profissional" />
        <meta
          name="twitter:description"
          content="Conecte-se com atletas, técnicos e olheiros do mundo inteiro. Construa seu currículo esportivo, compartilhe conquistas e impulsione sua carreira no futebol."
        />
      </Helmet>
      <div className="min-h-screen">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingStats />
        <LandingCTA />
        <LandingFooter />
      </div>
    </>
  );
};

export default Landing;
