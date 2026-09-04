import { useMemo, useState } from 'react';
import type { RecipeWithDetails, MealCategory, RecipeCategory } from '@/lib/supabase';
import { useHousehold } from '@/context/HouseholdContext';
import { getItemIcon, getItemIconColor } from '@/lib/icons';
import { autoPickIcon } from '@/lib/icons';
import {
  ArrowLeft, Clock, Minus, Plus, Check, ChefHat, ShoppingCart,
  Plus as PlusIcon, CheckCircle2, Circle, Pencil, ListOrdered,
} from 'lucide-react';

type Mode = 'cooking' | 'shopping';

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
  dessert: 'Десерт',
  bakery: 'Выпечка',
};

export interface RecipeDetailProps {
  recipe: RecipeWithDetails;
  onBack: () => void;
  onEdit: (recipe: RecipeWithDetails) => void;
}

export function RecipeDetail({ recipe, onBack, onEdit }: RecipeDetailProps) {
  const { items, addItem } = useHousehold();
  const [mode, setMode] = useState<Mode>('cooking');
  const [servings, setServings] = useState(recipe.default_servings);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const ratio = servings / recipe.default_servings;

  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ing) => ({
        ...ing,
        scaledAmount: Math.round(ing.amount * ratio * 10) / 10,
      })),
    [recipe.ingredients, ratio],
  );

  // Normalize names for robust matching: lowercase, collapse whitespace, trim
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

  const inStockNames = useMemo(
    () =>
      new Set(
        items
          .filter((i) => i.status === 'in_stock' || i.status === 'bought_today')
          .map((i) => normalize(i.name)),
      ),
    [items],
  );

  const inShoppingListNames = useMemo(
    () =>
      new Set(
        items
          .filter((i) => i.status === 'to_buy')
          .map((i) => normalize(i.name)),
      ),
    [items],
  );

  const missingIngredients = useMemo(
    () =>
      scaledIngredients.filter(
        (ing) => {
          const key = normalize(ing.name);
          return !inStockNames.has(key) && !inShoppingListNames.has(key);
        },
      ),
    [scaledIngredients, inStockNames, inShoppingListNames],
  );

  const toggleStep = (idx: number) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addOneToShopping = async (name: string, category: RecipeCategory) => {
    const key = normalize(name);
    if (inStockNames.has(key) || inShoppingListNames.has(key)) return;
    try {
      await addItem({
        name,
        category,
        status: 'to_buy',
        note: `Для рецепта: ${recipe.title}`,
        icon: autoPickIcon(name),
      });
    } catch (err) {
      console.error('addOneToShopping error:', err);
    }
  };

  const addAllMissing = async () => {
    if (missingIngredients.length === 0) return;
    setAddingAll(true);
    try {
      for (const ing of missingIngredients) {
        const key = normalize(ing.name);
        if (inStockNames.has(key) || inShoppingListNames.has(key)) continue;
        await addItem({
          name: ing.name,
          category: ing.category,
          status: 'to_buy',
          note: `Для рецепта: ${recipe.title}`,
          icon: autoPickIcon(ing.name),
      });
      }
    } catch (err) {
      console.error('addAllMissing error:', err);
    } finally {
      setAddingAll(false);
    }
  };

  const allStepsDone = doneSteps.size === recipe.steps.length && recipe.steps.length > 0;

  return (
    <div className="pb-32 animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white shadow-sm text-gray-700 flex items-center justify-center active:scale-90 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-base truncate flex-1">{recipe.title}</h1>
        <button
          onClick={() => onEdit(recipe)}
          className="w-9 h-9 rounded-xl bg-white shadow-sm text-gray-400 hover:text-gray-600 flex items-center justify-center active:scale-90 transition"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Recipe hero */}
      <div className="px-4 pt-2">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{recipe.title}</h2>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 shrink-0">
              {MEAL_LABELS[recipe.category]}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="w-4 h-4 text-gray-400" />
              {recipe.cook_time_minutes ? `${recipe.cook_time_minutes} мин` : '—'}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <ListOrdered className="w-4 h-4 text-gray-400" />
              {recipe.ingredients.length} ингр.
            </div>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="px-4 pt-4">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setMode('cooking')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              mode === 'cooking' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Готовка
          </button>
          <button
            onClick={() => setMode('shopping')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              mode === 'shopping' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Покупки
          </button>
        </div>
      </div>

      {/* Servings selector */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Количество порций</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === 'shopping' ? 'Ингредиенты пересчитаны' : 'Ингредиенты масштабируются'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center active:scale-90 hover:bg-gray-200 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-bold text-gray-900 w-8 text-center">{servings}</span>
            <button
              onClick={() => setServings((s) => s + 1)}
              className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-90 hover:bg-emerald-600 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode content */}
      {mode === 'cooking' ? (
        <div className="px-4 pt-4 space-y-4">
          {/* Ingredients list (read-only) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Ингредиенты
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {scaledIngredients.map((ing) => {
                const Icon = getItemIcon({ category: ing.category, icon: null });
                const { color, bg } = getItemIconColor({ category: ing.category, icon: null });
                return (
                  <div key={ing.id} className="flex items-center gap-3 p-3.5">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{ing.name}</span>
                    <span className="text-sm font-medium text-gray-500">
                      {ing.scaledAmount} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Steps with checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Шаги</h3>
              {allStepsDone && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Готово!
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => {
                const done = doneSteps.has(idx);
                return (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                      done
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold ${done ? 'text-emerald-400' : 'text-gray-400'}`}>
                        Шаг {idx + 1}
                      </span>
                      <p className={`text-base leading-relaxed mt-1 ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {step.instruction}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {/* Add all missing */}
          {missingIngredients.length > 0 && (
            <button
              onClick={addAllMissing}
              disabled={addingAll}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {addingAll ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Добавляем...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Добавить все недостающие ({missingIngredients.length})
                </>
              )}
            </button>
          )}

          {/* Ingredients with status badges */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Ингредиенты
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {scaledIngredients.map((ing) => {
                const Icon = getItemIcon({ category: ing.category, icon: null });
                const { color, bg } = getItemIconColor({ category: ing.category, icon: null });
                const key = normalize(ing.name);
                const inStock = inStockNames.has(key);
                const inShoppingList = inShoppingListNames.has(key);
                const muted = inStock || inShoppingList;
                return (
                  <div key={ing.id} className="flex items-center gap-3 p-3.5">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0 ${muted ? 'opacity-50' : ''}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{ing.name}</p>
                      <p className={`text-xs ${muted ? 'text-gray-300' : 'text-gray-400'}`}>{ing.scaledAmount} {ing.unit}</p>
                    </div>
                    {inStock ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-500">
                        ✓ Дома
                      </span>
                    ) : inShoppingList ? (
                      <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> В списке
                      </span>
                    ) : (
                      <button
                        onClick={() => addOneToShopping(ing.name, ing.category)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" /> В список
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
