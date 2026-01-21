import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Palavras-chave apenas para conteúdo adulto
const ADULT_KEYWORDS = [
  'pornografia', 'nudez', 'sexual', 'explícito',
  'pornography', 'nudity', 'sexual', 'explicit',
  'nude', 'naked', 'genitals', 'porn'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, mediaUrls, mediaType } = await req.json();

    if (!postId || !mediaUrls || mediaUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'postId e mediaUrls são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de API inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`[moderate-content] Analisando post ${postId} com ${mediaUrls.length} mídia(s)`);

    let hasAdultContent = false;
    let moderationReason = '';
    const analysisResults: { url: string; adult_content: boolean; reason?: string }[] = [];

    // Analisar cada mídia
    for (const url of mediaUrls) {
      try {
        const isVideo = mediaType === 'video' || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
        
        const messages = [
          {
            role: 'system',
            content: `Você é um sistema de moderação de conteúdo para uma rede social de futebol.

Sua ÚNICA tarefa é detectar CONTEÚDO ADULTO/EXPLÍCITO:

🔴 CONTEÚDO ADULTO (rejeitar):
- Nudez total ou parcial (genitais, seios expostos, nádegas)
- Conteúdo pornográfico ou sexual explícito
- Atos sexuais ou poses sexuais explícitas

🟢 APROVAR (todo o resto):
- Fotos de futebol, esportes, celebrações
- Pessoas vestidas (mesmo com roupas reveladoras)
- Violência, armas, drogas (NÃO são motivo para rejeição)
- Qualquer conteúdo que NÃO seja nudez/pornografia

RESPONDA APENAS com JSON:
{
  "adult_content": true/false,
  "reason": "descrição breve se adulto, vazio se não"
}

IMPORTANTE: 
- Violência, armas, drogas, símbolos polêmicos NÃO são motivo para rejeição
- APENAS nudez e conteúdo sexual explícito deve ser rejeitado
- Na dúvida, APROVE o conteúdo`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta ${isVideo ? 'thumbnail do vídeo' : 'imagem'} e verifique APENAS se contém nudez ou conteúdo sexual explícito.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: url,
                  detail: 'high'
                }
              }
            ]
          }
        ];

        console.log(`[moderate-content] Analisando mídia: ${url.substring(0, 100)}...`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            max_tokens: 200,
            temperature: 0,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[moderate-content] Erro OpenAI: ${response.status} - ${errorText}`);
          // Em caso de erro da API, aprovar o post (não bloquear por falha técnica)
          analysisResults.push({ url, adult_content: false, reason: 'Erro na análise - aprovado automaticamente' });
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log(`[moderate-content] Resposta para ${url}: ${content}`);

        // Extrair JSON da resposta
        let analysis = { adult_content: false, reason: '' };
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('[moderate-content] Erro ao parsear resposta:', parseError);
          // Verificar palavras-chave na resposta como fallback
          const lowerContent = content.toLowerCase();
          const hasAdultKeyword = ADULT_KEYWORDS.some(kw => lowerContent.includes(kw));
          if (hasAdultKeyword && (lowerContent.includes('sim') || lowerContent.includes('yes') || lowerContent.includes('detectad'))) {
            analysis = { adult_content: true, reason: 'Conteúdo adulto detectado na análise' };
          }
        }

        analysisResults.push({
          url,
          adult_content: analysis.adult_content || false,
          reason: analysis.reason || undefined
        });

        if (analysis.adult_content) {
          hasAdultContent = true;
          moderationReason = analysis.reason || 'Conteúdo adulto/explícito detectado';
          console.log(`[moderate-content] ⛔ Conteúdo adulto detectado em: ${url.substring(0, 50)}...`);
        }

      } catch (mediaError) {
        console.error(`[moderate-content] Erro ao analisar mídia ${url}:`, mediaError);
        // Em caso de erro, aprovar (não bloquear por falha técnica)
        analysisResults.push({ url, adult_content: false, reason: 'Erro na análise' });
      }
    }

    // Determinar status: apenas approved ou rejected
    const moderationStatus = hasAdultContent ? 'rejected' : 'approved';

    console.log(`[moderate-content] Resultado final para post ${postId}: ${moderationStatus}`);

    // Atualizar o post
    const updateData: any = {
      moderation_status: moderationStatus,
      moderation_reason: hasAdultContent ? moderationReason : null,
      moderated_at: new Date().toISOString(),
      is_published: !hasAdultContent,
    };

    if (!hasAdultContent) {
      updateData.published_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);

    if (updateError) {
      console.error('[moderate-content] Erro ao atualizar post:', updateError);
      throw updateError;
    }

    // Criar notificação para o usuário
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post) {
      const notificationContent = hasAdultContent
        ? `Seu post foi rejeitado: ${moderationReason}`
        : 'Seu post foi aprovado e publicado!';

      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          actor_id: post.user_id,
          type: 'moderation',
          content: notificationContent,
          post_id: postId,
        });
    }

    return new Response(
      JSON.stringify({ 
        approved: !hasAdultContent,
        status: moderationStatus,
        reason: moderationReason || null,
        results: analysisResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[moderate-content] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
