import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, User, Calendar, Ruler, Weight, Target, Flag, Footprints, Lock, Users, Dumbbell } from "lucide-react";

interface Country {
  id: number;
  nome: string;
  bandeira_url: string | null;
}

const CompleteProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const [username, setUsername] = useState("");
  const [profileType, setProfileType] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState<string>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [preferredFoot, setPreferredFoot] = useState("");
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    profileType: false,
    birthDate: false,
    position: false,
    nationality: false,
    height: false,
    weight: false,
    preferredFoot: false,
  });

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      const { data } = await supabase.from("paises").select("id, nome, bandeira_url").order("nome");
      if (data) setCountries(data);
    };
    loadCountries();
  }, []);

  // Load positions based on user gender
  useEffect(() => {
    const loadPositions = async () => {
      if (!profile?.gender) return;
      
      const isFemale = profile.gender === "mulher" || profile.gender === "feminino" || profile.gender === "female";
      const table = isFemale ? "posicao_feminina" : "posicao_masculina";
      
      const { data } = await supabase.from(table).select("id, name").order("name");
      if (data) setPositions(data);
    };
    loadPositions();
  }, [profile?.gender]);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      if (profile.username) setUsername(profile.username);
      if (profile.role) setProfileType(profile.role);
      if (profile.birth_date) setBirthDate(profile.birth_date);
      if (profile.position) setPosition(profile.position);
      if (profile.height) setHeight(profile.height.toString());
      if (profile.weight) setWeight(profile.weight.toString());
      if (profile.preferred_foot) setPreferredFoot(profile.preferred_foot);
    }
  }, [profile]);

  // Check if profile type is athlete
  const isAthlete = profileType === "atleta";

  // Validations (username removed - auto-generated and read-only)
  const isProfileTypeValid = !!profileType;
  const isBirthDateValid = !!birthDate;
  const isPositionValid = isAthlete ? !!position : true; // Only required for athletes
  const isNationalityValid = !!nationality;
  const isHeightValid = isAthlete ? (!!height && Number(height) > 0 && Number(height) <= 250) : true;
  const isWeightValid = isAthlete ? (!!weight && Number(weight) > 0 && Number(weight) <= 200) : true;
  const isPreferredFootValid = isAthlete ? !!preferredFoot : true;

  const isFormValid =
    isProfileTypeValid &&
    isBirthDateValid &&
    isPositionValid &&
    isNationalityValid &&
    isHeightValid &&
    isWeightValid &&
    isPreferredFootValid;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldStatus = (isValid: boolean, isTouched: boolean) => {
    if (!isTouched) return "neutral";
    return isValid ? "valid" : "invalid";
  };

  const getInputClass = (status: string) => {
    if (status === "valid") return "border-green-500 focus:ring-green-500";
    if (status === "invalid") return "border-destructive focus:ring-destructive";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) return;

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        role: profileType,
        birth_date: birthDate,
        nationality: Number(nationality),
        profile_completed: true,
      };

      // Add athlete-specific fields only for athletes
      if (isAthlete) {
        updateData.position = position;
        updateData.height = Number(height);
        updateData.weight = Number(weight);
        updateData.preferred_foot = preferredFoot;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // Invalidar cache do perfil para que o ProtectedRoute veja os dados atualizados
      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Perfil completo!");
      navigate("/welcome");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate completed fields based on profile type
  const athleteFields = [isProfileTypeValid, isBirthDateValid, isPositionValid, isNationalityValid, isHeightValid, isWeightValid, isPreferredFootValid];
  const staffFields = [isProfileTypeValid, isBirthDateValid, isNationalityValid];
  
  const completedFields = (isAthlete ? athleteFields : staffFields).filter(Boolean).length;
  const totalFields = isAthlete ? 7 : 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8">
        <h1 className="text-2xl font-bold text-center">Complete seu Perfil</h1>
        <p className="text-center text-primary-foreground/80 mt-2">
          Preencha os campos obrigatórios para continuar
        </p>
      </div>

      {/* Progress indicator */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {completedFields} / {totalFields} campos
          </span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(completedFields / totalFields) * 100}%`,
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-md mx-auto">
        {/* Username - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome de usuário
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              value={username}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          </div>
          <p className="text-xs text-muted-foreground">
            Seu nome de usuário foi gerado automaticamente e não pode ser alterado.
          </p>
        </div>

        {/* Profile Type - Atleta ou Comissão Técnica */}
        <div className="space-y-2">
          <Label htmlFor="profileType" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tipo de perfil <span className="text-destructive">*</span>
          </Label>
          <Select value={profileType} onValueChange={(value) => { setProfileType(value); handleBlur("profileType"); }}>
            <SelectTrigger className={getInputClass(getFieldStatus(isProfileTypeValid, touched.profileType))}>
              <SelectValue placeholder="Selecione o tipo de perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atleta">Atleta</SelectItem>
              <SelectItem value="comissao_tecnica">Comissão Técnica</SelectItem>
            </SelectContent>
          </Select>
          {touched.profileType && !isProfileTypeValid && (
            <p className="text-xs text-destructive">Selecione o tipo de perfil.</p>
          )}
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label htmlFor="birthDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data de nascimento <span className="text-destructive">*</span>
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            onBlur={() => handleBlur("birthDate")}
            className={getInputClass(getFieldStatus(isBirthDateValid, touched.birthDate))}
            max={new Date().toISOString().split("T")[0]}
          />
          {touched.birthDate && !isBirthDateValid && (
            <p className="text-xs text-destructive">Selecione sua data de nascimento.</p>
          )}
        </div>

        {/* Position - Only for Athletes */}
        {isAthlete && (
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Posição <span className="text-destructive">*</span>
            </Label>
            <Select value={position} onValueChange={(value) => { setPosition(value); handleBlur("position"); }}>
              <SelectTrigger className={getInputClass(getFieldStatus(isPositionValid, touched.position))}>
                <SelectValue placeholder="Selecione sua posição" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.name}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.position && !isPositionValid && (
              <p className="text-xs text-destructive">Selecione sua posição em campo.</p>
            )}
          </div>
        )}

        {/* Nationality */}
        <div className="space-y-2">
          <Label htmlFor="nationality" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Nacionalidade <span className="text-destructive">*</span>
          </Label>
          <Select value={nationality} onValueChange={(value) => { setNationality(value); handleBlur("nationality"); }}>
            <SelectTrigger className={getInputClass(getFieldStatus(isNationalityValid, touched.nationality))}>
              <SelectValue placeholder="Selecione seu país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id.toString()}>
                  <span className="flex items-center gap-2">
                    {country.bandeira_url && (
                      <img src={country.bandeira_url} alt="" className="w-5 h-3 object-cover rounded-sm" />
                    )}
                    {country.nome}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.nationality && !isNationalityValid && (
            <p className="text-xs text-destructive">Selecione sua nacionalidade.</p>
          )}
        </div>

        {/* Height & Weight Row - Only for Athletes */}
        {isAthlete && (
          <div className="grid grid-cols-2 gap-4">
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Altura (cm) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={() => handleBlur("height")}
                  placeholder="180"
                  min="100"
                  max="250"
                  className={getInputClass(getFieldStatus(isHeightValid, touched.height))}
                />
                {touched.height && isHeightValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {touched.height && !isHeightValid && height && (
                <p className="text-xs text-destructive">Altura inválida.</p>
              )}
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Peso (kg) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onBlur={() => handleBlur("weight")}
                  placeholder="75"
                  min="30"
                  max="200"
                  step="0.1"
                  className={getInputClass(getFieldStatus(isWeightValid, touched.weight))}
                />
                {touched.weight && isWeightValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {touched.weight && !isWeightValid && weight && (
                <p className="text-xs text-destructive">Peso inválido.</p>
              )}
            </div>
          </div>
        )}

        {/* Preferred Foot - Only for Athletes */}
        {isAthlete && (
          <div className="space-y-2">
            <Label htmlFor="preferredFoot" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Pé preferido <span className="text-destructive">*</span>
            </Label>
            <Select value={preferredFoot} onValueChange={(value) => { setPreferredFoot(value); handleBlur("preferredFoot"); }}>
              <SelectTrigger className={getInputClass(getFieldStatus(isPreferredFootValid, touched.preferredFoot))}>
                <SelectValue placeholder="Selecione o pé preferido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">Direito</SelectItem>
                <SelectItem value="left">Esquerdo</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
            {touched.preferredFoot && !isPreferredFootValid && (
              <p className="text-xs text-destructive">Selecione seu pé preferido.</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Completar Perfil"
          )}
        </Button>

        {!isFormValid && (
          <p className="text-xs text-center text-muted-foreground">
            Preencha todos os campos obrigatórios para continuar
          </p>
        )}
      </form>
    </div>
  );
};

export default CompleteProfile;
