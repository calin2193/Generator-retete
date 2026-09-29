import { Recipe, GeneratorMode } from '../types.ts';

export interface GenerateRecipeParams {
  mode: GeneratorMode;
  dishName?: string;
  ingredients?: string;
  dietary?: string;
  timeConstraint?: string;
}

export async function checkServerStatus(): Promise<{ hasKey: boolean; platform?: string }> {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Status check failed:', err);
  }
  return { hasKey: false };
}

export async function generateRecipe(params: GenerateRecipeParams): Promise<Recipe> {
  const res = await fetch('/api/generate-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Eroare server (${res.status}). Verifică cheia GEMINI_API_KEY.`);
  }

  const recipeData = await res.json();

  // Try generating or fetching image
  let image = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
  try {
    const imgRes = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: recipeData.title, category: recipeData.category }),
    });
    if (imgRes.ok) {
      const imgData = await imgRes.json();
      if (imgData.imageUrl) {
        image = imgData.imageUrl;
      }
    }
  } catch (imgErr) {
    console.warn('Image generation endpoint failed, using default culinary image', imgErr);
  }

  return {
    ...recipeData,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    image,
    createdAt: new Date().toISOString(),
  };
}
