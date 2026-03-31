import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      throw new Error("DAILY_API_KEY is not configured");
    }

    const { conversationId, callType } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const roomName = `call-${conversationId.slice(0, 8)}-${Date.now()}`;

    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          max_participants: 2,
          enable_chat: false,
          enable_knocking: false,
          enable_screenshare: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600,
          eject_at_room_exp: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Daily.co API error [${response.status}]: ${errorData}`);
    }

    const room = await response.json();

    return new Response(
      JSON.stringify({
        roomUrl: room.url,
        roomName: room.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Daily room:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
