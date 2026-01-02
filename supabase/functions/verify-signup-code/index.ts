import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  user_id: string;
  code: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, code }: VerifyCodeRequest = await req.json();

    if (!user_id || !code) {
      return new Response(
        JSON.stringify({ error: "user_id e código são obrigatórios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the stored code and attempt info from the profile
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("codigo, codigo_expira_em, verification_attempts, verification_locked_until")
      .eq("id", user_id)
      .single();

    if (fetchError || !profile) {
      console.error("Error fetching profile:", fetchError);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if account is locked
    if (profile.verification_locked_until) {
      const lockedUntil = new Date(profile.verification_locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        console.log(`Account locked for user ${user_id}. Remaining: ${remainingMinutes} minutes`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}.`,
            locked: true,
            locked_until: profile.verification_locked_until
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        // Lockout expired, reset attempts
        await supabaseAdmin
          .from("profiles")
          .update({ verification_attempts: 0, verification_locked_until: null })
          .eq("id", user_id);
      }
    }

    // Check if code exists
    if (!profile.codigo) {
      return new Response(
        JSON.stringify({ error: "Nenhum código de verificação pendente" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if code has expired
    if (profile.codigo_expira_em && new Date(profile.codigo_expira_em) < new Date()) {
      // Clear expired code
      await supabaseAdmin
        .from("profiles")
        .update({ codigo: null, codigo_expira_em: null })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ error: "Código expirado. Solicite um novo código." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the code
    if (profile.codigo !== code) {
      const newAttempts = (profile.verification_attempts || 0) + 1;
      const remainingAttempts = MAX_ATTEMPTS - newAttempts;
      
      console.log(`Failed verification attempt for user ${user_id}. Attempts: ${newAttempts}/${MAX_ATTEMPTS}`);

      // Check if we need to lock the account
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        await supabaseAdmin
          .from("profiles")
          .update({ 
            verification_attempts: newAttempts, 
            verification_locked_until: lockedUntil.toISOString() 
          })
          .eq("id", user_id);

        console.log(`Account locked for user ${user_id} until ${lockedUntil.toISOString()}`);

        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Conta bloqueada por ${LOCKOUT_MINUTES} minutos.`,
            locked: true,
            locked_until: lockedUntil.toISOString()
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Update attempt count
      await supabaseAdmin
        .from("profiles")
        .update({ verification_attempts: newAttempts })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ 
          error: `Código inválido. ${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.`,
          remaining_attempts: remainingAttempts
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Code is valid - clear the code, attempts and mark account as verified
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        codigo: null, 
        codigo_expira_em: null,
        conta_verificada: true,
        verification_attempts: 0,
        verification_locked_until: null
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar conta" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Also confirm the user's email in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email_confirm: true
    });

    if (authError) {
      console.error("Error confirming email in auth:", authError);
      // Don't return error as profile is already updated
    }

    console.log("Signup verification successful for user:", user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta verificada com sucesso!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-signup-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
