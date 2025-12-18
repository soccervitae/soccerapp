import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedStories } from "@/components/feed/FeedStories";
import { FeedPost } from "@/components/feed/FeedPost";
import { BottomNavigation } from "@/components/profile/BottomNavigation";

const posts = [
  {
    id: 1,
    athlete: {
      name: "Gabriel Santos",
      username: "gabriel.santos_9",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      position: "Meio-Campo",
      team: "Flamengo",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop",
    caption: "Mais um treino intenso finalizado! 💪⚽ Preparação a todo vapor para o próximo clássico. #Treino #Foco #Futebol",
    likes: 2847,
    comments: 156,
    timeAgo: "2h",
    liked: false,
  },
  {
    id: 2,
    athlete: {
      name: "Ana Carolina",
      username: "ana.carolina_11",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      position: "Atacante",
      team: "Corinthians Feminino",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=600&fit=crop",
    caption: "Gol da vitória no último minuto! 🎉 Que sensação incrível! Obrigada a todas as torcedoras que estavam lá! ❤️🖤",
    likes: 5621,
    comments: 423,
    timeAgo: "4h",
    liked: true,
  },
  {
    id: 3,
    athlete: {
      name: "Pedro Henrique",
      username: "pedro.h_7",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      position: "Lateral Direito",
      team: "Palmeiras",
      verified: false,
    },
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=600&fit=crop",
    caption: "Dia de jogo é dia de guerra! Vamos com tudo! 🐷💚 #AvantiPalestra",
    likes: 1893,
    comments: 89,
    timeAgo: "6h",
    liked: false,
  },
  {
    id: 4,
    athlete: {
      name: "Mariana Costa",
      username: "mari.costa_23",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      position: "Goleira",
      team: "São Paulo FC",
      verified: true,
    },
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop",
    caption: "Defesa difícil no treino de hoje! A preparação não para 🧤⚽ #Goleira #Treino",
    likes: 3412,
    comments: 201,
    timeAgo: "8h",
    liked: false,
  },
];

const Feed = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <FeedHeader />
      
      <main className="pt-28">
        <FeedStories />
        
        {posts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </main>

      <BottomNavigation activeTab="home" />
    </div>
  );
};

export default Feed;
