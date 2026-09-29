import React from 'react';
import { ChefHat, Bookmark, Sparkles } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onOpenSaved: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  savedCount,
  onOpenSaved,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-1 ring-white/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                ChefAI Rețete
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Gătește inteligent cu Gemini AI</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-3">
          {/* Saved Recipes Button */}
          <button
            onClick={onOpenSaved}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium transition flex items-center space-x-2 shadow-sm hover:border-orange-500/40 text-slate-200"
          >
            <Bookmark className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Rețete Salvate</span>
            <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full font-bold">
              {savedCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
