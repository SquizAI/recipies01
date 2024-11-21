import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Header } from './components/Header';
import { URLForm } from './components/URLForm';
import { RecipeContent } from './components/RecipeContent';
import { TestChat } from './components/TestChat';
import { ErrorBoundary } from './components/ErrorBoundary';
import { extractRecipe, generatePDF, APIError } from './services/api';
import type { Recipe } from './types/recipe';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Extracting recipe...');

    try {
      const extractedRecipe = await extractRecipe(url);
      setRecipe(extractedRecipe);
      toast.success('Recipe extracted successfully!', { id: toastId });
    } catch (error) {
      let message = 'Failed to extract recipe. Please try again.';
      if (error instanceof APIError) {
        message = error.message;
      }
      toast.error(message, { id: toastId });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!recipe) {
      toast.error('No recipe available to download');
      return;
    }

    const toastId = toast.loading('Generating PDF...');
    try {
      const pdfBlob = await generatePDF(recipe);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recipe.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
      let message = 'Failed to generate PDF. Please try again.';
      if (error instanceof APIError) {
        message = error.message;
      }
      toast.error(message, { id: toastId });
      console.error('Error:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Header />
          <URLForm
            url={url}
            loading={loading}
            onSubmit={handleSubmit}
            onUrlChange={setUrl}
          />
          {recipe && <RecipeContent recipe={recipe} onDownload={handleDownload} />}
          <TestChat />
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              borderRadius: '0.5rem',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
              duration: 5000,
            },
          }} 
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;