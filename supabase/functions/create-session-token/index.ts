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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[create-session-token] No authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token to get user info
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.log("[create-session-token] User not authenticated:", userError?.message);
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get refresh token from request body
    const { refresh_token } = await req.json();
    if (!refresh_token) {
      console.log("[create-session-token] No refresh token provided");
      return new Response(
        JSON.stringify({ error: "Refresh token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to insert token
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a short, secure token (8 chars for easy typing)
    const token = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
    
    // Token expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing unused tokens for this user (cleanup)
    await adminClient
      .from("session_transfer_tokens")
      .delete()
      .eq("user_id", user.id)
      .is("used_at", null);

    // Insert new token
    const { error: insertError } = await adminClient
      .from("session_transfer_tokens")
      .insert({
        user_id: user.id,
        token,
        refresh_token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[create-session-token] Insert error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also cleanup expired tokens (housekeeping)
    await adminClient
      .from("session_transfer_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    console.log("[create-session-token] Token created for user:", user.id);

    return new Response(
      JSON.stringify({ 
        token,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-session-token] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
