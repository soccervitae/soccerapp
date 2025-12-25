import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyResetRequest {
  email: string;
  code: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword }: VerifyResetRequest = await req.json();

    if (!email || !code || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email, código e nova senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verificando código de reset para:", email);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Buscar usuário pelo email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Erro ao buscar usuários:", userError);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log("Usuário não encontrado para email:", email);
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar código salvo no perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("password_reset_code, password_reset_expires_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Erro ao buscar perfil:", profileError);
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o código existe e não expirou
    if (!profile.password_reset_code || !profile.password_reset_expires_at) {
      console.log("Código não encontrado para usuário:", user.id);
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = new Date(profile.password_reset_expires_at);
    if (expiresAt < new Date()) {
      console.log("Código expirado para usuário:", user.id);
      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo código." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o código está correto
    if (profile.password_reset_code !== code) {
      console.log("Código incorreto para usuário:", user.id);
      return new Response(
        JSON.stringify({ error: "Código incorreto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Código válido, atualizando senha para usuário:", user.id);

    // Atualizar senha do usuário
    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updatePasswordError) {
      console.error("Erro ao atualizar senha:", updatePasswordError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar senha" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limpar código do perfil
    const { error: clearCodeError } = await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_code: null,
        password_reset_expires_at: null,
      })
      .eq("id", user.id);

    if (clearCodeError) {
      console.warn("Erro ao limpar código (não crítico):", clearCodeError);
    }

    console.log("Senha atualizada com sucesso para usuário:", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro na função verify-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
