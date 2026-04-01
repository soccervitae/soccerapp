import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add random delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    // Always return the same response shape regardless of user existence
    if (!user) {
      // Perform a fake DB read to equalize timing with the real-user path
      await supabaseAdmin
        .from("verification_codes")
        .select("id")
        .eq("code_type", "password_reset")
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          maskedEmail: maskEmail(email),
          message: "Se o email existir, você receberá um código de recuperação",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store code in verification_codes table
    const { error: upsertError } = await supabaseAdmin
      .from("verification_codes")
      .upsert(
        {
          user_id: user.id,
          code: resetCode,
          code_type: "password_reset",
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          locked_until: null,
        },
        { onConflict: "user_id,code_type" }
      );

    if (upsertError) {
      console.error("Error storing reset code:", upsertError);
      return new Response(
        JSON.stringify({ error: "Erro ao processar solicitação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || profile?.username || "Atleta";

    const logoUrl = "https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO.png";
    const year = new Date().getFullYear();

    const codeDigits = resetCode.split("").map((digit: string) => `
      <td style="width:44px;height:52px;background-color:#426F42;border-radius:10px;text-align:center;vertical-align:middle;font-size:26px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:0;">
        ${digit}
      </td>
      <td style="width:6px;"></td>
    `).join("");

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - SOCCER VITAE</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="padding:32px 24px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
              <img src="${logoUrl}" alt="SOCCER VITAE" width="140" height="auto" style="display:inline-block;max-width:140px;height:auto;" />
            </td>
          </tr>

          <!-- Title Section -->
          <tr>
            <td style="padding:28px 28px 0;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;">
                Recuperação de Senha 🔑
              </h1>
              <p style="margin:0;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                Olá, <strong style="color:#1a1a1a;">${userName}</strong>! Você solicitou a redefinição da sua senha. Use o código abaixo:
              </p>
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td style="padding:28px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:24px 16px;text-align:center;">
                    <p style="margin:0 0 16px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:3px;font-weight:600;">
                      Código de Recuperação
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        ${codeDigits}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiration Notice -->
          <tr>
            <td style="padding:16px 28px 0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                ⏱️ Este código expira em <strong style="color:#f59e0b;">15 minutos</strong>
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                      🔒 Se você não solicitou a redefinição de senha, ignore este email. Por segurança, nunca compartilhe este código.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 28px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                © ${year} SOCCER VITAE — Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "SOCCER VITAE <naoresponda@soccervitae.com>",
      to: [email],
      subject: "Recuperação de Senha - SOCCER VITAE",
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, maskedEmail: maskEmail(email), message: "Código enviado com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
