import { z } from 'zod';

export const MacroNutrientsSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
  sugar_g: z.number(),
  saturated_fat_g: z.number(),
  protein_percentage: z.number(),
  carbs_percentage: z.number(),
  fat_percentage: z.number()
});

export const ShoppingItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  category: z.string(),
  store_section: z.string()
});

export const IngredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
  category: z.string(),
  macro_contribution: z.record(z.string(), z.number()).optional(),
  shopping_info: ShoppingItemSchema.optional()
});

export const CookingStepSchema = z.object({
  order: z.number(),
  instruction: z.string(),
  duration_minutes: z.number().optional(),
  temperature: z.string().optional(),
  tips: z.string().optional(),
  equipment_needed: z.array(z.string())
});

export const RecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  cuisine_type: z.string(),
  difficulty: z.string(),
  servings: z.number(),
  prep_time: z.number(),
  cook_time: z.number(),
  total_time: z.number(),
  ingredients: z.array(IngredientSchema),
  steps: z.array(CookingStepSchema),
  macros: MacroNutrientsSchema,
  equipment_needed: z.array(z.string()),
  tags: z.array(z.string()),
  tips_and_tricks: z.array(z.string()),
  storage_instructions: z.string(),
  reheating_instructions: z.string(),
  variations: z.array(z.string()),
  calories_per_serving: z.number(),
  cost_estimate: z.number(),
  shopping_list: z.array(ShoppingItemSchema),
  source_url: z.string().optional(),
  video_transcription: z.string().optional(),
  thumbnail_url: z.string().optional(),
  created_at: z.string()
});

export type MacroNutrients = z.infer<typeof MacroNutrientsSchema>;
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type CookingStep = z.infer<typeof CookingStepSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;