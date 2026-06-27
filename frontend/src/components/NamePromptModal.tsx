import React, { useState, useEffect } from 'react';
import { User, Sparkles } from 'lucide-react';

interface NamePromptModalProps {
  isOpen: boolean;
  onSave: (name: string) => Promise<void>;
  loading: boolean;
}

export function NamePromptModal({ isOpen, onSave, loading }: NamePromptModalProps) {
  const [name, setName] = useState('');

  // Reset internal state if it opens
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">How should Krishna address you?</h2>
          <p className="text-zinc-400 text-sm">
            Please enter your name to make your divine guidance deeply personal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="e.g. Arjuna"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 px-4 font-medium transition-all shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
          >
            {loading ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </div>
    </div>
  );
}
