import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const user_id = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";

    if (!email || !user_id) {
      return new Response(
        JSON.stringify({ error: "Email e user_id são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Store code in verification_codes table
    const { error: upsertError } = await supabaseAdmin
      .from("verification_codes")
      .upsert(
        {
          user_id,
          code,
          code_type: "signup",
          expires_at: expiresAt,
          attempts: 0,
          locked_until: null,
        },
        { onConflict: "user_id,code_type" }
      );

    if (upsertError) {
      console.error("Error storing verification code:", upsertError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar código de verificação" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailParts = email.split("@");
    const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
    const displayName = first_name || "Atleta";
    const logoUrl = "https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO.png";
    const year = new Date().getFullYear();

    const codeDigits = code.split("").map((digit: string) => `
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
  <title>Verificação de Conta - Soccer Vitae</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1612;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1612;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1a2420;border-radius:20px;overflow:hidden;border:1px solid rgba(66,111,66,0.2);">

          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#2d4a2d 0%,#1a3a1a 100%);padding:32px 24px 28px;text-align:center;">
              <img src="${logoUrl}" alt="Soccer Vitae" width="140" height="auto" style="display:inline-block;max-width:140px;height:auto;" />
            </td>
          </tr>

          <!-- Welcome Section -->
          <tr>
            <td style="padding:32px 28px 0;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;text-align:center;">
                Bem-vindo(a), ${displayName}! ⚽
              </h1>
              <p style="margin:0;font-size:15px;color:#9ca3af;text-align:center;line-height:1.6;">
                Estamos felizes em ter você na nossa comunidade. Para ativar sua conta, use o código abaixo:
              </p>
            </td>
          </tr>

          <!-- Code Box -->
          <tr>
            <td style="padding:28px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(66,111,66,0.15) 0%,rgba(66,111,66,0.05) 100%);border:1px solid rgba(66,111,66,0.3);border-radius:16px;">
                <tr>
                  <td style="padding:24px 16px;text-align:center;">
                    <p style="margin:0 0 16px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:3px;font-weight:600;">
                      Código de Verificação
                    </p>
                    <!-- Code Digits -->
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
                ⏱️ Este código expira em <strong style="color:#f59e0b;">10 minutos</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:28px 28px 0;">
              <div style="height:1px;background-color:rgba(255,255,255,0.08);"></div>
            </td>
          </tr>

          <!-- Welcome Benefits -->
          <tr>
            <td style="padding:24px 28px 0;">
              <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#d1d5db;text-align:center;">
                O que te espera no Soccer Vitae:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                    ⚽ &nbsp;Crie seu perfil profissional de atleta
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                    📸 &nbsp;Compartilhe seus melhores momentos
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                    🏆 &nbsp;Registre suas conquistas e títulos
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                    🤝 &nbsp;Conecte-se com outros atletas e equipes
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                      🔒 Se você não criou uma conta no Soccer Vitae, ignore este email. Por segurança, nunca compartilhe este código.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 28px 28px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © ${year} Soccer Vitae — Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SOCCER VITAE <naoresponda@soccervitae.com>",
        to: [email],
        subject: `⚽ Bem-vindo ao Soccer Vitae! Confirme seu cadastro`,
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", responseData);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email de verificação" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso", masked_email: maskedEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-signup-verification function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
