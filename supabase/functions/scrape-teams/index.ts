import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedTeam {
  nome: string;
  escudo_url: string;
  cidade?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, estadoId, paisId } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    // Call Firecrawl API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Erro ao acessar site: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    
    console.log('HTML length:', html.length);
    console.log('Markdown length:', markdown.length);

    // Parse teams from the escudosfc.com.br format
    const teams: ScrapedTeam[] = [];
    
    // Pattern to extract team data from HTML tables
    // The site uses tables with img tags for shields and team names below
    const imgRegex = /<img[^>]*src="([^"]*images\/[^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi;
    const matches = [...html.matchAll(imgRegex)];
    
    const seenTeams = new Set<string>();
    
    for (const match of matches) {
      const escudoUrl = match[1];
      let teamName = match[2]?.trim();
      
      // Skip non-team images (headers, icons, etc.)
      if (!teamName || teamName.length < 2) continue;
      if (escudoUrl.includes('tit_head') || escudoUrl.includes('transp') || escudoUrl.includes('resu')) continue;
      if (escudoUrl.includes('cbf') && !teamName.toLowerCase().includes('cbf')) continue;
      
      // Clean up team name
      teamName = teamName.replace(/\(.*\)$/, '').trim();
      
      // Skip duplicates
      const key = teamName.toLowerCase();
      if (seenTeams.has(key)) continue;
      seenTeams.add(key);
      
      // Make URL absolute if relative
      let fullUrl = escudoUrl;
      if (!escudoUrl.startsWith('http')) {
        const baseUrl = new URL(formattedUrl);
        fullUrl = `${baseUrl.origin}/${escudoUrl.replace(/^\//, '')}`;
      }
      
      teams.push({
        nome: teamName,
        escudo_url: fullUrl,
      });
    }

    // Also try to extract city names from the markdown
    // The site shows city names below team names
    const lines = markdown.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Check if this line is a team name we already have
      const team = teams.find(t => line.includes(t.nome));
      if (team && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // If next line looks like a city name (not empty, not another team, not special chars)
        if (nextLine && 
            !nextLine.startsWith('|') && 
            !nextLine.startsWith('*') &&
            !nextLine.includes('http') &&
            nextLine.length > 2 &&
            nextLine.length < 50) {
          team.cidade = nextLine;
        }
      }
    }

    console.log(`Found ${teams.length} teams`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        teams,
        totalFound: teams.length,
        sourceUrl: formattedUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping teams:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao extrair times';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
