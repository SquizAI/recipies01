import { openai } from './openai';
import { RecipeSchema } from '../types/recipe';
import { zodResponseFormat } from 'openai/helpers/zod';

export class RecipeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RecipeError';
  }
}

export async function parseRecipeContent(content: { text_content: string; video_transcription?: string }) {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { 
          role: "system", 
          content: "Extract detailed recipe information including ingredients, steps, and nutritional information. If any information is missing, make reasonable estimates based on similar recipes." 
        },
        { 
          role: "user", 
          content: `Extract recipe information from the following content:
            Text: ${content.text_content}
            ${content.video_transcription ? `Video Transcription: ${content.video_transcription}` : ''}`
        }
      ],
      response_format: zodResponseFormat(RecipeSchema, "recipe")
    });

    return completion.choices[0].message.parsed;
  } catch (error) {
    console.error('Recipe parsing error:', error);
    throw new RecipeError('Failed to parse recipe content', 'EXTRACTION_ERROR');
  }
}

export async function extractRecipe(url: string) {
  try {
    // Extract content from Instagram using proxy service
    const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new RecipeError('Could not access Instagram content', 'EXTRACTION_ERROR');
    }

    const html = await response.text();
    const content = {
      text_content: extractTextContent(html),
      image_url: extractImageUrl(html),
      url
    };

    if (!content.text_content) {
      throw new RecipeError('No content found in Instagram post', 'EXTRACTION_ERROR');
    }

    // Parse recipe using GPT-4o structured output
    const recipe = await parseRecipeContent(content);
    if (!recipe) {
      throw new RecipeError('Could not parse recipe', 'EXTRACTION_ERROR');
    }

    return recipe;
  } catch (error) {
    console.error('Recipe extraction error:', error);
    if (error instanceof RecipeError) {
      throw error;
    }
    throw new RecipeError('Failed to extract recipe', 'EXTRACTION_ERROR');
  }
}

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