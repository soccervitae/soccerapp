import { useState } from "react";

interface Post {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
}

interface PostsGridProps {
  posts: Post[];
  isLoading?: boolean;
}

type Tab = "posts" | "videos" | "tagged";

export const PostsGrid = ({ posts, isLoading = false }: PostsGridProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const filteredPosts = posts.filter(post => {
    if (activeTab === "videos") return post.media_type === "video";
    if (activeTab === "posts") return post.media_type !== "video";
    return true;
  });

  if (isLoading) {
    return (
      <section>
        <div className="flex border-b border-border mb-4">
          {["posts", "videos", "tagged"].map((tab) => (
            <div key={tab} className="flex-1 pb-3 flex items-center justify-center">
              <div className="w-16 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Tabs */}
      <div className="flex border-b border-border mb-4 sticky top-[100px] bg-background z-20 pt-2">
        <button 
          onClick={() => setActiveTab("posts")}
          className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "posts" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] align-bottom mr-1">grid_view</span>
          Posts
        </button>
        <button 
          onClick={() => setActiveTab("videos")}
          className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "videos" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] align-bottom mr-1">movie</span>
          Vídeos
        </button>
        <button 
          onClick={() => setActiveTab("tagged")}
          className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${
            activeTab === "tagged" ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] align-bottom mr-1">assignment_ind</span>
          Marcado
        </button>
      </div>

      {/* Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 mb-8">
          {filteredPosts.map((post) => (
            <div key={post.id} className="aspect-square bg-muted relative group overflow-hidden cursor-pointer">
              {post.media_url ? (
                post.media_type === "video" ? (
                  <>
                    <video 
                      src={post.media_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                      <span className="material-symbols-outlined text-background text-[32px] drop-shadow-lg">play_arrow</span>
                    </div>
                  </>
                ) : (
                  <img 
                    src={post.media_url} 
                    alt={post.content}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <p className="text-xs text-muted-foreground line-clamp-3 text-center">{post.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">photo_library</span>
          <p className="text-muted-foreground text-sm mt-2">Nenhum post ainda</p>
        </div>
      )}
    </section>
  );
};
