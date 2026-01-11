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
    let isFlagged = false;
    let moderationReason = '';
    let confidenceLevel = 100;
    const analysisResults: { url: string; approved: boolean; flagged: boolean; reason?: string; confidence: number }[] = [];

    // Analisar cada mídia
    for (const url of mediaUrls) {
      try {
        // Para vídeos, analisar apenas a thumbnail ou primeiro frame
        const isVideo = mediaType === 'video' || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
        
        const messages = [
          {
            role: 'system',
            content: `Você é um moderador de conteúdo rigoroso. Analise a ${isVideo ? 'thumbnail do vídeo' : 'imagem'} e determine se contém:
1. Conteúdo sexual explícito ou nudez
2. Violência gráfica ou gore
3. Discurso de ódio, símbolos de ódio ou conteúdo discriminatório
4. Conteúdo que promova drogas ilegais
5. Conteúdo terrorista ou que promova violência
6. Assédio ou bullying

Responda APENAS com um JSON no formato:
{
  "approved": true/false,
  "flagged": true/false,
  "reason": "motivo detalhado se reprovado ou flagged, vazio se aprovado sem dúvidas",
  "confidence": 0-100
}

REGRAS:
- "approved": true significa conteúdo completamente seguro
- "flagged": true significa que precisa revisão humana (dúvidas, conteúdo suspeito mas não claramente violador)
- Se confidence < 80, marque como flagged para revisão manual
- Se conteúdo claramente viola as regras, approved=false e flagged=false
- Se conteúdo parece suspeito mas não é claramente violador, approved=false e flagged=true`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e verifique se viola as diretrizes da comunidade de uma rede social de futebol.'
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
          // Em caso de erro da API, marcar para revisão manual
          analysisResults.push({ url, approved: false, flagged: true, reason: 'Erro na análise automática - requer revisão manual', confidence: 0 });
          isFlagged = true;
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log(`[moderate-content] Resposta para ${url}: ${content}`);

        // Extrair JSON da resposta
        let analysis = { approved: true, flagged: false, reason: '', confidence: 100 };
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
            analysis = { approved: false, flagged: true, reason: 'Conteúdo potencialmente inadequado detectado', confidence: 50 };
          }
        }

        // Se confidence baixo, forçar flagged
        if (analysis.confidence < 80 && analysis.approved) {
          analysis.flagged = true;
          analysis.reason = analysis.reason || 'Baixa confiança na análise - requer revisão manual';
        }

        analysisResults.push({
          url,
          approved: analysis.approved,
          flagged: analysis.flagged || false,
          reason: analysis.reason || undefined,
          confidence: analysis.confidence || 100
        });

        if (!analysis.approved) {
          isApproved = false;
          if (analysis.flagged) {
            isFlagged = true;
          }
          moderationReason = analysis.reason || 'Conteúdo viola as diretrizes da comunidade';
          confidenceLevel = Math.min(confidenceLevel, analysis.confidence || 0);
        } else if (analysis.flagged) {
          isFlagged = true;
          if (!moderationReason) {
            moderationReason = analysis.reason || 'Requer revisão manual';
          }
        }

      } catch (mediaError) {
        console.error(`[moderate-content] Erro ao analisar mídia ${url}:`, mediaError);
        // Em caso de erro, marcar para revisão manual
        analysisResults.push({ url, approved: false, flagged: true, reason: 'Erro na análise', confidence: 0 });
        isFlagged = true;
      }
    }

    console.log(`[moderate-content] Resultado final para post ${postId}: approved=${isApproved}, flagged=${isFlagged}`);

    // Determinar status de moderação
    let moderationStatus: 'approved' | 'rejected' | 'flagged';
    
    if (isApproved && !isFlagged) {
      moderationStatus = 'approved';
    } else if (!isApproved && !isFlagged) {
      moderationStatus = 'rejected';
    } else {
      moderationStatus = 'flagged';
    }

    // Atualizar o post baseado no resultado
    const updateData: any = {
      moderation_status: moderationStatus,
      moderation_reason: moderationReason || null,
      moderated_at: new Date().toISOString(),
    };

    if (moderationStatus === 'approved') {
      updateData.is_published = true;
      updateData.published_at = new Date().toISOString();
    } else {
      updateData.is_published = false;
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
      let notificationContent = '';
      let notificationType = 'moderation';

      if (moderationStatus === 'approved') {
        notificationContent = 'Seu post foi aprovado e publicado!';
      } else if (moderationStatus === 'flagged') {
        notificationContent = 'Seu post está em análise pela nossa equipe. Você será notificado quando a revisão for concluída.';
      } else {
        notificationContent = `Seu post foi rejeitado: ${moderationReason}`;
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          actor_id: post.user_id,
          type: notificationType,
          content: notificationContent,
          post_id: postId,
        });
    }

    return new Response(
      JSON.stringify({ 
        approved: isApproved && !isFlagged,
        flagged: isFlagged,
        status: moderationStatus,
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
