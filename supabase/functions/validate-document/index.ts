import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the verification request
    const { data: request, error: reqError } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get signed URLs for the images
    const [docResult, selfieResult] = await Promise.all([
      supabase.storage.from("verification-docs").createSignedUrl(request.document_url, 3600),
      supabase.storage.from("verification-docs").createSignedUrl(request.selfie_url, 3600),
    ]);

    const docUrl = docResult.data?.signedUrl;
    const selfieUrl = selfieResult.data?.signedUrl;

    if (!docUrl || !selfieUrl) {
      return new Response(JSON.stringify({ error: "Could not access documents" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const documentType = request.document_type || "rg";
    const documentTypeLabel: Record<string, string> = {
      rg: "RG (Registro Geral - Brazilian ID)",
      cpf: "CPF (Cadastro de Pessoa Física)",
      cnh: "CNH (Carteira Nacional de Habilitação - Driver's License)",
      passaporte: "Passport",
    };

    // Call AI to analyze the document
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an identity document verification specialist. You will analyze two images:
1. A photo of an identity document
2. A selfie of a person holding the same document

Your job is to verify:
- Is the document image a valid ${documentTypeLabel[documentType] || documentType}?
- Is the document clearly readable and not blurry?
- Does the selfie show a person holding a document?
- Does the person in the selfie appear to match the person in the document photo?
- Does the name "${request.full_name}" appear consistent with what's visible on the document?

Respond ONLY with a JSON object (no markdown, no code blocks):
{
  "is_valid_document": true/false,
  "document_readable": true/false,
  "selfie_has_document": true/false,
  "faces_match": true/false,
  "name_matches": true/false,
  "overall_valid": true/false,
  "confidence": 0-100,
  "issues": ["list of issues found, empty if none"],
  "summary": "brief summary in Portuguese"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze these verification documents. Document type: ${documentTypeLabel[documentType] || documentType}. Full name provided: "${request.full_name}".`
              },
              {
                type: "image_url",
                image_url: { url: docUrl }
              },
              {
                type: "image_url",
                image_url: { url: selfieUrl }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let validationResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      validationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      validationResult = {
        is_valid_document: false,
        overall_valid: false,
        confidence: 0,
        issues: ["Could not analyze document"],
        summary: "Não foi possível analisar o documento automaticamente.",
      };
    }

    // Update the verification request with AI results
    await supabase
      .from("verification_requests")
      .update({
        ai_validation_result: validationResult,
        ai_validated: true,
      })
      .eq("id", requestId);

    return new Response(JSON.stringify({ result: validationResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
