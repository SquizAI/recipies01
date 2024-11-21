import sharp from 'sharp';
import Jimp from 'jimp';
import path from 'path';
import { Recipe } from '../types/recipe';

export async function generateThumbnail(recipe: Recipe, imageUrl: string) {
  try {
    // Download and process image
    const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
    
    // Process with sharp for basic operations
    const image = sharp(Buffer.from(imageBuffer));
    
    // Resize maintaining aspect ratio
    const resized = await image
      .resize(1280, 720, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();

    // Use Jimp for text overlay
    const thumbnail = await Jimp.read(resized);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    // Add title
    thumbnail.print(
      font,
      40,
      thumbnail.bitmap.height - 140,
      recipe.title,
      thumbnail.bitmap.width - 80
    );

    // Add macro information
    const macroText = `${recipe.macros.calories} cal | P:${recipe.macros.protein_g}g | C:${recipe.macros.carbs_g}g | F:${recipe.macros.fat_g}g`;
    thumbnail.print(
      font,
      40,
      thumbnail.bitmap.height - 60,
      macroText
    );

    // Save thumbnail
    const filename = `recipe_thumbnail_${Date.now()}.jpg`;
    await thumbnail.writeAsync(filename);

    return filename;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
}