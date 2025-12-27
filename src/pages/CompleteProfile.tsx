import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, X, User, Calendar, Ruler, Weight, Target, Flag, Footprints } from "lucide-react";

interface Country {
  id: number;
  nome: string;
  bandeira_url: string | null;
}

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [position, setPosition] = useState("");
  const [nationality, setNationality] = useState<string>("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [preferredFoot, setPreferredFoot] = useState("");
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    birthDate: false,
    position: false,
    nationality: false,
    height: false,
    weight: false,
    preferredFoot: false,
  });

  // Load countries and positions
  useEffect(() => {
    const loadData = async () => {
      const [countriesRes, positionsRes] = await Promise.all([
        supabase.from("paises").select("id, nome, bandeira_url").order("nome"),
        supabase.from("posicao_masculina").select("id, name").order("name"),
      ]);

      if (countriesRes.data) setCountries(countriesRes.data);
      if (positionsRes.data) setPositions(positionsRes.data);
    };
    loadData();
  }, []);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      if (profile.username) setUsername(profile.username);
      if (profile.birth_date) setBirthDate(profile.birth_date);
      if (profile.position) setPosition(profile.position);
      if (profile.height) setHeight(profile.height.toString());
      if (profile.weight) setWeight(profile.weight.toString());
      if (profile.preferred_foot) setPreferredFoot(profile.preferred_foot);
    }
  }, [profile]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user?.id || "")
        .maybeSingle();

      setIsCheckingUsername(false);
      setUsernameAvailable(!data && !error);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user?.id]);

  // Count numbers in username
  const countNumbers = (str: string): number => {
    return (str.match(/\d/g) || []).length;
  };

  // Validations
  const usernameNumberCount = countNumbers(username);
  const isUsernameValid = username.length >= 3 && usernameNumberCount >= 3 && usernameAvailable === true;
  const isBirthDateValid = !!birthDate;
  const isPositionValid = !!position;
  const isNationalityValid = !!nationality;
  const isHeightValid = !!height && Number(height) > 0 && Number(height) <= 250;
  const isWeightValid = !!weight && Number(weight) > 0 && Number(weight) <= 200;
  const isPreferredFootValid = !!preferredFoot;

  const isFormValid =
    isUsernameValid &&
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
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          birth_date: birthDate,
          position,
          nationality: Number(nationality),
          height: Number(height),
          weight: Number(weight),
          preferred_foot: preferredFoot,
          profile_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

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
            {[isUsernameValid, isBirthDateValid, isPositionValid, isNationalityValid, isHeightValid, isWeightValid, isPreferredFootValid].filter(Boolean).length} / 7 campos
          </span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${([isUsernameValid, isBirthDateValid, isPositionValid, isNationalityValid, isHeightValid, isWeightValid, isPreferredFootValid].filter(Boolean).length / 7) * 100}%`,
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-md mx-auto">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome de usuário <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onBlur={() => handleBlur("username")}
              placeholder="jogador123"
              className={getInputClass(getFieldStatus(isUsernameValid, touched.username))}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!isCheckingUsername && touched.username && isUsernameValid && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {!isCheckingUsername && touched.username && !isUsernameValid && username.length > 0 && (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Mínimo 3 caracteres com pelo menos 3 números (ex: maria123, joao007)
          </p>
          {touched.username && username.length > 0 && usernameNumberCount < 3 && (
            <p className="text-xs text-destructive">
              Faltam {3 - usernameNumberCount} número(s). Adicione mais números ao username.
            </p>
          )}
          {touched.username && usernameAvailable === false && (
            <p className="text-xs text-destructive">Este nome de usuário já está em uso.</p>
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

        {/* Position */}
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

        {/* Height & Weight Row */}
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

        {/* Preferred Foot */}
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
