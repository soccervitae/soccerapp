import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Camera, ArrowLeft, Loader2, Check, X, ImageIcon } from "lucide-react";
import { PhotoCropEditor } from "@/components/feed/PhotoCropEditor";
import { getCroppedImg, CropData } from "@/hooks/useImageCrop";

const EditProfile = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadMedia = useUploadMedia();
  const { takePhoto, pickFromGallery, isNative } = useDeviceCamera();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    position: "",
    role: "",
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
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'cover' | 'avatar'>('cover');
  const [userType, setUserType] = useState<'atleta' | 'comissao_tecnica'>('atleta');
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
  useEffect(() => {
    if (profile && formData.username === "") {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        position: profile.position || "",
        role: profile.role || "",
        team: profile.team || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        birth_date: profile.birth_date || "",
        preferred_foot: profile.preferred_foot || "",
        gender: profile.gender || "",
      });
      // Set user type based on whether they have a role (technical staff) or not (athlete)
      setUserType(profile.role ? 'comissao_tecnica' : 'atleta');
    }
  }, [profile]);

  // Handle user type change
  const handleUserTypeChange = (newType: 'atleta' | 'comissao_tecnica') => {
    setUserType(newType);
    if (newType === 'atleta') {
      // Clear role when switching to athlete
      setFormData(prev => ({ ...prev, role: '' }));
    } else {
      // Clear position and physical stats when switching to technical staff
      setFormData(prev => ({ ...prev, position: '', height: '', weight: '', preferred_foot: '' }));
    }
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    
    const hasFormChanges = 
      formData.full_name !== (profile.full_name || "") ||
      formData.username !== (profile.username || "") ||
      formData.bio !== (profile.bio || "") ||
      formData.position !== (profile.position || "") ||
      formData.role !== (profile.role || "") ||
      formData.team !== (profile.team || "") ||
      formData.height !== (profile.height?.toString() || "") ||
      formData.weight !== (profile.weight?.toString() || "") ||
      formData.birth_date !== (profile.birth_date || "") ||
      formData.preferred_foot !== (profile.preferred_foot || "") ||
      formData.gender !== (profile.gender || "");
    
    const hasMediaChanges = avatarFile !== null || coverFile !== null;
    
    return hasFormChanges || hasMediaChanges;
  }, [formData, profile, avatarFile, coverFile]);

  // Handle back button click
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      navigate(-1);
    }
  };

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageToCrop(imageUrl);
      setCropType('avatar');
      setShowCropEditor(true);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageToCrop(imageUrl);
      setCropType('cover');
      setShowCropEditor(true);
    }
  };

  const handleCropApply = async (cropData: CropData) => {
    if (!imageToCrop) return;

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, cropData.croppedAreaPixels);
      const croppedFile = new File(
        [croppedBlob],
        `${cropType}-cropped-${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      const croppedPreview = URL.createObjectURL(croppedBlob);

      if (cropType === 'cover') {
        setCoverFile(croppedFile);
        setCoverPreview(croppedPreview);
      } else {
        setAvatarFile(croppedFile);
        setAvatarPreview(croppedPreview);
      }

      setShowCropEditor(false);
      setImageToCrop(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Erro ao recortar imagem');
    }
  };

  const handleCropCancel = () => {
    setShowCropEditor(false);
    setImageToCrop(null);
  };

  // Process camera/gallery image for cover
  const processCameraImage = async (type: 'cover' | 'avatar', source: 'camera' | 'gallery') => {
    setIsProcessingImage(true);
    try {
      const image = source === 'camera' ? await takePhoto() : await pickFromGallery();
      
      if (image) {
        // Open crop editor with the selected image
        setImageToCrop(image.webPath);
        setCropType(type);
        
        if (type === 'cover') {
          setCoverMenuOpen(false);
        } else {
          setAvatarMenuOpen(false);
        }
        
        setShowCropEditor(true);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Erro ao processar imagem');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCoverIconClick = () => {
    if (isNative) {
      setCoverMenuOpen(true);
    } else {
      coverInputRef.current?.click();
    }
  };

  const handleAvatarIconClick = () => {
    if (isNative) {
      setAvatarMenuOpen(true);
    } else {
      avatarInputRef.current?.click();
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
        role: formData.role || null,
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
    <>
      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(-1)}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={handleBackClick}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground">Editar Perfil</h1>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </header>

      <form id="edit-profile-form" onSubmit={handleSubmit} className="pt-14 pb-8">
        {/* Cover Photo */}
        <div className="relative mb-14">
          <div className="w-full h-36 bg-muted overflow-hidden">
            {coverPreview || profile?.cover_url ? (
              <img
                src={coverPreview || profile?.cover_url}
                alt="Capa"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-1">
                <span className="material-symbols-outlined text-3xl text-muted-foreground">add_photo_alternate</span>
                <span className="text-xs text-muted-foreground">Adicionar foto de capa</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <button
            type="button"
            onClick={handleCoverIconClick}
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

          {/* Avatar - positioned inside cover area, below edit icon */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary to-emerald-600">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile?.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full border-4 border-background bg-muted object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-background bg-muted flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-muted-foreground">person</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarIconClick}
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
            <div className="flex items-center gap-1.5">
              <Label>Nome de Usuário</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="material-symbols-outlined text-muted-foreground text-[16px] cursor-help">info</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>O nome de usuário não pode ser alterado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50 text-muted-foreground">
              @{formData.username}
            </div>
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

          {/* Profile Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="profile_type">Tipo de Perfil</Label>
            <Select 
              value={userType} 
              onValueChange={(value: 'atleta' | 'comissao_tecnica') => handleUserTypeChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atleta">Atleta</SelectItem>
                <SelectItem value="comissao_tecnica">Comissão Técnica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position for athletes, Role for technical staff */}
          <div className="grid grid-cols-2 gap-4">
            {userType === 'comissao_tecnica' ? (
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Treinador"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="position">Posição</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Atacante"
                />
              </div>
            )}

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

          {/* Physical Stats - Only for athletes */}
          {userType === 'atleta' && (
            <>
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
            </>
          )}

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

        </div>
      </form>

      {/* Cover Photo Menu Sheet */}
      <Sheet open={coverMenuOpen} onOpenChange={setCoverMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Alterar foto de capa</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-2">
            <button
              onClick={() => processCameraImage('cover', 'camera')}
              disabled={isProcessingImage}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              {isProcessingImage ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Camera className="w-5 h-5 text-primary" />
              )}
              <span className="font-medium">Tirar foto</span>
            </button>
            <button
              onClick={() => processCameraImage('cover', 'gallery')}
              disabled={isProcessingImage}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              {isProcessingImage ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <ImageIcon className="w-5 h-5 text-primary" />
              )}
              <span className="font-medium">Escolher da galeria</span>
            </button>
            <button
              onClick={() => setCoverMenuOpen(false)}
              className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <span>Cancelar</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Avatar Photo Menu Sheet */}
      <Sheet open={avatarMenuOpen} onOpenChange={setAvatarMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Alterar foto de perfil</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-2">
            <button
              onClick={() => processCameraImage('avatar', 'camera')}
              disabled={isProcessingImage}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              {isProcessingImage ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Camera className="w-5 h-5 text-primary" />
              )}
              <span className="font-medium">Tirar foto</span>
            </button>
            <button
              onClick={() => processCameraImage('avatar', 'gallery')}
              disabled={isProcessingImage}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              {isProcessingImage ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <ImageIcon className="w-5 h-5 text-primary" />
              )}
              <span className="font-medium">Escolher da galeria</span>
            </button>
            <button
              onClick={() => setAvatarMenuOpen(false)}
              className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <span>Cancelar</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Image Crop Editor */}
      {showCropEditor && imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-background">
          <PhotoCropEditor
            imageUrl={imageToCrop}
            defaultAspectRatioId={cropType === 'cover' ? 'landscape' : 'square'}
            cropShape={cropType === 'avatar' ? 'round' : 'rect'}
            hideAspectRatioOptions
            onApply={handleCropApply}
            onCancel={handleCropCancel}
          />
        </div>
      )}
    </main>
    </>
  );
};

export default EditProfile;
