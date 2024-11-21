import React from 'react';
import { ChefHat } from 'lucide-react';

export function Header() {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-4">
        <ChefHat className="w-16 h-16 text-purple-400" />
      </div>
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-violet-400 text-transparent bg-clip-text">
        Recipe Extractor
      </h1>
      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        Transform Instagram recipe posts into beautifully formatted, printable recipes with detailed instructions and nutritional information.
      </p>
    </div>
  );
}