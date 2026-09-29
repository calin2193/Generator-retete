import { GoogleGenAI, Type } from '@google/genai';

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nu este setată în variabilele de mediu Netlify.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getCuratedFoodImage(title: string, category?: string): string {
  const lower = (title + ' ' + (category || '')).toLowerCase();

  if (lower.includes('ciorb') || lower.includes('sup') || lower.includes('bors') || lower.includes('ramen')) {
    if (lower.includes('burt')) {
      return 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=1200&q=80';
    }
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('omlet') || lower.includes('oua') || lower.includes('ouă') || lower.includes('ochiuri') || lower.includes('mic dejun')) {
    return 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('past') || lower.includes('spaghe') || lower.includes('carbonara') || lower.includes('penne') || lower.includes('lasagn')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('pui') || lower.includes('chicken') || lower.includes('ostropel') || lower.includes('snitel') || lower.includes('șnițel')) {
    return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('sarmal') || lower.includes('varza') || lower.includes('mamalig') || lower.includes('mămălig')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('friptur') || lower.includes('porc') || lower.includes('vita') || lower.includes('vită') || lower.includes('steak') || lower.includes('gratar') || lower.includes('grătar')) {
    return 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('somon') || lower.includes('peste') || lower.includes('pește') || lower.includes('pastrav') || lower.includes('fish') || lower.includes('seafood')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('papanas') || lower.includes('tiramisu') || lower.includes('desert') || lower.includes('tort') || lower.includes('prajitur') || lower.includes('clatit')) {
    return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('pizza') || lower.includes('focaccia')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('salat') || lower.includes('caesar') || lower.includes('vinete')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('orez') || lower.includes('risotto') || lower.includes('pilaf')) {
    return 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
}

export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path || '';

  try {
    if (path.endsWith('/status')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'ok',
          hasKey: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
          platform: 'netlify',
        }),
      };
    }

    if (path.endsWith('/generate-recipe') && event.httpMethod === 'POST') {
      const data = event.body ? JSON.parse(event.body) : {};
      const { mode, dishName, ingredients, dietary, timeConstraint } = data;

      let userPrompt = '';
      if (mode === 'dish') {
        if (!dishName?.trim()) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Numele preparatului este obligatoriu!' }) };
        }
        userPrompt = `Generează o rețetă completă și detaliată pentru preparatul: "${dishName.trim()}".`;
      } else {
        if (!ingredients?.trim()) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Introdu cel puțin un ingredient din frigider!' }) };
        }
        userPrompt = `Creează o rețetă delicioasă și practică folosind ingredientele din frigider: "${ingredients.trim()}". Poți adăuga ingrediente de bază din cămară (sare, piper, ulei, făină, apă, condimente de bază).`;
      }

      if (dietary && dietary !== 'oricare') {
        userPrompt += ` Rețeta trebuie să respecte preferința: ${dietary}.`;
      }
      if (timeConstraint && timeConstraint !== 'oricat') {
        userPrompt += ` Timpul total de pregătire și gătire trebuie să fie de maximum ${timeConstraint}.`;
      }

      const ai = getGenAIClient();
      const modelCandidates = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let text = '';
      let lastError: any = null;

      for (const model of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: `Ești ChefAI, un Bucătar Șef de renume, expert în gastronomie românească și internațională.
Returnează STRICT un obiect JSON valid conform schemei furnizate, în limba română.
Fiecare pas de preparare trebuie să fie clar, explicativ și ușor de urmat.
La ingrediente, specifică întotdeauna cantitatea exactă și unitatea de măsură.
La nutrition, estimează cu atenție valorile nutriționale per porție: calorii, proteine, carbohidrați, grăsimi și fibre.
La chefTips adaugă 2-3 secrete practice de bucătar șef.
La winePairing adaugă o recomandare de vin românesc sau băutură potrivită.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prepTime: { type: Type.STRING },
                  cookTime: { type: Type.STRING },
                  totalTime: { type: Type.STRING },
                  servings: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  category: { type: Type.STRING },
                  nutrition: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.STRING },
                      protein: { type: Type.STRING },
                      carbs: { type: Type.STRING },
                      fat: { type: Type.STRING },
                      fiber: { type: Type.STRING },
                    },
                    required: ['calories', 'protein', 'carbs', 'fat'],
                  },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  chefTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  winePairing: { type: Type.STRING },
                },
                required: ['title', 'description', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients', 'steps'],
              },
            },
          });
          text = response.text || '';
          if (text) break;
        } catch (mErr) {
          lastError = mErr;
        }
      }

      if (!text) {
        throw lastError || new Error('Nu s-a putut genera rețeta.');
      }
      return {
        statusCode: 200,
        headers,
        body: text || '{}',
      };
    }

    if (path.endsWith('/generate-image') && event.httpMethod === 'POST') {
      const data = event.body ? JSON.parse(event.body) : {};
      const { title, category } = data;

      let imageUrl: string | null = null;
      try {
        const ai = getGenAIClient();
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{
              text: `Professional food photography of ${title}, mouth-watering culinary presentation, beautifully plated on an elegant ceramic dish, warm lighting, appetizing delicious food shot`
            }]
          },
          config: {
            imageConfig: { aspectRatio: '16:9' }
          }
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (err: any) {
        // Silently fallback if quota or free-tier limitation applies
      }

      if (!imageUrl) {
        imageUrl = getCuratedFoodImage(title || 'Preparat culinar', category);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ imageUrl }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint inexistent' }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Eroare internă de server.' }),
    };
  }
};
