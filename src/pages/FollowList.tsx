import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProfileByUsername, useProfile } from "@/hooks/useProfile";
import { useFollowers, useFollowing } from "@/hooks/useFollowList";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/profile/BottomNavigation";

const FollowList = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "followers";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { user } = useAuth();
  
  // Get profile by username or current user
  const { data: profileByUsername, isLoading: loadingByUsername } = useProfileByUsername(username || "");
  const { data: ownProfile, isLoading: loadingOwnProfile } = useProfile();
  
  const isOwnProfile = !username;
  const profile = isOwnProfile ? ownProfile : profileByUsername;
  const isLoading = isOwnProfile ? loadingOwnProfile : loadingByUsername;
  
  const userId = profile?.id || "";
  
  const { data: followers, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(userId);

  const handleUserClick = (userUsername: string) => {
    navigate(`/${userUsername}`);
  };

  const renderUserList = (users: typeof followers, loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">
            {activeTab === "followers" ? "group" : "favorite"}
          </span>
          <p className="text-muted-foreground text-sm mt-2">
            {activeTab === "followers" 
              ? "Nenhum torcedor ainda" 
              : "Não está torcendo por ninguém ainda"
            }
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user.username)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="relative">
              <img
                src={user.avatar_url || "/placeholder.svg"}
                alt={user.full_name || user.username}
                className="w-12 h-12 rounded-full object-cover bg-muted"
              />
              {user.conta_verificada && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
                  <span className="material-symbols-outlined text-[10px]">verified</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">
              chevron_right
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-32 h-6" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{profile?.full_name || profile?.username}</h1>
            <p className="text-xs text-muted-foreground">@{profile?.username}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-transparent h-12">
          <TabsTrigger 
            value="followers" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <span className="flex items-center gap-2">
              <span className="font-semibold">{followers?.length || 0}</span>
              <span className="text-muted-foreground">Torcedores</span>
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="following"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <span className="flex items-center gap-2">
              <span className="font-semibold">{following?.length || 0}</span>
              <span className="text-muted-foreground">Torcendo</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="mt-0">
          {renderUserList(followers, loadingFollowers)}
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          {renderUserList(following, loadingFollowing)}
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default FollowList;
