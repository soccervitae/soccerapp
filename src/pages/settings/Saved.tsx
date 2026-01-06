import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSavedPosts, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileFeedSheet } from "@/components/profile/ProfileFeedSheet";

interface SavedPost {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
}

export default function Saved() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: savedPosts = [], isLoading: postsLoading } = useUserSavedPosts(user?.id);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const handlePostClick = (index: number) => {
    setSelectedPostIndex(index);
  };

  // Filter posts with media for grid display
  const postsWithMedia = savedPosts.filter((post: SavedPost) => post.media_url);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Salvos</h1>
      </header>

      <div className="pt-14 pb-20">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-transparent border-b border-border rounded-none h-12">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full font-semibold"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="highlights"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full font-semibold"
            >
              Destaques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/5]" />
                ))}
              </div>
            ) : postsWithMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4">
                  bookmark
                </span>
                <p className="text-muted-foreground text-center">
                  Você ainda não salvou nenhum post
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {postsWithMedia.map((post: SavedPost, index: number) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostClick(index)}
                    className="aspect-[4/5] relative overflow-hidden bg-muted group"
                  >
                    {post.media_type === "video" ? (
                      <video
                        src={post.media_url || ""}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : post.media_url?.includes(",") ? (
                      <>
                        <img
                          src={post.media_url.split(",")[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="material-symbols-outlined text-white drop-shadow-lg text-[20px]">
                            collections
                          </span>
                        </div>
                      </>
                    ) : (
                      <img
                        src={post.media_url || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-white">
                        <span className="material-symbols-outlined text-[20px] fill-icon">favorite</span>
                        <span className="font-semibold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                        <span className="font-semibold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <span className="material-symbols-outlined text-[64px] text-muted-foreground/50 mb-4">
                auto_awesome
              </span>
              <p className="text-muted-foreground text-center">
                Você ainda não salvou nenhum destaque
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Feed Sheet */}
      {selectedPostIndex !== null && profile && (
        <ProfileFeedSheet
          isOpen={selectedPostIndex !== null}
          onClose={() => setSelectedPostIndex(null)}
          posts={savedPosts as any}
          initialPostIndex={selectedPostIndex}
          profile={{
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            conta_verificada: profile.conta_verificada,
            gender: profile.gender,
            role: profile.role,
            posicaomas: profile.posicaomas,
            posicaofem: profile.posicaofem,
            funcao: profile.funcao,
          }}
        />
      )}
    </div>
  );
}
