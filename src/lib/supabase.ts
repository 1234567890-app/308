import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Category = 'fresh' | 'household' | 'long_term';
export type ItemStatus = 'in_stock' | 'to_buy' | 'bought_today';

export interface Item {
  id: string;
  household_id: string;
  name: string;
  category: Category;
  status: ItemStatus;
  note: string | null;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  bought_at: string | null;
}

export interface Household {
  id: string;
  name: string;
  pin: string;
  created_by: string | null;
  created_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  created_at: string;
}

export type RecipeCategory = 'fresh' | 'household' | 'long_term';
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'bakery';

export interface Recipe {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  default_servings: number;
  category: MealCategory;
  cook_time_minutes: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
  category: RecipeCategory;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
}

export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}
