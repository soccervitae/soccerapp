import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

interface PublicProfileData {
  username: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_type: string | null;
  city: string | null;
}

const slugToUsername = (slug: string) => slug.toLowerCase();

const PublicProfile = ({ profileType }: { profileType: "atleta" | "treinador" | "time" }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name, nickname, avatar_url, bio, account_type, city")
        .eq("username", slugToUsername(slug))
        .single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [slug]);

  const getTitle = () => {
    if (!profile) return "Perfil | SOCCER VITAE";
    const name = profile.full_name || profile.nickname || profile.username;
    if (profileType === "atleta") return `${name} | Jogador de Futebol | SOCCER VITAE`;
    if (profileType === "treinador") return `${name} | Treinador de Futebol | SOCCER VITAE`;
    return `${name}${profile.city ? ` | ${profile.city}` : ""} | SOCCER VITAE`;
  };

  const getDescription = () => {
    if (!profile) return "Perfil no SOCCER VITAE, a rede social do futebol.";
    const name = profile.full_name || profile.nickname || profile.username;
    if (profileType === "atleta") return `${name} é jogador de futebol${profile.city ? ` de ${profile.city}` : ""}. Veja estatísticas, vídeos e histórico de carreira no SOCCER VITAE.`;
    if (profileType === "treinador") return `${name}, treinador de futebol. Conecte-se no SOCCER VITAE, a rede social do futebol brasileiro.`;
    return `Conheça o ${name}${profile.city ? ` de ${profile.city}` : ""} no SOCCER VITAE. Plantel, comissão técnica e oportunidades.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Perfil não encontrado</p>
        <Button onClick={() => navigate("/")}>Voltar ao início</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{getTitle()}</title>
        <meta name="description" content={getDescription()} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://soccervitae.com/${profileType}/${slug}`} />
        <meta property="og:title" content={getTitle()} />
        <meta property="og:description" content={getDescription()} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src={logoGreen} alt="SOCCER VITAE logo" className="h-7 w-auto" loading="eager" />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </header>

        <section className="px-6 py-12 max-w-2xl mx-auto text-center">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={`Foto de ${profile.full_name || profile.username}`}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              loading="lazy"
              width={96}
              height={96}
            />
          )}
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {profile.full_name || profile.nickname || profile.username}
          </h1>
          <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
          {profile.city && <p className="text-muted-foreground text-sm mb-4">{profile.city}</p>}
          {profile.bio && <p className="text-foreground text-sm mb-6">{profile.bio}</p>}

          <Button onClick={() => navigate(`/${profile.username}`)}>Ver Perfil Completo</Button>
        </section>
      </div>
    </>
  );
};

export default PublicProfile;
