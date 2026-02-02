type DeezerTrack = {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
};

function getSupabaseFunctionBaseUrl() {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error("Missing VITE_SUPABASE_URL");
  return `${base}/functions/v1`;
}

function getSupabasePublishableKey() {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
  return key;
}

export async function fetchDeezerTracksBySearch(searchQuery: string, limit = 10): Promise<DeezerTrack[]> {
  const q = searchQuery.trim();
  if (!q) return [];

  const url = `${getSupabaseFunctionBaseUrl()}/fetch-deezer-music?search=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getSupabasePublishableKey()}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Deezer tracks (status ${res.status})`);
  }

  const json = await res.json();
  return (json?.tracks ?? []) as DeezerTrack[];
}

export async function fetchFreshDeezerPreviewUrl(params: {
  title?: string | null;
  artist?: string | null;
}): Promise<string | null> {
  const title = params.title?.trim();
  const artist = params.artist?.trim();
  const query = [title, artist].filter(Boolean).join(" ");
  if (!query) return null;

  const tracks = await fetchDeezerTracksBySearch(query, 10);
  if (!tracks.length) return null;

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const tNeedle = title ? normalize(title) : null;
  const aNeedle = artist ? normalize(artist) : null;

  const best = tracks.find((t) => {
    if (!tNeedle && !aNeedle) return false;
    const tOk = tNeedle ? normalize(t.title) === tNeedle : true;
    const aOk = aNeedle ? normalize(t.artist) === aNeedle : true;
    return tOk && aOk;
  });

  return (best ?? tracks[0])?.audio_url ?? null;
}

export function isDeezerSignedUrlExpired(audioUrl: string): boolean {
  try {
    const u = new URL(audioUrl);
    const hdnea = u.searchParams.get("hdnea");
    if (!hdnea) return false;
    const match = hdnea.match(/exp=(\d+)/);
    if (!match) return false;
    const exp = Number(match[1]);
    if (!Number.isFinite(exp)) return false;
    return exp <= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
