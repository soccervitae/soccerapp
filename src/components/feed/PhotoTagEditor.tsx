import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PhotoTag, useSearchFollowing } from "@/hooks/usePostTags";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoTagEditorProps {
  imageUrl: string;
  photoIndex: number;
  initialTags?: PhotoTag[];
  onApply: (tags: PhotoTag[]) => void;
  onCancel: () => void;
}

export const PhotoTagEditor = ({
  imageUrl,
  photoIndex,
  initialTags = [],
  onApply,
  onCancel,
}: PhotoTagEditorProps) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<PhotoTag[]>(
    initialTags.filter((t) => t.photoIndex === photoIndex)
  );
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const { data: followingList = [], isLoading } = useSearchFollowing(user?.id);

  // Filter following list based on search query
  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return followingList;
    const query = searchQuery.toLowerCase();
    return followingList.filter(
      (profile) =>
        profile.username.toLowerCase().includes(query) ||
        (profile.full_name && profile.full_name.toLowerCase().includes(query))
    );
  }, [followingList, searchQuery]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values between 5 and 95 to keep tags visible
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setTapPosition({ x: clampedX, y: clampedY });
    setIsSearching(true);
    setSearchQuery("");
  };

  const handleSelectUser = (profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  }) => {
    if (!tapPosition) return;
    
    // Don't allow tagging yourself
    if (profile.id === user?.id) return;

    // Check if user is already tagged in this photo
    if (tags.some((t) => t.userId === profile.id)) {
      setIsSearching(false);
      setTapPosition(null);
      return;
    }

    const newTag: PhotoTag = {
      userId: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      xPosition: tapPosition.x,
      yPosition: tapPosition.y,
      photoIndex,
    };

    setTags((prev) => [...prev, newTag]);
    setIsSearching(false);
    setTapPosition(null);
    setSearchQuery("");
  };

  const handleRemoveTag = (userId: string) => {
    setTags((prev) => prev.filter((t) => t.userId !== userId));
  };

  const handleApply = () => {
    // Merge new tags with tags from other photos
    const otherPhotoTags = initialTags.filter((t) => t.photoIndex !== photoIndex);
    onApply([...otherPhotoTags, ...tags]);
  };

  const getInitials = (name: string | null, username: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <span className="text-base font-bold text-foreground">Marcar Pessoas</span>
        <Button onClick={handleApply} size="sm" className="rounded font-semibold text-xs h-8 px-4">
          Aplicar
        </Button>
      </div>

      {/* Image with tags */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={imageRef}
          className="relative w-full aspect-square rounded-lg overflow-hidden cursor-crosshair"
          onClick={handleImageClick}
        >
          <img src={imageUrl} alt="Foto" className="w-full h-full object-cover" />

          {/* Existing tags */}
          {tags.map((tag) => (
            <button
              key={tag.userId}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.userId);
              }}
              className="absolute bg-foreground/90 text-background px-2 py-1 rounded text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 hover:bg-foreground transition-colors"
              style={{
                left: `${tag.xPosition}%`,
                top: `${tag.yPosition}%`,
              }}
            >
              @{tag.username}
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          ))}

          {/* Tap position indicator */}
          {tapPosition && (
            <div
              className="absolute w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{
                left: `${tapPosition.x}%`,
                top: `${tapPosition.y}%`,
              }}
            />
          )}

          {/* Instruction overlay */}
          {tags.length === 0 && !isSearching && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 pointer-events-none">
              <div className="bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg text-center">
                <span className="material-symbols-outlined text-[32px] text-foreground mb-2">
                  touch_app
                </span>
                <p className="text-sm text-foreground font-medium">Toque para marcar</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Users Sheet */}
        {isSearching && (
          <div className="mt-4 bg-card rounded-lg border border-border p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">
                search
              </span>
              <Input
                type="text"
                placeholder="Buscar entre quem você segue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setTapPosition(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-2">Pessoas que você segue</p>

            <ScrollArea className="h-[200px]">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isLoading && followingList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Você não segue ninguém ainda
                </div>
              )}

              {!isLoading && followingList.length > 0 && filteredFollowing.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum resultado para "{searchQuery}"
                </div>
              )}

              {!isLoading && filteredFollowing.length > 0 && (
                <div className="space-y-1">
                  {filteredFollowing.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectUser(profile)}
                      disabled={profile.id === user?.id || tags.some((t) => t.userId === profile.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(profile.full_name, profile.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">@{profile.username}</p>
                        {profile.full_name && (
                          <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                        )}
                      </div>
                      {tags.some((t) => t.userId === profile.id) && (
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          check_circle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Tagged Users List */}
        {tags.length > 0 && !isSearching && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Pessoas marcadas ({tags.length})
            </p>
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.userId}
                  className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={tag.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(tag.fullName, tag.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">@{tag.username}</p>
                    {tag.fullName && (
                      <p className="text-xs text-muted-foreground">{tag.fullName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTag(tag.userId)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
