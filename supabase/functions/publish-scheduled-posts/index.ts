import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[publish-scheduled-posts] Checking for scheduled posts...');

    // Find posts that are scheduled to be published now or in the past
    const now = new Date().toISOString();
    
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, scheduled_at, user_id')
      .eq('is_published', false)
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('[publish-scheduled-posts] Error fetching scheduled posts:', fetchError);
      throw fetchError;
    }

    console.log(`[publish-scheduled-posts] Found ${scheduledPosts?.length || 0} posts to publish`);

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts to publish',
          published: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Publish each post
    const postIds = scheduledPosts.map(p => p.id);
    
    const { error: updateError, count } = await supabase
      .from('posts')
      .update({ 
        is_published: true, 
        published_at: now 
      })
      .in('id', postIds);

    if (updateError) {
      console.error('[publish-scheduled-posts] Error publishing posts:', updateError);
      throw updateError;
    }

    console.log(`[publish-scheduled-posts] Successfully published ${count || postIds.length} posts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Published ${count || postIds.length} posts`,
        published: count || postIds.length,
        postIds 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[publish-scheduled-posts] Error:', error);
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
