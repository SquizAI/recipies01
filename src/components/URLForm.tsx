import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface URLFormProps {
  url: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUrlChange: (url: string) => void;
}

export function URLForm({ url, loading, onSubmit, onUrlChange }: URLFormProps) {
  return (
    <div className="max-w-2xl mx-auto mb-12">
      <form onSubmit={onSubmit} className="glass-panel p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Paste Instagram recipe URL here..."
              className="input-field pl-12"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Extract Recipe'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}