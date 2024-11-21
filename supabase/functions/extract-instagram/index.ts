import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    // Use a proxy service to avoid Instagram's bot detection
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram post: ${response.statusText}`);
    }

    const html = await response.text();
    const textContent = extractTextContent(html);
    const imageUrl = extractImageUrl(html);

    return new Response(
      JSON.stringify({
        text_content: textContent,
        image_url: imageUrl,
        success: true
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

function extractTextContent(html: string): string {
  const textRegexes = [
    /<div class="_a9zs">([^<]+)<\/div>/,
    /<div class="_ae5q">([^<]+)<\/div>/,
    /<span class="_aacl[^>]*>([^<]+)<\/span>/,
    /<article[^>]*>(.*?)<\/article>/s
  ];

  for (const regex of textRegexes) {
    const match = html.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function extractImageUrl(html: string): string {
  const imgRegexes = [
    /img[^>]+class="_aagt"[^>]+src="([^"]+)"/,
    /img[^>]+decoding="sync"[^>]+src="([^"]+)"/,
    /img[^>]+class="_aa1d"[^>]+src="([^"]+)"/
  ];

  for (const regex of imgRegexes) {
    const match = html.match(regex);
    if (match?.[1] && (match[1].includes('scontent') || match[1].includes('cdninstagram'))) {
      return match[1];
    }
  }

  return '';
}