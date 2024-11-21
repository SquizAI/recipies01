import React, { useState } from 'react';
import { openai } from '../services/openai';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function TestChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    const toastId = toast.loading('Generating response...');

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: message }],
        max_tokens: 150
      });

      const responseText = completion.choices[0].message.content;
      setResponse(responseText || 'No response');
      toast.success('Response generated!', { id: toastId });
    } catch (error) {
      console.error('OpenAI Error:', error);
      toast.error('Failed to get response from AI', { id: toastId });
      setResponse('Error: Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 max-w-2xl mx-auto mt-12">
      <h3 className="text-xl font-semibold mb-4 text-purple-300">Test OpenAI Integration</h3>
      
      {response && (
        <div className="mb-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-gray-300">{response}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message to test OpenAI..."
          className="input-field flex-grow"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="btn-primary"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}