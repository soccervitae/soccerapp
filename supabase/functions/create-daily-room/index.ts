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

    // Create a unique room name based on conversation
    const roomName = `call-${conversationId}-${Date.now()}`;

    // Create Daily.co room via REST API
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          max_participants: 2,
          enable_chat: false,
          enable_knocking: false,
          enable_screenshare: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
          eject_at_room_exp: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Daily.co API error [${response.status}]: ${errorData}`);
    }

    const room = await response.json();

    // Create meeting tokens for both participants
    const createToken = async (participantId: string) => {
      const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_id: participantId,
            exp: Math.floor(Date.now() / 1000) + 3600,
            enable_screenshare: false,
            start_video_off: callType === "voice",
          },
        }),
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.text();
        throw new Error(`Daily.co token error [${tokenRes.status}]: ${errorData}`);
      }

      return tokenRes.json();
    };

    // We'll create a single token for now, each participant calls separately
    const { caller_id, callee_id } = await req.json().catch(() => ({}));
    
    // Just return the room URL - tokens will be created per-participant
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
