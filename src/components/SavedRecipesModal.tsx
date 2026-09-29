import React, { useState } from 'react';
import { X, Bookmark, Trash2, Clock, Flame, Users, Search, Download, ChefHat } from 'lucide-react';
import { Recipe } from '../types.ts';

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onSelectRecipe,
  onDeleteRecipe,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportRecipes = () => {
    if (recipes.length === 0) return;
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chefai-retete-salvate-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Colecția de rețete a fost descărcată!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Rețete Salvate
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                  {recipes.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Colecția ta personală de preparate culinare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar & export */}
        {recipes.length > 0 && (
          <div className="px-6 pt-4 pb-2 flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Caută în rețetele salvate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500 transition"
              />
            </div>
            <button
              onClick={exportRecipes}
              title="Descarcă rețetele salvate în format JSON"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Exportă</span>
            </button>
          </div>
        )}

        {/* Recipes List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-grow">
          {recipes.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                <ChefHat className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-white">Nu ai nicio rețetă salvată</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Când găsești o rețetă care îți place, apasă butonul "Salvează" pentru a o păstra în această listă.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Nicio rețetă găsită pentru "{searchTerm}".
            </div>
          ) : (
            filtered.map((recipe) => (
              <div
                key={recipe.id}
                className="group p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition flex items-center justify-between gap-4"
              >
                <div
                  className="flex items-center space-x-3.5 sm:space-x-4 cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    onSelectRecipe(recipe);
                    onClose();
                  }}
                >
                  <img
                    src={recipe.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80'}
                    alt={recipe.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-400 transition truncate">
                      {recipe.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{recipe.description}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center text-slate-300">
                        <Clock className="w-3 h-3 text-orange-400 mr-1" />
                        {recipe.prepTime}
                      </span>
                      <span className="flex items-center text-slate-300">
                        <Flame className="w-3 h-3 text-orange-400 mr-1" />
                        {recipe.difficulty}
                      </span>
                      <span className="flex items-center text-slate-300 hidden sm:flex">
                        <Users className="w-3 h-3 text-orange-400 mr-1" />
                        {recipe.servings}
                      </span>
                      {(recipe.nutrition?.calories || recipe.calories) && (
                        <span className="flex items-center text-amber-300 font-semibold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          ⚡ {recipe.nutrition?.calories || recipe.calories}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      onSelectRecipe(recipe);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition shadow-md shadow-orange-600/20"
                  >
                    Vezi
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Sigur dorești să ștergi rețeta "${recipe.title}" din favorite?`)) {
                        onDeleteRecipe(recipe.id);
                        onShowToast('Rețeta a fost ștearsă din favorite.', 'info');
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition flex items-center justify-center border border-slate-700/60"
                    title="Șterge rețeta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
