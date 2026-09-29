import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Sparkles,
  Utensils,
  Carrot,
  CookingPot,
  SlidersHorizontal,
  Bookmark,
  ArrowRight,
  RefreshCw,
  Flame,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
} from 'lucide-react';
import { Recipe, GeneratorMode } from './types.ts';
import { generateRecipe, checkServerStatus } from './services/recipeService.ts';
import { Header } from './components/Header.tsx';
import { RecipeDisplay } from './components/RecipeDisplay.tsx';
import { SavedRecipesModal } from './components/SavedRecipesModal.tsx';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DISH_SUGGESTIONS = [
  'Ciorbă de burtă tradițională',
  'Paste Carbonara autentice',
  'Papanași pufoși cu smântână și dulceață',
  'Sărmăluțe în foi de varză cu mămăliguță',
  'Somon la cuptor cu lămâie și sparanghel',
  'Tiramisu clasic italian',
  'Musaca de cartofi cu carne tocată',
  'Ostropel fraged de pui cu usturoi',
];

const FRIDGE_SUGGESTIONS = [
  'ouă',
  'cartofi',
  'telemea',
  'ceapă',
  'piept de pui',
  'ciuperci',
  'roșii',
  'smântână',
  'usturoi',
  'orez',
  'ardei gras',
  'cașcaval',
];

const LOADING_MESSAGES = [
  'ChefAI analizează ingredientele și combinațiile de arome...',
  'Calculăm gramajele precise și timpii optimi de gătire...',
  'Formulăm secretele maestrului bucătar și recomandarea de vin...',
  'Generăm fotografia culinară apetisantă a preparatului...',
];

export default function App() {
  const [mode, setMode] = useState<GeneratorMode>('dish');
  const [dishName, setDishName] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState('');
  const [dietary, setDietary] = useState('oricare');
  const [timeConstraint, setTimeConstraint] = useState('oricat');
  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = localStorage.getItem('chefai_saved_recipes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check server status
  useEffect(() => {
    checkServerStatus().then((status) => {
      setHasServerKey(status.hasKey);
    });
  }, []);

  // Save to localStorage when savedRecipes changes
  useEffect(() => {
    try {
      localStorage.setItem('chefai_saved_recipes', JSON.stringify(savedRecipes));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [savedRecipes]);

  // Loading text cycling
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleAddFridgeIngredient = (ing: string) => {
    setFridgeIngredients((prev) => {
      const items = prev
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!items.includes(ing)) {
        return items.length ? `${prev.trim()}, ${ing}` : ing;
      }
      return prev;
    });
  };

  const handleGenerate = async () => {
    if (mode === 'dish') {
      if (!dishName.trim()) {
        showToast('Te rugăm să introduci numele unui preparat!', 'error');
        return;
      }
    } else {
      if (!fridgeIngredients.trim()) {
        showToast('Te rugăm să introduci cel puțin un ingredient din frigider!', 'error');
        return;
      }
    }

    setIsLoading(true);
    setCurrentRecipe(null);

    // Smooth scroll down to progress area
    setTimeout(() => {
      document.getElementById('generationArea')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const recipe = await generateRecipe({
        mode,
        dishName: dishName.trim(),
        ingredients: fridgeIngredients.trim(),
        dietary,
        timeConstraint,
      });

      setCurrentRecipe(recipe);
      showToast('Rețeta a fost generată cu succes!', 'success');
      setTimeout(() => {
        document.getElementById('recipePrintArea')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Eroare la generarea rețetei. Te rugăm să încerci din nou.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentRecipeSaved = currentRecipe
    ? savedRecipes.some((r) => r.title.toLowerCase() === currentRecipe.title.toLowerCase())
    : false;

  const handleToggleSave = () => {
    if (!currentRecipe) return;
    const exists = savedRecipes.some((r) => r.title.toLowerCase() === currentRecipe.title.toLowerCase());
    if (exists) {
      setSavedRecipes((prev) => prev.filter((r) => r.title.toLowerCase() !== currentRecipe.title.toLowerCase()));
      showToast('Rețeta a fost eliminată din favorite.', 'info');
    } else {
      setSavedRecipes((prev) => [currentRecipe, ...prev]);
      showToast('Rețeta a fost salvată în colecția ta!', 'success');
    }
  };

  const handleDeleteSaved = (id: string) => {
    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <Header
        savedCount={savedRecipes.length}
        onOpenSaved={() => setIsSavedModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-grow w-full">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inteligență Artificială Culinară • Gemini 3.8</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
            Ce gătim astăzi?
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Scrie numele preparatului dorit sau introdu ingredientele din frigider, iar ChefAI îți va crea rețeta completă cu gramaje exacte, pași detaliați și fotografie apetisantă!
          </p>
        </div>

        {/* Input Card Container */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-12">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-950/80 p-1.5 mb-6 border border-slate-800">
            <button
              onClick={() => setMode('dish')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 ${
                mode === 'dish'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Nume Preparat</span>
            </button>

            <button
              onClick={() => setMode('fridge')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 ${
                mode === 'fridge'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Carrot className="w-4 h-4" />
              <span>Ce am în frigider</span>
            </button>
          </div>

          {/* Mode: Dish Name */}
          {mode === 'dish' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Ce mâncare ai poftă să pregătești?
              </label>

              <div className="relative">
                <Utensils className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="ex: Ciorbă de burtă, Paste Carbonara, Tiramisu, Papanași..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 outline-none transition text-sm sm:text-base"
                />
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Sugestii populare:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {DISH_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDishName(item)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition select-none"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode: Fridge Ingredients */}
          {mode === 'fridge' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Ce ingrediente ai la dispoziție? (separate prin virgulă)
              </label>

              <div className="relative">
                <Carrot className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={fridgeIngredients}
                  onChange={(e) => setFridgeIngredients(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="ex: ouă, cartofi, telemea, piept de pui, ceapă, ciuperci..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-slate-500 outline-none transition text-sm sm:text-base"
                />
              </div>

              {/* Fridge Quick Add Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Apasă pentru a adăuga ingrediente rapide:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {FRIDGE_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddFridgeIngredient(item)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-orange-400 hover:border-orange-500/40 transition select-none flex items-center space-x-1"
                    >
                      <span className="text-orange-400 font-bold">+</span>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Dietary & Time Filters Toggle */}
          <div className="pt-4 border-t border-slate-800/80 mt-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span>{showFilters ? 'Ascunde opțiuni avansate (Dietă, Timp)' : 'Opțiuni avansate (Dietă, Timp de gătire)'}</span>
            </button>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/60 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Preferință dietetică
                  </label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-orange-500 transition"
                  >
                    <option value="oricare">Oricare (Fără restricții)</option>
                    <option value="Tradițional românesc">Tradițional românesc</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan (De post)</option>
                    <option value="Low Carb / Keto">Low Carb / Keto</option>
                    <option value="Fără gluten">Fără gluten</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Timp maxim disponibil
                  </label>
                  <select
                    value={timeConstraint}
                    onChange={(e) => setTimeConstraint(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 outline-none focus:border-orange-500 transition"
                  >
                    <option value="oricat">Oricât (Standard)</option>
                    <option value="20 de minute">Rapid (&lt; 20 min)</option>
                    <option value="35 de minute">Mediu (&lt; 35 min)</option>
                    <option value="60 de minute">Sub o oră (&lt; 60 min)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span>Include cantități exacte, sfaturi de bucătar și fotografie gastronomică.</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
                  <span>ChefAI gătește...</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  <span>Generează Rețeta Magică</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Spinner Section */}
        <div id="generationArea">
          {isLoading && (
            <div className="text-center py-16 space-y-6 animate-in fade-in duration-300">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-orange-400 text-3xl">
                  <Flame className="w-8 h-8 animate-bounce text-orange-400" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-bold text-white transition-all duration-300">
                  {LOADING_MESSAGES[loadingStepIdx]}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Modelul Gemini generează structura culinară, cantitățile și pașii exacți.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recipe Display Section */}
        {currentRecipe && !isLoading && (
          <RecipeDisplay
            recipe={currentRecipe}
            isSaved={isCurrentRecipeSaved}
            onToggleSave={handleToggleSave}
            onRegenerate={handleGenerate}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ChefAI - Generator Inteligent de Rețete. Creat pentru gurmanzi.</p>
          <div className="flex items-center space-x-2">
            <span>Alimentat de Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>

      {/* Saved Recipes Modal */}
      <SavedRecipesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        recipes={savedRecipes}
        onSelectRecipe={(recipe) => setCurrentRecipe(recipe)}
        onDeleteRecipe={handleDeleteSaved}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-white'
                : toast.type === 'info'
                ? 'bg-slate-900/95 border-slate-700 text-slate-200'
                : 'bg-slate-900/95 border-orange-500/50 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
