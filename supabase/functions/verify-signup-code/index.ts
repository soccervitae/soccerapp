import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const user_id = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!user_id || !code) {
      return new Response(
        JSON.stringify({ error: "user_id e código são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Código deve ter 6 dígitos numéricos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get verification code from secure table
    const { data: vcRecord, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("user_id", user_id)
      .eq("code_type", "signup")
      .single();

    if (fetchError || !vcRecord) {
      return new Response(
        JSON.stringify({ error: "Nenhum código de verificação pendente" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if account is locked
    if (vcRecord.locked_until) {
      const lockedUntil = new Date(vcRecord.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return new Response(
          JSON.stringify({
            error: `Muitas tentativas. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? "s" : ""}.`,
            locked: true,
            locked_until: vcRecord.locked_until,
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        await supabaseAdmin
          .from("verification_codes")
          .update({ attempts: 0, locked_until: null })
          .eq("id", vcRecord.id);
        vcRecord.attempts = 0;
      }
    }

    // Check expiration
    if (new Date(vcRecord.expires_at) < new Date()) {
      await supabaseAdmin.from("verification_codes").delete().eq("id", vcRecord.id);
      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the code
    if (vcRecord.code !== code) {
      const newAttempts = (vcRecord.attempts || 0) + 1;
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        await supabaseAdmin
          .from("verification_codes")
          .update({ attempts: newAttempts, locked_until: lockedUntil.toISOString() })
          .eq("id", vcRecord.id);

        return new Response(
          JSON.stringify({
            error: `Muitas tentativas. Conta bloqueada por ${LOCKOUT_MINUTES} minutos.`,
            locked: true,
            locked_until: lockedUntil.toISOString(),
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      await supabaseAdmin
        .from("verification_codes")
        .update({ attempts: newAttempts })
        .eq("id", vcRecord.id);

      return new Response(
        JSON.stringify({
          error: `Código inválido. ${remainingAttempts} tentativa${remainingAttempts > 1 ? "s" : ""} restante${remainingAttempts > 1 ? "s" : ""}.`,
          remaining_attempts: remainingAttempts,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code is valid - delete the record and mark account verified
    await supabaseAdmin.from("verification_codes").delete().eq("id", vcRecord.id);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ conta_verificada: true })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    // Confirm email in auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email_confirm: true,
    });

    if (authError) {
      console.error("Error confirming email in auth:", authError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conta verificada com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-signup-code function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
