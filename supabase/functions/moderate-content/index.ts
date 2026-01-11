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

// Palavras-chave para identificar conteúdo impróprio
const PROHIBITED_KEYWORDS = [
  'pornografia', 'nudez', 'sexual', 'explícito', 'violência', 'gore',
  'ódio', 'discriminação', 'racismo', 'xenofobia', 'homofobia',
  'armas', 'drogas', 'terrorismo', 'assédio', 'abuso',
  'pornography', 'nudity', 'sexual', 'explicit', 'violence',
  'hate', 'discrimination', 'racism', 'weapons', 'drugs', 'terrorism'
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

    let isApproved = true;
    let moderationReason = '';
    const analysisResults: { url: string; approved: boolean; reason?: string }[] = [];

    // Analisar cada mídia
    for (const url of mediaUrls) {
      try {
        // Para vídeos, analisar apenas a thumbnail ou primeiro frame
        const isVideo = mediaType === 'video' || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
        
        const messages = [
          {
            role: 'system',
            content: `Você é um moderador de conteúdo. Analise a ${isVideo ? 'thumbnail do vídeo' : 'imagem'} e determine se contém:
1. Conteúdo sexual explícito ou nudez
2. Violência gráfica ou gore
3. Discurso de ódio, símbolos de ódio ou conteúdo discriminatório
4. Conteúdo que promova drogas ilegais
5. Conteúdo terrorista ou que promova violência
6. Assédio ou bullying

Responda APENAS com um JSON no formato:
{
  "approved": true/false,
  "reason": "motivo se reprovado, vazio se aprovado",
  "confidence": 0-100
}

Seja rigoroso. Se houver dúvida, reprove.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e verifique se viola as diretrizes da comunidade.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: url,
                  detail: 'low'
                }
              }
            ]
          }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 200,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[moderate-content] Erro OpenAI: ${response.status} - ${errorText}`);
          // Em caso de erro da API, aprovar por padrão mas logar
          analysisResults.push({ url, approved: true, reason: 'Erro na análise' });
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log(`[moderate-content] Resposta para ${url}: ${content}`);

        // Extrair JSON da resposta
        let analysis = { approved: true, reason: '', confidence: 0 };
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('[moderate-content] Erro ao parsear resposta:', parseError);
          // Verificar palavras-chave na resposta
          const lowerContent = content.toLowerCase();
          const hasProhibited = PROHIBITED_KEYWORDS.some(kw => lowerContent.includes(kw));
          if (hasProhibited && (lowerContent.includes('não') || lowerContent.includes('viola') || lowerContent.includes('reprova'))) {
            analysis = { approved: false, reason: 'Conteúdo potencialmente inadequado detectado', confidence: 70 };
          }
        }

        analysisResults.push({
          url,
          approved: analysis.approved,
          reason: analysis.reason || undefined
        });

        if (!analysis.approved) {
          isApproved = false;
          moderationReason = analysis.reason || 'Conteúdo viola as diretrizes da comunidade';
        }

      } catch (mediaError) {
        console.error(`[moderate-content] Erro ao analisar mídia ${url}:`, mediaError);
        // Em caso de erro, aprovar por padrão
        analysisResults.push({ url, approved: true, reason: 'Erro na análise' });
      }
    }

    console.log(`[moderate-content] Resultado final para post ${postId}: approved=${isApproved}`);

    // Atualizar o post baseado no resultado
    if (isApproved) {
      // Publicar o post
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) {
        console.error('[moderate-content] Erro ao publicar post:', updateError);
        throw updateError;
      }
    } else {
      // Manter como não publicado e criar um report automático
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (post) {
        // Criar notificação para o usuário
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            actor_id: post.user_id,
            type: 'moderation',
            content: `Seu post foi rejeitado pela moderação automática: ${moderationReason}`,
            post_id: postId,
          });
      }

      // Deletar o post reprovado
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
    }

    return new Response(
      JSON.stringify({ 
        approved: isApproved,
        reason: moderationReason,
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
