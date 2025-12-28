import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, ArrowLeft, Loader2, Check, X } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadMedia = useUploadMedia();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    position: "",
    team: "",
    height: "",
    weight: "",
    birth_date: "",
    preferred_foot: "",
    gender: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    // Don't check if it's the current user's username
    if (profile && username === profile.username) {
      setUsernameStatus("available");
      return;
    }

    setUsernameStatus("checking");

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus(data ? "taken" : "available");
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (sanitized.length <= 20) {
      setFormData({ ...formData, username: sanitized });

      // Debounce the check
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        position: profile.position || "",
        team: profile.team || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        birth_date: profile.birth_date || "",
        preferred_foot: profile.preferred_foot || "",
        gender: profile.gender || "",
      });
    }
  });

  // Update form when profile changes
  if (profile && !formData.username) {
    setFormData({
      full_name: profile.full_name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      position: profile.position || "",
      team: profile.team || "",
      height: profile.height?.toString() || "",
      weight: profile.weight?.toString() || "",
      birth_date: profile.birth_date || "",
      preferred_foot: profile.preferred_foot || "",
      gender: profile.gender || "",
    });
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let avatarUrl = profile?.avatar_url;
      let coverUrl = profile?.cover_url;

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadMedia.uploadMedia(avatarFile, "avatars");
        if (url) avatarUrl = url;
      }

      // Upload cover if changed
      if (coverFile) {
        const url = await uploadMedia.uploadMedia(coverFile, "covers");
        if (url) coverUrl = url;
      }

      // Update profile
      await updateProfile.mutateAsync({
        full_name: formData.full_name || null,
        username: formData.username,
        bio: formData.bio || null,
        position: formData.position || null,
        team: formData.team || null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        birth_date: formData.birth_date || null,
        preferred_foot: formData.preferred_foot || null,
        gender: formData.gender || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });

      navigate("/profile");
    } catch (error) {
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground">Editar Perfil</h1>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
            className="p-2 -mr-2 text-primary hover:bg-muted rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <form id="edit-profile-form" onSubmit={handleSubmit} className="pt-14 pb-8">
        {/* Cover Photo */}
        <div className="relative">
          <div className="w-full h-36 bg-muted overflow-hidden">
            <img
              src={coverPreview || profile?.cover_url || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=300&fit=crop"}
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground p-2 rounded-full hover:bg-background transition-colors"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <div className="flex justify-center -mt-12 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary to-emerald-600">
              <img
                src={avatarPreview || profile?.avatar_url || "/placeholder.svg"}
                alt="Avatar"
                className="w-full h-full rounded-full border-4 border-background bg-muted object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-4 mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="username">Nome de Usuário</Label>
              <div className="flex items-center gap-2">
                {usernameStatus === "checking" && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <Check className="w-3 h-3" /> Disponível
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <X className="w-3 h-3" /> Indisponível
                  </span>
                )}
                <span className={`text-xs ${formData.username.length > 20 ? "text-destructive" : "text-muted-foreground"}`}>
                  {formData.username.length}/20
                </span>
              </div>
            </div>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="usuario"
              required
              maxLength={20}
              className={usernameStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras, números e underline (_)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className={`text-xs ${formData.bio.length > 150 ? "text-destructive" : "text-muted-foreground"}`}>
                {formData.bio.length}/150
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  setFormData({ ...formData, bio: e.target.value });
                }
              }}
              placeholder="Fale um pouco sobre você..."
              rows={3}
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Posição</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Atacante"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Time</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="Ex: Flamengo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="175"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homem">Homem</SelectItem>
                  <SelectItem value="mulher">Mulher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_foot">Pé Preferido</Label>
            <select
              id="preferred_foot"
              value={formData.preferred_foot}
              onChange={(e) => setFormData({ ...formData, preferred_foot: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selecione</option>
              <option value="right">Direito</option>
              <option value="left">Esquerdo</option>
              <option value="both">Ambos</option>
            </select>
          </div>

        </div>
      </form>
    </main>
  );
};

export default EditProfile;
