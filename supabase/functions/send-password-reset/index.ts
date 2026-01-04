import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a API key do Resend está configurada
    if (!resendApiKey) {
      console.error("RESEND_API_KEY não está configurada");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      console.error("Email não fornecido na requisição");
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Solicitação de reset de senha para:", email);

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
      // Retornar sucesso mesmo se usuário não existir (segurança)
      return new Response(
        JSON.stringify({ 
          success: true, 
          maskedEmail: maskEmail(email),
          message: "Se o email existir, você receberá um código de recuperação" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    console.log("Código gerado para usuário:", user.id);

    // Salvar código no perfil
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_code: resetCode,
        password_reset_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Erro ao salvar código:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar solicitação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar nome do usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || profile?.username || "Atleta";

    console.log("Tentando enviar email para:", email);

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "SOCCER VITAE <onboarding@resend.dev>",
      to: [email],
      subject: "Código de Recuperação de Senha - SOCCER VITAE",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 500px; background: linear-gradient(135deg, #1a1a1a 0%, #0d1f0d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #22c55e20;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                      <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 30px;">⚽</span>
                      </div>
                      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Recuperação de Senha</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 25px;">
                        Olá <span style="color: #22c55e; font-weight: 600;">${userName}</span>!
                      </p>
                      <p style="color: #d1d5db; font-size: 15px; margin: 0 0 30px; line-height: 1.6;">
                        Você solicitou a recuperação de senha da sua conta. Use o código abaixo para redefinir sua senha:
                      </p>
                      <div style="background: linear-gradient(135deg, #22c55e20 0%, #16a34a10 100%); border: 2px solid #22c55e40; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">Seu código</p>
                        <p style="color: #22c55e; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetCode}</p>
                      </div>
                      <p style="color: #71717a; font-size: 13px; margin: 0;">
                        ⏱️ Este código expira em <strong style="color: #f59e0b;">15 minutos</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 30px 30px;">
                      <div style="background: #27272a; border-radius: 8px; padding: 15px;">
                        <p style="color: #71717a; font-size: 12px; margin: 0; text-align: center;">
                          🔒 Se você não solicitou esta recuperação, ignore este email. Sua conta está segura.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
                      <p style="color: #52525b; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} SOCCER VITAE - A rede social dos atletas
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Resposta do Resend:", JSON.stringify(emailResponse));

    // Verificar se houve erro no envio
    if (emailResponse.error) {
      console.error("Erro ao enviar email via Resend:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao enviar email. Verifique se o domínio está verificado no Resend.",
          details: emailResponse.error.message || "Erro desconhecido"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email enviado com sucesso! ID:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        maskedEmail: maskEmail(email),
        message: "Código enviado com sucesso" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro na função send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
}

serve(handler);
