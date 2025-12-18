const stories = [
  {
    id: 0,
    isAddStory: true,
    name: "Seu story",
    avatar: "",
    image: "",
  },
  {
    id: 1,
    name: "Gabriel Santos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=500&fit=crop",
    hasNewStory: true,
  },
  {
    id: 2,
    name: "Ana Carolina",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=300&h=500&fit=crop",
    hasNewStory: true,
  },
  {
    id: 3,
    name: "Pedro Henrique",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=300&h=500&fit=crop",
    hasNewStory: true,
  },
  {
    id: 4,
    name: "Mariana Costa",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&h=500&fit=crop",
    hasNewStory: false,
  },
  {
    id: 5,
    name: "Lucas Silva",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB18b2e4H8Vilu_1rtxonCQj9vAbC1EoysVCEWwBgUUgbOF-Bn6rkp0yDuDlhC79_hCKp-GBhEYsWYVUNvfnntM12RTwF5uu9JD6jn_qN37Woe4qQ5a7YR1CcruWB-DzMIG1d3H39Vzkuk62xFJV4y2aBs-rS2A3zj9NtTjH2DCUzCz_eveY6i6w4PFt7B2vJi13Ows29u2Vt-I0ROOVImcd5oa-LNy__PIB-223eqMByqUaHUp9I_EGjWk0NBo6Mk9BHdwc63_G10",
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=500&fit=crop",
    hasNewStory: true,
  },
];

export const FeedStories = () => {
  return (
    <div className="bg-background border-b border-border">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 px-4">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex-none w-28 cursor-pointer group"
          >
            <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
              {story.isAddStory ? (
                // Add Story Card
                <div className="w-full h-full bg-muted flex flex-col">
                  <div className="flex-1 bg-gradient-to-b from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-[24px] text-primary-foreground">add</span>
                    </div>
                  </div>
                  <div className="bg-background px-2 py-3 text-center">
                    <p className="text-xs font-semibold text-foreground truncate">Criar story</p>
                  </div>
                </div>
              ) : (
                // Regular Story Card
                <>
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                  
                  {/* Avatar */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-9 h-9 rounded-full p-[2px] ${story.hasNewStory ? 'bg-gradient-to-tr from-primary to-emerald-400' : 'bg-muted'}`}>
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="w-full h-full rounded-full border-2 border-background object-cover"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-semibold text-white truncate drop-shadow-md">
                      {story.name?.split(' ')[0]}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
