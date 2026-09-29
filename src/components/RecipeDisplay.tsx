import React, { useState } from 'react';
import {
  Bookmark,
  Printer,
  Copy,
  Clock,
  Flame,
  Users,
  Sparkles,
  UtensilsCrossed,
  Wine,
  Lightbulb,
  CheckCircle2,
  Share2,
  RotateCw,
  Layers,
  Heart,
  Activity,
  Zap,
} from 'lucide-react';
import { Recipe } from '../types.ts';

interface RecipeDisplayProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: () => void;
  onRegenerate?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({
  recipe,
  isSaved,
  onToggleSave,
  onRegenerate,
  onShowToast,
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleAllIngredients = () => {
    const allChecked = recipe.ingredients.every((_, idx) => checkedIngredients[idx]);
    if (allChecked) {
      setCheckedIngredients({});
    } else {
      const next: Record<number, boolean> = {};
      recipe.ingredients.forEach((_, idx) => {
        next[idx] = true;
      });
      setCheckedIngredients(next);
    }
  };

  const copyRecipeText = () => {
    const nutritionText = recipe.nutrition
      ? `\n📊 VALORI NUTRIȚIONALE (per porție):
• Calorii: ${recipe.nutrition.calories}
• Proteine: ${recipe.nutrition.protein}
• Carbohidrați: ${recipe.nutrition.carbs}
• Grăsimi: ${recipe.nutrition.fat}${recipe.nutrition.fiber ? `\n• Fibre: ${recipe.nutrition.fiber}` : ''}\n`
      : recipe.calories
      ? `\n⚡ Calorii estimate: ${recipe.calories}\n`
      : '';

    const text = `🍽️ ${recipe.title}
${recipe.description}

⏱️ Timp Preparare: ${recipe.prepTime} | Gătire: ${recipe.cookTime} | Porții: ${recipe.servings}
🔥 Dificultate: ${recipe.difficulty} ${recipe.nutrition?.calories || recipe.calories ? `| Calorii: ${recipe.nutrition?.calories || recipe.calories}` : ''}
${nutritionText}
🛒 INGREDIENTE:
${recipe.ingredients.map((ing) => `• ${ing}`).join('\n')}

👨‍🍳 PAȘI DE PREPARARE:
${recipe.steps.map((st, i) => `${i + 1}. ${st}`).join('\n\n')}

${recipe.chefTips && recipe.chefTips.length > 0 ? `✨ SECRETELE BUCĂTARULUI:\n${recipe.chefTips.map((t) => `• ${t}`).join('\n')}\n` : ''}
${recipe.winePairing ? `🍷 ASOCIERE CULINARĂ: ${recipe.winePairing}\n` : ''}
Generat cu ChefAI (Gemini AI)`;

    navigator.clipboard.writeText(text);
    onShowToast('Rețeta completă cu valori nutriționale a fost copiată în clipboard!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="recipePrintArea" className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Banner image with overlay */}
        <div className="relative h-72 sm:h-96 w-full bg-slate-950 overflow-hidden group">
          <img
            src={recipe.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex flex-wrap gap-2 pointer-events-auto">
              {recipe.category && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 border border-slate-700/80 text-orange-400 backdrop-blur-md shadow">
                  {recipe.category}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-600/90 text-white shadow backdrop-blur-md">
                {recipe.difficulty}
              </span>
              {(recipe.nutrition?.calories || recipe.calories) && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                  ⚡ {recipe.nutrition?.calories || recipe.calories}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Title & Actions */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-wider font-bold text-orange-400 mb-1 block">
                Rețetă Generată de ChefAI
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                {recipe.title}
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={onToggleSave}
                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold backdrop-blur-md transition flex items-center space-x-2 shadow-lg ${
                  isSaved
                    ? 'bg-orange-600 text-white border-orange-500 shadow-orange-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-white' : 'text-orange-400'}`} />
                <span>{isSaved ? 'Salvat' : 'Salvează'}</span>
              </button>

              <button
                onClick={copyRecipeText}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium backdrop-blur-md transition flex items-center space-x-1.5 shadow-lg"
                title="Copiază textul rețetei"
              >
                <Copy className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Copiază</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium backdrop-blur-md transition flex items-center space-x-1.5 shadow-lg"
                title="Tipărește rețeta"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Printează</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-950/70 border-b border-slate-800 text-center py-4 text-sm font-medium">
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-400" /> Preparare
            </span>
            <span className="text-white font-bold text-base">{recipe.prepTime}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Gătire
            </span>
            <span className="text-white font-bold text-base">{recipe.cookTime}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-400" /> Porții
            </span>
            <span className="text-white font-bold text-base">{recipe.servings}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-orange-400" /> Dificultate
            </span>
            <span className="text-white font-bold text-base">{recipe.difficulty}</span>
          </div>
        </div>

        {/* Recipe Content Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Description Block */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 to-amber-500"></div>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base italic pl-2">
              "{recipe.description}"
            </p>
          </div>

          {/* Nutritional Values & Macros Section */}
          {(recipe.nutrition || recipe.calories) && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
                  <Activity className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0" />
                  Valori Nutriționale Estimate (per porție)
                </h3>
                <span className="text-[11px] font-medium text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800/80 w-fit">
                  Calculat de ChefAI
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Calories */}
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-orange-400 font-bold block mb-1">
                    Calorii
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-white">
                    {recipe.nutrition?.calories || recipe.calories || 'N/A'}
                  </span>
                </div>

                {/* Protein */}
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold block mb-1">
                    Proteine
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-white">
                    {recipe.nutrition?.protein || 'N/A'}
                  </span>
                </div>

                {/* Carbs */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block mb-1">
                    Carbohidrați
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-white">
                    {recipe.nutrition?.carbs || 'N/A'}
                  </span>
                </div>

                {/* Fat */}
                <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-yellow-400 font-bold block mb-1">
                    Grăsimi
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-white">
                    {recipe.nutrition?.fat || 'N/A'}
                  </span>
                </div>

                {/* Fiber (if available) */}
                {recipe.nutrition?.fiber && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center col-span-2 sm:col-span-4 lg:col-span-1">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      Fibre
                    </span>
                    <span className="text-lg sm:text-2xl font-black text-white">
                      {recipe.nutrition.fiber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Ingredients column */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                  <UtensilsCrossed className="w-5 h-5 text-orange-400 mr-2.5" />
                  Ingrediente necesare
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {recipe.ingredients.length}
                  </span>
                </h3>

                <button
                  onClick={toggleAllIngredients}
                  className="text-xs text-orange-400 hover:text-orange-300 transition font-medium hover:underline print:hidden"
                >
                  {recipe.ingredients.every((_, idx) => checkedIngredients[idx]) ? 'Debifează toate' : 'Bifează toate'}
                </button>
              </div>

              <ul className="space-y-2.5">
                {recipe.ingredients.map((ingredient, idx) => {
                  const isChecked = !!checkedIngredients[idx];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleIngredient(idx)}
                      className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-slate-950/30 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleIngredient(idx)}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-700 cursor-pointer mt-0.5"
                      />
                      <span className="text-sm flex-1 leading-snug">{ingredient}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Wine Pairing card */}
              {recipe.winePairing && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 to-orange-950/20 border border-orange-500/20 space-y-1.5">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center">
                    <Wine className="w-4 h-4 mr-1.5" />
                    Asociere Vin &amp; Băuturi
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {recipe.winePairing}
                  </p>
                </div>
              )}
            </div>

            {/* Steps & Tips column */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <CheckCircle2 className="w-5 h-5 text-orange-400 mr-2.5" />
                Pași de preparare
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {recipe.steps.length} pași
                </span>
              </h3>

              <ol className="space-y-3.5">
                {recipe.steps.map((step, idx) => {
                  const isDone = !!checkedSteps[idx];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-slate-950/30 border-slate-800 opacity-60'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm transition-colors border ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`text-sm leading-relaxed ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {step}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Chef Tips */}
              {recipe.chefTips && recipe.chefTips.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 mt-6">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Secretele Bucătarului (Chef Tips)
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                    {recipe.chefTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-orange-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
