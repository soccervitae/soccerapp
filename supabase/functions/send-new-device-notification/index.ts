import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewDeviceNotificationRequest {
  user_id: string;
  email: string;
  device_name: string;
  browser: string;
  os: string;
  device_type: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("New device notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, device_name, browser, os, device_type }: NewDeviceNotificationRequest = await req.json();
    
    console.log("Processing notification for user:", user_id, "email:", email);

    // Check if user has notifications enabled
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("notify_new_device, full_name, username")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Check if notifications are enabled
    if (!profile.notify_new_device) {
      console.log("User has disabled new device notifications");
      return new Response(
        JSON.stringify({ message: "Notifications disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = profile.full_name || profile.username || "Usuário";
    const currentDate = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get device icon based on type
    const deviceIcon = device_type === "mobile" ? "📱" : device_type === "tablet" ? "📲" : "💻";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚽ SportConnect</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Olá, ${userName}!</h2>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Alerta de Segurança</strong><br>
                Um novo dispositivo acabou de acessar sua conta.
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Detalhes do dispositivo:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Dispositivo:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${deviceIcon} ${device_name || "Desconhecido"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Navegador:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${browser || "Desconhecido"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Sistema:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${os || "Desconhecido"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Data/Hora:</td>
                  <td style="padding: 8px 0; font-weight: 500;">${currentDate}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #4b5563;">
              <strong>Foi você?</strong> Se este acesso foi realizado por você, não é necessário tomar nenhuma ação.
            </p>
            
            <p style="color: #dc2626; font-weight: 500;">
              <strong>Não reconhece este acesso?</strong> Recomendamos que você altere sua senha imediatamente nas configurações de segurança da sua conta.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Você está recebendo este email porque um novo dispositivo acessou sua conta no SportConnect.
              <br>
              Para desativar estes alertas, acesse Configurações > Segurança > Alertas de Segurança.
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
        from: "SportConnect <onboarding@resend.dev>",
        to: [email],
        subject: "⚠️ Novo dispositivo detectado na sua conta",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Error sending email:", errorData);
      // Don't throw - return success with warning so login isn't blocked
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email notification failed but login allowed",
          warning: "Resend domain not verified - emails only work for account owner"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("New device notification email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-new-device-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
