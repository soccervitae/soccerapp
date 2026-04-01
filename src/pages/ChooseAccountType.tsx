import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, ClipboardList, Shield, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AccountType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

interface Country {
  id: number;
  nome: string;
  bandeira_url: string | null;
}

interface State {
  id: number;
  nome: string;
  uf: string;
  bandeira_url: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  user: <User className="h-8 w-8" />,
  clipboard: <ClipboardList className="h-8 w-8" />,
  shield: <Shield className="h-8 w-8" />,
};

const ChooseAccountType = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [nickname, setNickname] = useState("");
  const [teamName, setTeamName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [position, setPosition] = useState("");
  const [staffFunction, setStaffFunction] = useState("");
  const [nationality, setNationality] = useState("");
  const [estado, setEstado] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [preferredFoot, setPreferredFoot] = useState("");
  const [city, setCity] = useState("");
  const [foundationYear, setFoundationYear] = useState("");
  const [teamCategory, setTeamCategory] = useState("");
  const [emblemFile, setEmblemFile] = useState<File | null>(null);
  const [emblemPreview, setEmblemPreview] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [functions, setFunctions] = useState<{ id: number; name: string }[]>([]);

  const [touched, setTouched] = useState({
    nickname: false,
    birthDate: false,
    position: false,
    staffFunction: false,
    nationality: false,
    height: false,
    weight: false,
    preferredFoot: false,
  });

  // If already has profile_completed, redirect
  useEffect(() => {
    if (profile && (profile as any).profile_completed) {
      navigate("/welcome", { replace: true });
    }
  }, [profile, navigate]);

  // Load account types
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("account_types")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (data) setAccountTypes(data as AccountType[]);
      setLoading(false);
    };
    load();
  }, []);

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      const { data } = await supabase.from("paises").select("id, nome, bandeira_url").order("nome");
      if (data) setCountries(data);
    };
    loadCountries();
  }, []);

  const selectedType = accountTypes.find((t) => t.id === selected);
  const selectedSlug = selectedType?.slug || "";
  const isTeam = selectedSlug === "time";
  const isAthlete = selectedSlug === "atleta";
  const isStaff = selectedSlug === "comissao_tecnica";
  const gender = (profile as any)?.gender || "";

  const isBrazilSelected = countries.find(c => c.id.toString() === nationality)?.nome?.toLowerCase() === "brasil";

  // Load states when Brazil is selected
  useEffect(() => {
    if (!isBrazilSelected) { setStates([]); setEstado(""); return; }
    const brazilId = countries.find(c => c.nome.toLowerCase() === "brasil")?.id;
    if (!brazilId) return;
    supabase.from("estados").select("id, nome, uf, bandeira_url").eq("pais_id", brazilId).order("nome")
      .then(({ data }) => { if (data) setStates(data); });
  }, [isBrazilSelected, countries]);

  // Load positions
  useEffect(() => {
    if (!gender || !isAthlete) return;
    const isFemale = gender === "mulher" || gender === "feminino" || gender === "female";
    const table = isFemale ? "posicao_feminina" : "posicao_masculina";
    supabase.from(table).select("id, name").order("name").then(({ data }) => { if (data) setPositions(data); });
  }, [gender, isAthlete]);

  // Load functions for staff
  useEffect(() => {
    if (!gender || !isStaff) return;
    const isFemale = gender === "mulher" || gender === "feminino" || gender === "female";
    const table = isFemale ? "funcaofem" : "funcaomas";
    supabase.from(table).select("id, name").order("name").then(({ data }) => { if (data) setFunctions(data); });
  }, [gender, isStaff]);

  // Scroll to form when account type is selected
  useEffect(() => {
    if (selected && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selected]);

  // Validations
  const nicknameRegex = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
  const isTeamNameValid = teamName.trim().length >= 2 && teamName.trim().length <= 50;
  const isNicknameValid = isTeam ? isTeamNameValid : (nickname.trim().length >= 2 && nickname.trim().length <= 50 && nicknameRegex.test(nickname.trim()));

  const getMaxBirthDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 16);
    return today.toISOString().split("T")[0];
  };
  const maxBirthDate = getMaxBirthDate();
  const isBirthDateValid = isTeam || (!!birthDate && birthDate <= maxBirthDate);
  const isPositionValid = isTeam || (isAthlete ? !!position : true);
  const isStaffFunctionValid = isTeam || (isStaff ? !!staffFunction : true);
  const isNationalityValid = !!nationality;
  const isHeightValid = isTeam || ((isAthlete || isStaff) ? (!!height && Number(height) > 0 && Number(height) <= 250) : true);
  const isWeightValid = isTeam || ((isAthlete || isStaff) ? (!!weight && Number(weight) > 0 && Number(weight) <= 200) : true);
  const isPreferredFootValid = isTeam || (isAthlete ? !!preferredFoot : true);

  const isFormValid = !!selected && isNicknameValid && isBirthDateValid && isPositionValid && isStaffFunctionValid && isNationalityValid && isHeightValid && isWeightValid && isPreferredFootValid;

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
    if (!isFormValid || !user || !selectedType) return;
    setSubmitting(true);

    try {
      let emblemUrl: string | null = null;
      if (isTeam && emblemFile) {
        const fileExt = emblemFile.name.split('.').pop();
        const filePath = `${user.id}/emblem.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, emblemFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        emblemUrl = publicData.publicUrl;
      }

      const isMale = gender === "homem" || gender === "masculino" || gender === "male";
      const isFemale = gender === "mulher" || gender === "feminino" || gender === "female";

      const updateData: Record<string, unknown> = {
        account_type: selectedType.slug,
        gender: isTeam ? null : gender,
        birth_date: isTeam ? null : birthDate,
        nationality: Number(nationality),
        nickname: isTeam ? teamName.trim().toUpperCase() : (nickname.trim() || null),
        full_name: isTeam ? teamName.trim().toUpperCase() : undefined,
        profile_completed: true,
        estado_id: isBrazilSelected && estado ? Number(estado) : null,
        foundation_year: isTeam && foundationYear ? Number(foundationYear) : null,
        team_category: isTeam ? teamCategory || null : null,
        city: city.trim() || null,
      };

      if (emblemUrl) updateData.avatar_url = emblemUrl;

      if (isAthlete) {
        if (isMale) { updateData.posicaomas = Number(position); updateData.posicaofem = null; }
        else if (isFemale) { updateData.posicaofem = Number(position); updateData.posicaomas = null; }
        updateData.funcao = null;
        updateData.height = Number(height);
        updateData.weight = Number(weight);
        updateData.preferred_foot = preferredFoot;
      }

      if (isStaff) {
        updateData.funcao = Number(staffFunction);
        updateData.posicaomas = null;
        updateData.posicaofem = null;
        updateData.height = Number(height);
        updateData.weight = Number(weight);
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/welcome", { replace: true });
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-16 pb-6">
        <img
          src="https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO_verde.png"
          alt="SOCCER VITAE"
          className="h-7 w-auto object-contain"
        />
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Qual é o seu perfil?
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Escolha o tipo de conta e preencha seus dados
            </p>
          </div>

          <div className="space-y-3">
            {accountTypes.map((type) => {
              const isSelected = selected === type.id;
              return (
                <div key={type.id}>
                  <button
                    onClick={() => {
                      setSelected(type.id);
                      // Reset form fields when changing type
                      setNickname(""); setTeamName(""); setBirthDay(""); setBirthMonth(""); setBirthYear(""); setBirthDate("");
                      setPosition(""); setStaffFunction(""); setHeight(""); setWeight(""); setPreferredFoot("");
                      setCity(""); setFoundationYear(""); setTeamCategory(""); setEmblemFile(null); setEmblemPreview(null);
                      setNationality(""); setEstado("");
                      setTouched({ nickname: false, birthDate: false, position: false, staffFunction: false, nationality: false, height: false, weight: false, preferredFoot: false });
                    }}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {iconMap[type.icon || "user"] || <User className="h-8 w-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base">
                        {type.name}
                      </h3>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {type.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Inline form below the selected card */}
                  {isSelected && (
                    <div ref={formRef} className="mt-4 mb-2 p-4 rounded-xl border border-border bg-card animate-in slide-in-from-top-2 duration-300">
                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Team fields */}
                        {isTeam && (
                          <>
                            <div className="space-y-2">
                              <Label>Nome do Time <span className="text-destructive">*</span></Label>
                              <Input
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                onBlur={() => handleBlur("nickname")}
                                placeholder="Ex: FC Barcelona"
                                maxLength={50}
                                className={getInputClass(getFieldStatus(isTeamNameValid, touched.nickname))}
                              />
                              {touched.nickname && !isTeamNameValid && (
                                <p className="text-xs text-destructive">Mínimo de 2 caracteres.</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Escudo</Label>
                              <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                                  {emblemPreview ? (
                                    <img src={emblemPreview} alt="Escudo" className="w-full h-full object-cover" />
                                  ) : (
                                    <Shield className="w-8 h-8 text-muted-foreground/50" />
                                  )}
                                </div>
                                <label className="cursor-pointer">
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) { setEmblemFile(file); setEmblemPreview(URL.createObjectURL(file)); }
                                  }} />
                                  <div className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                                    <Upload className="w-4 h-4" />
                                    {emblemPreview ? 'Alterar escudo' : 'Adicionar escudo'}
                                  </div>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Ano de Fundação</Label>
                              <Input
                                type="text" inputMode="numeric" value={foundationYear}
                                onChange={(e) => setFoundationYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="Ex: 1990" maxLength={4}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Categoria</Label>
                              <Select value={teamCategory} onValueChange={setTeamCategory}>
                                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="amador">Amador</SelectItem>
                                  <SelectItem value="profissional">Profissional</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {isBrazilSelected && (
                              <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" maxLength={100} />
                              </div>
                            )}
                          </>
                        )}

                        {/* Athlete / Staff common: Nickname */}
                        {(isAthlete || isStaff) && (
                          <div className="space-y-2">
                            <Label>Apelido <span className="text-destructive">*</span></Label>
                            <Input
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value)}
                              onBlur={() => handleBlur("nickname")}
                              placeholder="Como você é conhecido"
                              maxLength={50}
                              className={getInputClass(getFieldStatus(isNicknameValid, touched.nickname))}
                            />
                            <p className="text-xs text-muted-foreground">O apelido é como te chamam no futebol.</p>
                            {touched.nickname && !isNicknameValid && (
                              <p className="text-xs text-destructive">
                                {nickname.trim().length < 2 ? "Mínimo de 2 caracteres." : "Apenas letras, números e espaços são permitidos."}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Position (Athlete only) */}
                        {isAthlete && (
                          <div className="space-y-2">
                            <Label>Posição <span className="text-destructive">*</span></Label>
                            <Select value={position} onValueChange={(v) => { setPosition(v); handleBlur("position"); }}>
                              <SelectTrigger className={getInputClass(getFieldStatus(isPositionValid, touched.position))}>
                                <SelectValue placeholder="Selecione sua posição" />
                              </SelectTrigger>
                              <SelectContent>
                                {positions.map((pos) => (
                                  <SelectItem key={pos.id} value={pos.id.toString()}>{pos.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {touched.position && !isPositionValid && (
                              <p className="text-xs text-destructive">Selecione sua posição em campo.</p>
                            )}
                          </div>
                        )}

                        {/* Function (Staff only) */}
                        {isStaff && (
                          <div className="space-y-2">
                            <Label>Função <span className="text-destructive">*</span></Label>
                            <Select value={staffFunction} onValueChange={(v) => { setStaffFunction(v); handleBlur("staffFunction"); }}>
                              <SelectTrigger className={getInputClass(getFieldStatus(isStaffFunctionValid, touched.staffFunction))}>
                                <SelectValue placeholder="Selecione sua função" />
                              </SelectTrigger>
                              <SelectContent>
                                {functions.map((func) => (
                                  <SelectItem key={func.id} value={func.id.toString()}>{func.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {touched.staffFunction && !isStaffFunctionValid && (
                              <p className="text-xs text-destructive">Selecione sua função.</p>
                            )}
                          </div>
                        )}

                        {/* Birth Date (Athlete / Staff) */}
                        {(isAthlete || isStaff) && (
                          <div className="space-y-2">
                            <Label>Data de nascimento <span className="text-destructive">*</span></Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Select value={birthDay} onValueChange={(val) => {
                                setBirthDay(val);
                                if (val && birthMonth && birthYear) setBirthDate(`${birthYear}-${birthMonth}-${val}`);
                                else setBirthDate("");
                                handleBlur("birthDate");
                              }}>
                                <SelectTrigger className={getInputClass(getFieldStatus(isBirthDateValid, touched.birthDate))}>
                                  <SelectValue placeholder="Dia" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: birthMonth && birthYear ? new Date(Number(birthYear), Number(birthMonth), 0).getDate() : 31 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={birthMonth} onValueChange={(val) => {
                                setBirthMonth(val);
                                if (birthDay && val && birthYear) setBirthDate(`${birthYear}-${val}-${birthDay}`);
                                else setBirthDate("");
                                handleBlur("birthDate");
                              }}>
                                <SelectTrigger className={getInputClass(getFieldStatus(isBirthDateValid, touched.birthDate))}>
                                  <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
                                    { value: "03", label: "Março" }, { value: "04", label: "Abril" },
                                    { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
                                    { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
                                    { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
                                    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
                                  ].map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={birthYear} onValueChange={(val) => {
                                setBirthYear(val);
                                if (birthDay && birthMonth && val) setBirthDate(`${val}-${birthMonth}-${birthDay}`);
                                else setBirthDate("");
                                handleBlur("birthDate");
                              }}>
                                <SelectTrigger className={getInputClass(getFieldStatus(isBirthDateValid, touched.birthDate))}>
                                  <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: (new Date().getFullYear() - 16) - 1940 + 1 }, (_, i) => ((new Date().getFullYear() - 16) - i).toString()).map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">Você deve ter no mínimo 16 anos.</p>
                            {touched.birthDate && !isBirthDateValid && (
                              <p className="text-xs text-destructive">
                                {!birthDate ? "Selecione sua data de nascimento." : "Você deve ter no mínimo 16 anos."}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Nationality (all types) */}
                        <div className="space-y-2">
                          <Label>{isTeam ? "País" : "Nacionalidade"} <span className="text-destructive">*</span></Label>
                          <Select value={nationality} onValueChange={(val) => { setNationality(val); setEstado(""); handleBlur("nationality"); }}>
                            <SelectTrigger className={getInputClass(getFieldStatus(isNationalityValid, touched.nationality))}>
                              <SelectValue placeholder="Selecione o país" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries
                                .sort((a, b) => a.nome.toLowerCase() === "brasil" ? -1 : b.nome.toLowerCase() === "brasil" ? 1 : a.nome.localeCompare(b.nome))
                                .map((c) => (
                                  <SelectItem key={c.id} value={c.id.toString()}>
                                    <span className="flex items-center gap-2">
                                      {c.bandeira_url && <img src={c.bandeira_url} alt="" className="w-5 h-3 object-cover rounded-sm inline-block" />}
                                      {c.nome}
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {touched.nationality && !isNationalityValid && (
                            <p className="text-xs text-destructive">Selecione {isTeam ? "o país" : "sua nacionalidade"}.</p>
                          )}
                        </div>

                        {/* State (Brazil only) */}
                        {isBrazilSelected && (
                          <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={estado} onValueChange={setEstado}>
                              <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                              <SelectContent>
                                {states.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    <span className="flex items-center gap-2">
                                      {s.bandeira_url && <img src={s.bandeira_url} alt="" className="w-5 h-3 object-cover rounded-sm inline-block" />}
                                      {s.nome}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Height & Weight (Athlete / Staff) */}
                        {(isAthlete || isStaff) && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Altura (cm) <span className="text-destructive">*</span></Label>
                              <div className="relative">
                                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} onBlur={() => handleBlur("height")}
                                  placeholder="180" min="100" max="250" className={getInputClass(getFieldStatus(isHeightValid, touched.height))} />
                                {touched.height && isHeightValid && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
                              </div>
                              {touched.height && !isHeightValid && height && <p className="text-xs text-destructive">Altura inválida.</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Peso (kg) <span className="text-destructive">*</span></Label>
                              <div className="relative">
                                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={() => handleBlur("weight")}
                                  placeholder="75" min="30" max="200" step="0.1" className={getInputClass(getFieldStatus(isWeightValid, touched.weight))} />
                                {touched.weight && isWeightValid && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
                              </div>
                              {touched.weight && !isWeightValid && weight && <p className="text-xs text-destructive">Peso inválido.</p>}
                            </div>
                          </div>
                        )}

                        {/* City (Athlete / Staff) - only when Brazil */}
                        {(isAthlete || isStaff) && isBrazilSelected && (
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" maxLength={100} />
                          </div>
                        )}

                        {/* Preferred Foot (Athlete only) */}
                        {isAthlete && (
                          <div className="space-y-2">
                            <Label>Pé preferido <span className="text-destructive">*</span></Label>
                            <Select value={preferredFoot} onValueChange={(v) => { setPreferredFoot(v); handleBlur("preferredFoot"); }}>
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

                        {/* Submit */}
                        <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl" disabled={!isFormValid || submitting}>
                          {submitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Salvando...</>
                          ) : (
                            "Salvar e Continuar"
                          )}
                        </Button>

                        {!isFormValid && (
                          <p className="text-xs text-center text-muted-foreground">
                            Preencha todos os campos obrigatórios para continuar
                          </p>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseAccountType;
