import { useState } from 'react';
import { useRecipes } from '@/context/RecipeContext';
import type { RecipeWithDetails, MealCategory } from '@/lib/supabase';
import { RecipeDetail } from '@/components/RecipeDetail';
import { RecipeModal } from '@/components/RecipeModal';
import { SwipeableCard } from '@/components/SwipeableCard';
import { ChefHat, Plus, Clock, ChevronDown } from 'lucide-react';

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
  dessert: 'Десерт',
  bakery: 'Выпечка',
};

const FILTER_OPTIONS: { key: MealCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'breakfast', label: 'Завтрак' },
  { key: 'lunch', label: 'Обед' },
  { key: 'dinner', label: 'Ужин' },
  { key: 'snack', label: 'Перекус' },
  { key: 'dessert', label: 'Десерт' },
  { key: 'bakery', label: 'Выпечка' },
];

const LAST_RECIPE_KEY = 'domzapas_last_recipe_id';

export function RecipesTab() {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const [selected, setSelected] = useState<RecipeWithDetails | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RecipeWithDetails | null>(null);
  const [filter, setFilter] = useState<MealCategory | 'all'>('all');

  const lastRecipeId = typeof window !== 'undefined' ? localStorage.getItem(LAST_RECIPE_KEY) : null;

  const openRecipe = (r: RecipeWithDetails) => {
    localStorage.setItem(LAST_RECIPE_KEY, r.id);
    setSelected(r);
  };

  const filtered = filter === 'all' ? recipes : recipes.filter((r) => r.category === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.id === lastRecipeId) return -1;
    if (b.id === lastRecipeId) return 1;
    return 0;
  });

  if (selected) {
    return (
      <>
        <RecipeDetail
          recipe={selected}
          onBack={() => setSelected(null)}
          onEdit={(r) => setEditing(r)}
        />
        <RecipeModal
          open={!!editing}
          onClose={() => setEditing(null)}
          mode="edit"
          recipe={editing}
          onSubmit={async (data) => {
            if (!editing) return;
            await updateRecipe(editing.id, data);
            setSelected(null);
          }}
        />
      </>
    );
  }

  return (
    <div className="pb-28">
      {/* Title + filter dropdown */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <ChefHat className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-bold text-gray-900">Рецепты</h1>
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as MealCategory | 'all')}
            className="w-full appearance-none px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition pr-10"
          >
            {FILTER_OPTIONS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Recipe list */}
      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-emerald-300" />
            </div>
            <p className="text-gray-400 font-medium">
              {filter === 'all' ? 'Рецептов пока нет' : 'Нет рецептов в этой категории'}
            </p>
            <p className="text-sm text-gray-300 mt-1">Создайте первый рецепт кнопкой ниже</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((recipe) => {
              const isLast = recipe.id === lastRecipeId;
              return (
                <SwipeableCard
                  key={recipe.id}
                  resetKey={filter}
                  onEdit={() => setEditing(recipe)}
                  onDelete={() => {
                    if (confirm(`Удалить рецепт «${recipe.title}»?`)) deleteRecipe(recipe.id);
                  }}
                >
                  <div
                    className={`bg-white border p-4 flex items-center gap-3 animate-[fadeIn_0.25s_ease] ${
                      isLast ? 'border-emerald-200' : 'border-gray-100'
                    }`}
                  >
                    {/* Left: chef icon square */}
                    <button
                      onClick={() => openRecipe(recipe)}
                      className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 active:scale-95 transition"
                      aria-label="Открыть рецепт"
                    >
                      <ChefHat className="w-5 h-5 text-emerald-500" />
                    </button>

                    {/* Middle: title + meta */}
                    <button
                      onClick={() => openRecipe(recipe)}
                      className="flex-1 min-w-0 text-left active:scale-[0.99] transition"
                    >
                      <p className="font-semibold text-gray-900 text-sm truncate">{recipe.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{MEAL_LABELS[recipe.category]}</span>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {recipe.cook_time_minutes ? `${recipe.cook_time_minutes} мин` : '—'}
                        </span>
                      </div>
                    </button>
                  </div>
                </SwipeableCard>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-300 hover:bg-emerald-600 active:scale-95 transition flex items-center justify-center z-20"
        aria-label="Добавить рецепт"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <RecipeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        mode="add"
        onSubmit={async (data) => { await addRecipe(data); }}
      />

      <RecipeModal
        open={!!editing}
        onClose={() => setEditing(null)}
        mode="edit"
        recipe={editing}
        onSubmit={async (data) => {
          if (!editing) return;
          await updateRecipe(editing.id, data);
        }}
      />
    </div>
  );
}
