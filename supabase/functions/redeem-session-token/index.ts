import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      console.log("[redeem-session-token] No token provided");
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find the token
    const { data: tokenData, error: fetchError } = await adminClient
      .from("session_transfer_tokens")
      .select("*")
      .eq("token", token.toUpperCase())
      .single();

    if (fetchError || !tokenData) {
      console.log("[redeem-session-token] Token not found:", token);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log("[redeem-session-token] Token expired:", token);
      // Delete expired token
      await adminClient
        .from("session_transfer_tokens")
        .delete()
        .eq("id", tokenData.id);
      
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token was already used
    if (tokenData.used_at) {
      console.log("[redeem-session-token] Token already used:", token);
      return new Response(
        JSON.stringify({ error: "Token already used" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used
    const { error: updateError } = await adminClient
      .from("session_transfer_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (updateError) {
      console.error("[redeem-session-token] Update error:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Failed to redeem token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[redeem-session-token] Token redeemed successfully for user:", tokenData.user_id);

    // Cleanup: delete all expired tokens
    await adminClient
      .from("session_transfer_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    return new Response(
      JSON.stringify({ 
        refresh_token: tokenData.refresh_token,
        user_id: tokenData.user_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[redeem-session-token] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
