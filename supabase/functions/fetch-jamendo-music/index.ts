import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Jamendo API - Free music API (no auth required for basic usage)
const JAMENDO_API_BASE = "https://api.jamendo.com/v3.0";
const JAMENDO_CLIENT_ID = "b6747d04"; // Public client ID for basic API access

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  audio: string;
  audiodownload: string;
  image: string;
  album_image: string;
}

interface JamendoResponse {
  headers: {
    status: string;
    code: number;
    results_count: number;
  };
  results: JamendoTrack[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "trending";
    const limit = url.searchParams.get("limit") || "20";
    const search = url.searchParams.get("search") || "";
    const offset = url.searchParams.get("offset") || "0";

    let apiUrl: string;

    if (search) {
      // Search tracks
      apiUrl = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&offset=${offset}&namesearch=${encodeURIComponent(search)}&include=musicinfo&groupby=artist_id`;
    } else if (type === "trending") {
      // Get popular/trending tracks
      apiUrl = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&offset=${offset}&order=popularity_total&include=musicinfo&groupby=artist_id`;
    } else if (type === "featured") {
      // Get featured tracks
      apiUrl = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&offset=${offset}&featured=true&include=musicinfo`;
    } else {
      // Default to popular
      apiUrl = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&offset=${offset}&order=popularity_week&include=musicinfo&groupby=artist_id`;
    }

    console.log("Fetching from Jamendo:", apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jamendo API error:", response.status, errorText);
      throw new Error(`Jamendo API error: ${response.status}`);
    }

    const data: JamendoResponse = await response.json();

    // Transform Jamendo tracks to our format
    const tracks = data.results.map((track) => ({
      id: `jamendo_${track.id}`,
      title: track.name,
      artist: track.artist_name,
      category: "jamendo",
      duration_seconds: track.duration,
      audio_url: track.audio || track.audiodownload,
      cover_url: track.album_image || track.image,
      play_count: 0,
      source: "jamendo",
    }));

    return new Response(
      JSON.stringify({
        tracks,
        total: data.headers.results_count,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching Jamendo music:", error);
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
