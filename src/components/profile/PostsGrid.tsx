import { useState } from "react";

const posts = [
  { 
    id: 1, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLqeIIQNj7lJ4UZKRCP40PnLkBHtgBkyI_2kry6H_5BuwxnEoAXcjDCEs8Po4CA1ge_GSR2oom0YWJta2YjPGkS8gafhyhF7bLWoi9k-1MMZMRqGxNwe4X4UdBqMHehiv5RdYSbfaA4XLhjEc1n5c8-syMUcQ08wWSYins72t38Fu10da9ExOv2a07BKOyeZoQEO3LptTbkbJWv_1K2qwplvNWCZTEssC-Jz-fo7qYnJvANVcsrV2GR9qBx7I7vV8VpYMDAsXwSdI",
    alt: "Action shot of player kicking ball",
    type: "image"
  },
  { 
    id: 2, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWUM3uH-ldfvLA6hGXbwmiRMIH67DqzxS85-cX2-r153QwT1Rrjgd8RD5ehd-MebF4QzySrhz-dYrmJZ0LdVLrBqVb_boUxLQC4ReHu7QLAe89D2psXCuC-e2ySkI57uihbX5rNt_sJaQJ1lz50pv4hP_kHaLr2FQbNHPCTSp1kWBg2h3R2gnhRvuqC-AlyVRj0X0Tmni_k7MVvWSE_ip0DBnaXQA8WvoqXNfsHz5kF930J5sH4bBX2QoLXA9pjoMk85UULVzl9bI",
    alt: "Close up of soccer cleats on grass",
    type: "carousel"
  },
  { 
    id: 3, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnex1kY6o07S7ZEugAwUszzydNCygtZxroFoveqAEmZVMJFRTsKurafS6XAmQ3hjL3ghqOlJEYS0ilr1VuHiwwm1T-2sK-PrC7KrXRlMV25fbLtF-ER_u6VsDwHfAaQ1X3FteffqYZ2CbXplt5xgSOThh6XsYjnkWs2-ppzaF0siGczuBVZONRM73ayCPxJ2cgzj0-amWpfRWzOVQiIiiMQSKnXzzcf3XKLbBq0U3hsWOm-F2yoL8Zq2m1S7IMPG-rhmhV-8t6N18",
    alt: "Player celebrating with teammates",
    type: "image"
  },
  { 
    id: 4, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnetVoCAeZqfdgiWawbDgb70rrCl9cRPYNoKEgaB9W4J96ktFAMiKfQF993g6DaOz41ZPyMcZsPHSnZFCX2Ko7P9XqEn_V2kZZq9makQUKAMBr30AOLbF8_MhtCd1x8tKI7_8jDUTn7hrxeKHach7thlfAjWuyeP4-PbmSjB-Trl4GDZuOl6P1eQoIdNzbER5vtA98ntJvPlT0LzjANpYky_KRr2HrNgYei2JvfEHqJhrGukTtx_laB1GtVRlTiMl9qoyEhz5pLdk",
    alt: "Soccer match penalty kick scene",
    type: "video"
  },
  { 
    id: 5, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgQpLpcRLMvXVAYea-NZkjU62Er7xk4VzpsmGK2yexQdcG_mWb_lyutGmffhDrGS_39rTL8PL5sQ2A1k2l70gt5lab2z6pkvdp4v9rQ_eN5I5TvvuUAGDCRyXpYO7t_SbCoyCPZ_Bfo6yqtqxuiepWmkwoCFeuvwypa41TbKSWxNhWLGzQrCvT7gFWAD2pziNJM-wjQPBjPFmE0eiE4wrnxPzEfUt6R8qIrTj9TITf6DGZef_rV5_KMokgPyzzoRvy8gMrDWZhW_E",
    alt: "Player holding a trophy",
    type: "image"
  },
  { 
    id: 6, 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoH00fcsS2hmK9tVBp74eYbQMTZWMHKIYOFTMVpmp0tV7ml8XhVH3RF5GXoxZj3O8_zU-Em3hlYb-VH0YzPNkvtNKy3A3NjcmaHma13U3AhKkY8gLoX3HNXESLteKp3R1a4AspHdOTu5HUdGbxXkG58BGO75UGUiPYJxXEEl2Sx1BR-jMdeP7EvKkQsS4RP6ySGktN9tk5J-04HknAv1pWizPf2XLnqvybwRILTvLlpb_KgiDZakmAJ04trC5fh4Q3baQS9xio",
    alt: "Low angle shot of soccer ball on field",
    type: "image"
  },
];

type Tab = "posts" | "videos" | "tagged";

export const PostsGrid = () => {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

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
      <div className="grid grid-cols-3 gap-1 mb-8">
        {posts.map((post) => (
          <div key={post.id} className="aspect-square bg-muted relative group overflow-hidden cursor-pointer">
            <img 
              src={post.image} 
              alt={post.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
            
            {post.type === "carousel" && (
              <div className="absolute top-2 right-2 text-background">
                <span className="material-symbols-outlined text-[18px] drop-shadow-md">content_copy</span>
              </div>
            )}
            
            {post.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                <span className="material-symbols-outlined text-background text-[32px] drop-shadow-lg">play_arrow</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
