import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamToProcess {
  id: string;
  nome: string;
  escudo_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 10 } = await req.json().catch(() => ({}));

    console.log(`Processing up to ${limit} teams...`);

    // Get teams that still have external URLs (escudosfc.com.br)
    const { data: teams, error: fetchError } = await supabase
      .from("times")
      .select("id, nome, escudo_url")
      .like("escudo_url", "%escudosfc.com.br%")
      .limit(limit);

    if (fetchError) {
      console.error("Error fetching teams:", fetchError);
      throw fetchError;
    }

    if (!teams || teams.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No teams to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${teams.length} teams to process`);

    const results: { nome: string; success: boolean; error?: string }[] = [];

    for (const team of teams as TeamToProcess[]) {
      try {
        console.log(`Processing: ${team.nome} - ${team.escudo_url}`);

        // Download the image
        const response = await fetch(team.escudo_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const imageBlob = await response.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Generate safe filename
        const safeName = team.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
          .replace(/^-+|-+$/g, ""); // Trim dashes

        const extension = team.escudo_url.split(".").pop() || "png";
        const filePath = `${safeName}.${extension}`;

        console.log(`Uploading to: ${filePath}`);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("team-emblems")
          .upload(filePath, uint8Array, {
            contentType: imageBlob.type || "image/png",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("team-emblems")
          .getPublicUrl(filePath);

        // Update team with new URL
        const { error: updateError } = await supabase
          .from("times")
          .update({ escudo_url: publicUrlData.publicUrl })
          .eq("id", team.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ Success: ${team.nome}`);
        results.push({ nome: team.nome, success: true });
      } catch (error) {
        console.error(`❌ Error processing ${team.nome}:`, error);
        results.push({
          nome: team.nome,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: teams.length,
        successful: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
