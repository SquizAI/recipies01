import React from 'react';
import { Download } from 'lucide-react';
import type { Recipe } from '../types/recipe';
import { RecipeDetails } from './RecipeDetails';

interface RecipeContentProps {
  recipe: Recipe;
  onDownload: () => void;
}

export function RecipeContent({ recipe, onDownload }: RecipeContentProps) {
  return (
    <div className="glass-panel p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-3xl font-bold text-purple-300">{recipe.title}</h2>
        <button
          onClick={onDownload}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
      
      <div className="space-y-8">
        <p className="text-gray-300">{recipe.description}</p>
        
        <RecipeDetails recipe={recipe} />
        
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Ingredients</h3>
            <div className="glass-panel p-6">
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-gray-300">
                    • {ingredient.amount} {ingredient.unit} {ingredient.name}
                    {ingredient.notes && (
                      <span className="text-gray-400 italic ml-2">({ingredient.notes})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Instructions</h3>
            <div className="glass-panel p-6">
              <ol className="space-y-4">
                {recipe.steps.map((step) => (
                  <li key={step.order} className="text-gray-300">
                    <div className="flex gap-4">
                      <span className="font-bold text-purple-400">{step.order}.</span>
                      <div>
                        <p>{step.instruction}</p>
                        {step.tips && (
                          <p className="mt-2 text-sm text-purple-400 italic">
                            Tip: {step.tips}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}