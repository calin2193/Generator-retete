export interface NutritionInfo {
  calories: string; // ex: "420 kcal"
  protein: string;  // ex: "28g"
  carbs: string;    // ex: "35g"
  fat: string;      // ex: "16g"
  fiber?: string;   // ex: "4g"
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime?: string;
  servings: string;
  difficulty: string;
  calories?: string;
  nutrition?: NutritionInfo;
  category?: string;
  ingredients: string[];
  steps: string[];
  chefTips?: string[];
  winePairing?: string;
  image?: string;
  createdAt: string;
}

export type GeneratorMode = 'dish' | 'fridge';
