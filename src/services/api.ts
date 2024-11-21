import { openai } from './openai';
import { supabase } from '../lib/supabase';
import type { Recipe } from '../types/recipe';
import { parseRecipeContent } from './recipe';

export class APIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function extractRecipe(url: string): Promise<Recipe> {
  try {
    // Check cache first
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('source_url', url)
      .single();

    if (existingRecipe) {
      return existingRecipe as Recipe;
    }

    // Extract content from Instagram
    const response = await fetch('/api/instagram/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new APIError('Could not access Instagram content', 'EXTRACTION_ERROR');
    }

    const content = await response.json();
    if (!content || !content.text_content) {
      throw new APIError('No content found in Instagram post', 'EXTRACTION_ERROR');
    }

    // Extract video content and transcription if available
    const videoResponse = await fetch('/api/video/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    let videoData = null;
    if (videoResponse.ok) {
      videoData = await videoResponse.json();
      content.transcription = videoData?.transcription;
    }

    // Parse recipe using GPT-4o structured output
    const recipe = await parseRecipeContent(content);

    // Save to cache
    await supabase
      .from('recipes')
      .insert([{ ...recipe, source_url: url }])
      .select()
      .single();

    return recipe;
  } catch (error) {
    console.error('Recipe extraction error:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to extract recipe', 'EXTRACTION_ERROR');
  }
}

export async function generatePDF(recipe: Recipe): Promise<Blob> {
  try {
    const response = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    });

    if (!response.ok) {
      throw new APIError('Failed to generate PDF', 'PDF_ERROR');
    }

    return await response.blob();
  } catch (error) {
    console.error('PDF generation error:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to generate PDF', 'PDF_ERROR');
  }
}