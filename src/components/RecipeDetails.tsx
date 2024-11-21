import React from 'react';
import type { Recipe } from '../types/recipe';

interface RecipeDetailsProps {
  recipe: Recipe;
}

export function RecipeDetails({ recipe }: RecipeDetailsProps) {
  const details = [
    { label: 'Prep Time', value: `${recipe.prep_time} min` },
    { label: 'Cook Time', value: `${recipe.cook_time} min` },
    { label: 'Servings', value: recipe.servings },
    { label: 'Difficulty', value: recipe.difficulty },
  ];

  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Recipe Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {details.map(({ label, value }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="font-semibold text-gray-200">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}