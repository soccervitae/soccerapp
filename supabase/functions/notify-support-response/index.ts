import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  ticket_id: string;
  admin_response: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error('[notify-support-response] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ticket_id, admin_response }: NotificationRequest = await req.json();

    if (!ticket_id || !admin_response) {
      return new Response(
        JSON.stringify({ error: 'ticket_id and admin_response are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[notify-support-response] Processing notification for ticket:', ticket_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get ticket details with user info
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*, profiles!support_tickets_user_id_fkey(username, full_name)')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error('[notify-support-response] Error fetching ticket:', ticketError);
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(ticket.user_id);

    if (authError || !authUser?.user?.email) {
      console.error('[notify-support-response] Error fetching user email:', authError);
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = authUser.user.email;
    const userName = ticket.profiles?.full_name || ticket.profiles?.username || 'Usuário';

    console.log('[notify-support-response] Sending notification to:', userEmail);

    const typeLabels: Record<string, string> = {
      suggestion: 'Sugestão',
      complaint: 'Reclamação',
      bug: 'Problema técnico',
      other: 'Outro',
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 28px; color: #18181b;">⚽ SOCCER VITAE</h1>
            </div>
            
            <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">
              Olá, ${userName}!
            </h2>
            
            <p style="margin: 0 0 24px; font-size: 14px; color: #71717a; line-height: 1.6;">
              Nossa equipe respondeu ao seu ticket de suporte. Confira os detalhes abaixo:
            </p>
            
            <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">
                ${typeLabels[ticket.type] || 'Mensagem'}
              </p>
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">
                ${ticket.subject}
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; font-weight: 600;">
                Resposta da equipe
              </p>
              <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6; white-space: pre-wrap;">
                ${admin_response}
              </p>
            </div>
            
            <p style="margin: 0; font-size: 14px; color: #71717a; text-align: center; line-height: 1.5;">
              Você pode ver o histórico completo das suas mensagens na seção de Configurações do aplicativo.
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
        to: [userEmail],
        subject: `Resposta ao seu ticket: ${ticket.subject} - SOCCER VITAE`,
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();
    console.log('[notify-support-response] Resend response:', JSON.stringify(responseData));

    if (!emailResponse.ok) {
      console.error('[notify-support-response] Error sending email:', responseData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: responseData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[notify-support-response] Email sent successfully! ID:', responseData.id);

    return new Response(
      JSON.stringify({ success: true, email_id: responseData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[notify-support-response] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
