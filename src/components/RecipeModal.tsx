import { useEffect, useState } from 'react';
import type { RecipeCategory, MealCategory, RecipeWithDetails } from '@/lib/supabase';
import { Loader2, Plus, X, Trash2, Pencil, ChefHat } from 'lucide-react';

export interface RecipeModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  recipe?: RecipeWithDetails | null;
  onSubmit: (data: {
    title: string;
    default_servings: number;
    category: MealCategory;
    cook_time_minutes: number | null;
    ingredients: { name: string; amount: number; unit: string; category: RecipeCategory }[];
    steps: { instruction: string }[];
  }) => Promise<void>;
}

const MEAL_CATEGORIES: { key: MealCategory; label: string }[] = [
  { key: 'breakfast', label: 'Завтрак' },
  { key: 'lunch', label: 'Обед' },
  { key: 'dinner', label: 'Ужин' },
  { key: 'snack', label: 'Перекус' },
  { key: 'dessert', label: 'Десерт' },
  { key: 'bakery', label: 'Выпечка' },
];

const UNITS = ['г', 'мл', 'шт', 'ч.л.', 'ст.л.', 'стакан', 'по вкусу'];

export function RecipeModal({ open, onClose, mode, recipe, onSubmit }: RecipeModalProps) {
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState(2);
  const [category, setCategory] = useState<MealCategory>('breakfast');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState<{ name: string; amount: number; unit: string; category: RecipeCategory }[]>([
    { name: '', amount: 100, unit: 'г', category: 'fresh' },
  ]);
  const [steps, setSteps] = useState<{ instruction: string }[]>([{ instruction: '' }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && recipe) {
      setTitle(recipe.title);
      setServings(recipe.default_servings);
      setCategory(recipe.category);
      setCookTime(recipe.cook_time_minutes ?? '');
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit, category: i.category }))
          : [{ name: '', amount: 100, unit: 'г', category: 'fresh' }],
      );
      setSteps(
        recipe.steps.length > 0
          ? recipe.steps.map((s) => ({ instruction: s.instruction }))
          : [{ instruction: '' }],
      );
    } else {
      setTitle('');
      setServings(2);
      setCategory('breakfast');
      setCookTime('');
      setIngredients([{ name: '', amount: 100, unit: 'г', category: 'fresh' }]);
      setSteps([{ instruction: '' }]);
    }
  }, [open, mode, recipe]);

  if (!open) return null;

  const updateIngredient = (idx: number, field: string, value: string | number) => {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)));
  };
  const addIngredient = () =>
    setIngredients((prev) => [...prev, { name: '', amount: 100, unit: 'г', category: 'fresh' }]);
  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));

  const updateStep = (idx: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { instruction: value } : s)));
  };
  const addStep = () => setSteps((prev) => [...prev, { instruction: '' }]);
  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanSteps = steps.filter((s) => s.instruction.trim());
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        default_servings: servings,
        category,
        cook_time_minutes: cookTime === '' ? null : Number(cookTime),
        ingredients: cleanIngredients,
        steps: cleanSteps,
      });
      onClose();
    } catch (err) {
      console.error('RecipeModal submit error:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-xl animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white pt-1">
          {mode === 'edit' ? <Pencil className="w-5 h-5 text-gray-700" /> : <ChefHat className="w-5 h-5 text-emerald-500" />}
          <h3 className="text-lg font-bold text-gray-900">{mode === 'edit' ? 'Редактировать рецепт' : 'Новый рецепт'}</h3>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Паста Карбонара"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>

          {/* Servings + cook time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Порций</label>
              <input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Время (мин)</label>
              <input
                type="number"
                min={1}
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="30"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Приём пищи</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    category === c.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ингредиенты</label>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="Название"
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                    className="w-16 px-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-20 px-1 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="w-8 h-8 rounded-lg text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-2 flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              Добавить ингредиент
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Шаги приготовления</label>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                    {idx + 1}
                  </span>
                  <textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    placeholder={`Шаг ${idx + 1}`}
                    rows={2}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="w-8 h-8 rounded-lg text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition flex items-center justify-center shrink-0 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-2 flex items-center gap-1 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              Добавить шаг
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-1 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
