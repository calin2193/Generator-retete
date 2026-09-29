import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get Gemini client
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nu este setată în variabilele de mediu.');
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

// Status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
  });
});

// Generate recipe endpoint
app.post('/api/generate-recipe', async (req: Request, res: Response) => {
  try {
    const { mode, dishName, ingredients, dietary, timeConstraint } = req.body;

    let userPrompt = '';
    if (mode === 'dish') {
      if (!dishName || typeof dishName !== 'string' || !dishName.trim()) {
        return res.status(400).json({ error: 'Te rugăm să introduci numele unui preparat!' });
      }
      userPrompt = `Generează o rețetă completă și detaliată pentru preparatul: "${dishName.trim()}".`;
    } else {
      if (!ingredients || typeof ingredients !== 'string' || !ingredients.trim()) {
        return res.status(400).json({ error: 'Te rugăm să introduci cel puțin un ingredient din frigider!' });
      }
      userPrompt = `Creează o rețetă delicioasă și practică folosind ingredientele pe care le am în frigider: "${ingredients.trim()}". Poți include ingrediente de bază din cămară (ulei, sare, piper, făină, apă, condimente uzuale).`;
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
            systemInstruction: `Ești ChefAI, un Bucătar Șef de renume internațional, pasionat de arta culinară românească și internațională.
Returnează STRICT un obiect JSON valid conform schemei furnizate, în limba română.
Fiecare pas de preparare trebuie să fie clar, explicativ și ușor de urmat de oricine.
La ingrediente, include obligatoriu cantitățile exacte și unitățile de măsură (ex: "500g piept de pui", "2 căței de usturoi zdrobiți", "200ml smântână 30%").
La nutrition, estimează cu atenție valorile nutriționale per porție: calorii (ex: "450 kcal"), proteine (ex: "32g"), carbohidrați (ex: "40g"), grăsimi (ex: "18g") și fibre (ex: "5g").
La chefTips adaugă 2-3 secrete sau trucuri profesionale de bucătar pentru savoare maximă.
La winePairing adaugă o recomandare de vin românesc sau băutură care completează perfect gustul mâncării.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Numele atractiv al preparatului' },
                description: { type: Type.STRING, description: 'O descriere scurtă și apetisantă' },
                prepTime: { type: Type.STRING, description: 'Timp de preparare (ex: 15 min)' },
                cookTime: { type: Type.STRING, description: 'Timp de gătire (ex: 30 min)' },
                totalTime: { type: Type.STRING, description: 'Timp total (ex: 45 min)' },
                servings: { type: Type.STRING, description: 'Număr de porții (ex: 4 persoane)' },
                difficulty: { type: Type.STRING, description: 'Nivel dificultate: Ușor, Mediu sau Avansat' },
                calories: { type: Type.STRING, description: 'Calorii estimate per porție (ex: 420 kcal)' },
                category: { type: Type.STRING, description: 'Categorie (ex: Fel Principal, Ciorbă, Desert, Mic Dejun)' },
                nutrition: {
                  type: Type.OBJECT,
                  description: 'Estimare nutrițională completă per porție',
                  properties: {
                    calories: { type: Type.STRING, description: 'Calorii per porție (ex: 450 kcal)' },
                    protein: { type: Type.STRING, description: 'Proteine per porție (ex: 32g)' },
                    carbs: { type: Type.STRING, description: 'Carbohidrați per porție (ex: 40g)' },
                    fat: { type: Type.STRING, description: 'Grăsimi per porție (ex: 18g)' },
                    fiber: { type: Type.STRING, description: 'Fibre per porție (ex: 5g)' },
                  },
                  required: ['calories', 'protein', 'carbs', 'fat']
                },
                ingredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Lista ingredientelor cu gramaje/cantități clare'
                },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Pașii succesivi de gătire'
                },
                chefTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Trucuri și secrete de bucătar'
                },
                winePairing: {
                  type: Type.STRING,
                  description: 'Recomandare de vin sau băutură asociată'
                }
              },
              required: ['title', 'description', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients', 'steps']
            }
          }
        });

        text = response.text || '';
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, attempting next model:`, err?.message || err);
      }
    }

    if (!text) {
      throw lastError || new Error('Nu s-a putut genera rețeta. Răspunsul este gol.');
    }

    const recipeData = JSON.parse(text);
    return res.json(recipeData);
  } catch (err: any) {
    console.error('Error generating recipe:', err);
    return res.status(500).json({
      error: err.message || 'Eroare la generarea rețetei. Te rugăm să verifici cheia Gemini API.'
    });
  }
});

// In-memory cooldown if Gemini image quota is 0 (Free Tier does not support image generation models)
let aiImageQuotaExhaustedUntil = 0;

function getCuratedFoodImage(title: string, category?: string): string {
  const lower = (title + ' ' + (category || '')).toLowerCase();

  // Soups and broths
  if (lower.includes('ciorb') || lower.includes('sup') || lower.includes('bors') || lower.includes('ramen')) {
    if (lower.includes('burt')) {
      return 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=1200&q=80';
    }
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80';
  }

  // Breakfast, eggs, omelette
  if (lower.includes('omlet') || lower.includes('oua') || lower.includes('ouă') || lower.includes('ochiuri') || lower.includes('mic dejun') || lower.includes('shakshuka')) {
    return 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=1200&q=80';
  }

  // Pasta
  if (lower.includes('past') || lower.includes('spaghe') || lower.includes('carbonara') || lower.includes('penne') || lower.includes('lasagn') || lower.includes('tagliatelle') || lower.includes('fettuccine')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=1200&q=80';
  }

  // Chicken dishes
  if (lower.includes('pui') || lower.includes('chicken') || lower.includes('ostropel') || lower.includes('snitel') || lower.includes('șnițel') || lower.includes('aripioare')) {
    return 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80';
  }

  // Traditional Romanian dishes & pork / beef
  if (lower.includes('sarmal') || lower.includes('varza') || lower.includes('mamalig') || lower.includes('mămălig')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80';
  }
  if (lower.includes('friptur') || lower.includes('porc') || lower.includes('vita') || lower.includes('vită') || lower.includes('steak') || lower.includes('gratar') || lower.includes('grătar') || lower.includes('mici')) {
    return 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80';
  }

  // Fish & Seafood
  if (lower.includes('somon') || lower.includes('peste') || lower.includes('pește') || lower.includes('pastrav') || lower.includes('crevet') || lower.includes('fish') || lower.includes('seafood')) {
    return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80';
  }

  // Desserts
  if (lower.includes('papanas') || lower.includes('papanaș') || lower.includes('tiramisu') || lower.includes('desert') || lower.includes('tort') || lower.includes('prajitur') || lower.includes('prăjitur') || lower.includes('clatit') || lower.includes('clătit') || lower.includes('placint') || lower.includes('plăcint') || lower.includes('cheesecake') || lower.includes('cozonac')) {
    return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80';
  }

  // Pizza & Italian
  if (lower.includes('pizza') || lower.includes('focaccia')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
  }

  // Burgers & Sandwiches
  if (lower.includes('burger') || lower.includes('sandwich') || lower.includes('sandvis') || lower.includes('sandviș')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80';
  }

  // Salads & Fresh Vegetables
  if (lower.includes('salat') || lower.includes('caesar') || lower.includes('vinete') || lower.includes('zacusca') || lower.includes('zacuscă')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80';
  }

  // Rice & Risotto
  if (lower.includes('orez') || lower.includes('risotto') || lower.includes('pilaf')) {
    return 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1200&q=80';
  }

  // Default high-end culinary presentation
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
}

// Generate image endpoint
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { title, category } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Titlul este obligatoriu' });
    }

    let imageUrl: string | null = null;

    // Only attempt AI image generation if cooldown hasn't been triggered by a quota error
    if (Date.now() >= aiImageQuotaExhaustedUntil) {
      try {
        const ai = getGenAIClient();
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{
              text: `High-end professional restaurant food photography of ${title}, mouth-watering culinary presentation, beautifully plated on an elegant ceramic dish, rustic dining table background, soft warm studio lighting, 8k resolution, shallow depth of field, appetizing delicious dish`
            }]
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9'
            }
          }
        });

        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imageErr: any) {
        // Check for 429 quota exhaustion or model unavailability (e.g. Free Tier limit: 0)
        const errMsg = String(imageErr?.message || imageErr || '');
        if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          // Disable AI image calls for 12 hours so it immediately serves high-res culinary photography
          aiImageQuotaExhaustedUntil = Date.now() + 12 * 60 * 60 * 1000;
        }
      }
    }

    // Always fallback to curated high-quality culinary image if AI image wasn't generated
    if (!imageUrl) {
      imageUrl = getCuratedFoodImage(title, category);
    }

    return res.json({ imageUrl });
  } catch (err: any) {
    // Failsafe: return default curated image instead of failing with 500
    const fallback = getCuratedFoodImage(req.body?.title || 'Preparat culinar', req.body?.category);
    return res.json({ imageUrl: fallback });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChefAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
