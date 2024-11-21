import axios from 'axios';
import type { Recipe } from '../types/recipe';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function extractRecipe(url: string): Promise<Recipe> {
  try {
    const response = await api.post('/api/extract', { url });
    return response.data;
  } catch (error) {
    console.error('Recipe extraction error:', error);
    throw new Error('Failed to extract recipe');
  }
}

export async function generatePDF(recipe: Recipe): Promise<Blob> {
  try {
    const response = await api.post('/api/pdf', recipe, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}