import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, type Recipe, type RecipeIngredient, type RecipeStep, type RecipeWithDetails, type RecipeCategory, type MealCategory } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useHousehold } from '@/context/HouseholdContext';

export interface RecipeInput {
  title: string;
  default_servings: number;
  category: MealCategory;
  cook_time_minutes: number | null;
  ingredients: { name: string; amount: number; unit: string; category: RecipeCategory }[];
  steps: { instruction: string }[];
}

interface RecipeContextValue {
  recipes: RecipeWithDetails[];
  loading: boolean;
  error: string | null;
  addRecipe: (input: RecipeInput) => Promise<void>;
  updateRecipe: (id: string, input: RecipeInput) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = useCallback(async (householdId: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('recipes')
        .select('*, ingredients:recipe_ingredients(*), steps:recipe_steps(*)')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setRecipes((data ?? []) as RecipeWithDetails[]);
    } catch (err) {
      console.error('loadRecipes error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!household) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    loadRecipes(household.id);
  }, [household, loadRecipes]);

  // Realtime
  useEffect(() => {
    if (!household) return;
    const channel = supabase
      .channel(`recipes:${household.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipes', filter: `household_id=eq.${household.id}` },
        () => {
          loadRecipes(household.id);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipe_ingredients' },
        () => {
          loadRecipes(household.id);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipe_steps' },
        () => {
          loadRecipes(household.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household, loadRecipes]);

  const addRecipe = useCallback(
    async (input: RecipeInput) => {
      if (!household || !user) return;
      try {
        const { data: recipe, error: rErr } = await supabase
          .from('recipes')
          .insert({
            household_id: household.id,
            title: input.title,
            default_servings: input.default_servings,
            category: input.category,
            cook_time_minutes: input.cook_time_minutes,
            created_by: user.id,
          })
          .select('*')
          .single();
        if (rErr) throw rErr;
        const recipeId = (recipe as Recipe).id;

        if (input.ingredients.length > 0) {
          const { error: iErr } = await supabase.from('recipe_ingredients').insert(
            input.ingredients.map((ing) => ({
              recipe_id: recipeId,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              category: ing.category,
            })),
          );
          if (iErr) throw iErr;
        }

        if (input.steps.length > 0) {
          const { error: sErr } = await supabase.from('recipe_steps').insert(
            input.steps.map((s, idx) => ({
              recipe_id: recipeId,
              step_number: idx + 1,
              instruction: s.instruction,
            })),
          );
          if (sErr) throw sErr;
        }

        await loadRecipes(household.id);
      } catch (err) {
        console.error('addRecipe error (RLS may be blocking):', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [household, user, loadRecipes],
  );

  const updateRecipe = useCallback(
    async (id: string, input: RecipeInput) => {
      if (!household) return;
      try {
        const { error: rErr } = await supabase
          .from('recipes')
          .update({
            title: input.title,
            default_servings: input.default_servings,
            category: input.category,
            cook_time_minutes: input.cook_time_minutes,
          })
          .eq('id', id);
        if (rErr) throw rErr;

        // Replace ingredients
        const { error: diErr } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
        if (diErr) throw diErr;
        if (input.ingredients.length > 0) {
          const { error: iErr } = await supabase.from('recipe_ingredients').insert(
            input.ingredients.map((ing) => ({
              recipe_id: id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              category: ing.category,
            })),
          );
          if (iErr) throw iErr;
        }

        // Replace steps
        const { error: dsErr } = await supabase.from('recipe_steps').delete().eq('recipe_id', id);
        if (dsErr) throw dsErr;
        if (input.steps.length > 0) {
          const { error: sErr } = await supabase.from('recipe_steps').insert(
            input.steps.map((s, idx) => ({
              recipe_id: id,
              step_number: idx + 1,
              instruction: s.instruction,
            })),
          );
          if (sErr) throw sErr;
        }

        await loadRecipes(household.id);
      } catch (err) {
        console.error('updateRecipe error (RLS may be blocking):', err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [household, loadRecipes],
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if (error) throw error;
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error('deleteRecipe error (RLS may be blocking):', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [],
  );

  const value = useMemo<RecipeContextValue>(
    () => ({ recipes, loading, error, addRecipe, updateRecipe, deleteRecipe }),
    [recipes, loading, error, addRecipe, updateRecipe, deleteRecipe],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
