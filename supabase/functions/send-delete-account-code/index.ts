import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  email: string;
  user_id: string;
}

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a API key está configurada
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY não está configurada");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, user_id }: DeleteAccountRequest = await req.json();

    if (!email || !user_id) {
      console.error("Email ou user_id não fornecidos");
      return new Response(
        JSON.stringify({ error: "Email e user_id são obrigatórios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Enviando código de confirmação de exclusão para:", email);

    // Generate 6-digit code
    const code = generateCode();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Create Supabase admin client to update the profile
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Store the code in the profiles table (reusing codigo fields)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        codigo: code,
        codigo_expira_em: expiresAt,
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating profile with delete code:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar código de confirmação" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mask email for display (e.g., rog***@gmail.com)
    const emailParts = email.split("@");
    const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];

    console.log("Tentando enviar email de confirmação de exclusão via Resend para:", email);

    // Send email with the code using Resend API
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 28px; color: #18181b;">⚽ SOCCER VITAE</h1>
            </div>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: 600; text-align: center;">
                ⚠️ Solicitação de Exclusão de Conta
              </p>
            </div>
            
            <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
              Código de Confirmação
            </h2>
            
            <p style="margin: 0 0 24px; font-size: 14px; color: #71717a; text-align: center; line-height: 1.5;">
              Você solicitou a exclusão permanente da sua conta. Use o código abaixo para confirmar. Este código expira em <strong>10 minutos</strong>.
            </p>
            
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </span>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #92400e; text-align: center;">
                <strong>Atenção:</strong> Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
              </p>
            </div>
            
            <p style="margin: 0 0 8px; font-size: 12px; color: #a1a1aa; text-align: center;">
              Se você não solicitou a exclusão da sua conta, ignore este email e sua conta permanecerá segura.
            </p>
            
            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
              Por segurança, nunca compartilhe este código com ninguém.
            </p>
          </div>
          
          <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
            © ${new Date().getFullYear()} SOCCER VITAE. Todos os direitos reservados.
          </p>
        </div>
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
        from: "SOCCER VITAE <onboarding@resend.dev>",
        to: [email],
        subject: "⚠️ Confirme a Exclusão da sua Conta - SOCCER VITAE",
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();
    console.log("Resposta do Resend:", JSON.stringify(responseData));

    if (!emailResponse.ok) {
      console.error("Erro ao enviar email:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao enviar email de confirmação",
          details: responseData.message || "Verifique se o domínio está verificado no Resend"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email de confirmação de exclusão enviado com sucesso! ID:", responseData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado com sucesso",
        masked_email: maskedEmail 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-delete-account-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
