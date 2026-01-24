import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEEZER_API_BASE = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_medium: string;
    cover_big: string;
  };
}

interface DeezerChartResponse {
  data: DeezerTrack[];
  total: number;
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "chart";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const genre = url.searchParams.get("genre") || "";

    let apiUrl: string;
    let response: Response;

    if (search) {
      // Search tracks
      apiUrl = `${DEEZER_API_BASE}/search?q=${encodeURIComponent(search)}&limit=${limit}`;
      console.log("Searching Deezer:", apiUrl);
      response = await fetch(apiUrl);
    } else if (genre && genre !== "all") {
      // Get genre-specific chart
      const genreMap: Record<string, number> = {
        pop: 132,
        rock: 152,
        hiphop: 116,
        electronic: 106,
        jazz: 129,
        classical: 98,
        reggae: 144,
        latin: 197,
        rnb: 165,
        country: 84,
      };
      const genreId = genreMap[genre] || 0;
      apiUrl = `${DEEZER_API_BASE}/chart/${genreId}/tracks?limit=${limit}`;
      console.log("Fetching Deezer genre chart:", apiUrl);
      response = await fetch(apiUrl);
    } else {
      // Get top chart
      apiUrl = `${DEEZER_API_BASE}/chart/0/tracks?limit=${limit}`;
      console.log("Fetching Deezer top chart:", apiUrl);
      response = await fetch(apiUrl);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deezer API error:", response.status, errorText);
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data: DeezerChartResponse | DeezerSearchResponse = await response.json();

    // Transform Deezer tracks to our format
    const tracks = data.data.map((track) => ({
      id: `deezer_${track.id}`,
      title: track.title,
      artist: track.artist.name,
      category: genre || "trending",
      duration_seconds: track.duration,
      audio_url: track.preview, // 30-second preview
      cover_url: track.album.cover_medium || track.album.cover_big,
      play_count: 0,
      source: "deezer",
    }));

    return new Response(
      JSON.stringify({
        tracks,
        total: data.total || tracks.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching Deezer music:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch music",
        tracks: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
