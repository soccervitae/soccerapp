import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[clear-expired-bans] Checking for expired bans...');

    const now = new Date().toISOString();

    // Find and clear expired bans
    const { data: expiredBans, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, banned_until')
      .not('banned_at', 'is', null)
      .not('banned_until', 'is', null)
      .lte('banned_until', now);

    if (fetchError) {
      console.error('[clear-expired-bans] Error fetching expired bans:', fetchError);
      throw fetchError;
    }

    console.log(`[clear-expired-bans] Found ${expiredBans?.length || 0} expired bans to clear`);

    if (!expiredBans || expiredBans.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired bans to clear',
          cleared: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear expired bans
    const userIds = expiredBans.map(u => u.id);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        banned_at: null, 
        banned_until: null,
        ban_reason: null 
      })
      .in('id', userIds);

    if (updateError) {
      console.error('[clear-expired-bans] Error clearing bans:', updateError);
      throw updateError;
    }

    console.log(`[clear-expired-bans] Successfully cleared ${userIds.length} expired bans`);
    console.log('[clear-expired-bans] Unbanned users:', expiredBans.map(u => u.username).join(', '));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleared ${userIds.length} expired bans`,
        cleared: userIds.length,
        usernames: expiredBans.map(u => u.username)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[clear-expired-bans] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
