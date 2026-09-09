import { useEffect, useState } from 'react';
import type { Category, Item, ItemStatus } from '@/lib/supabase';
import { ICON_CHOICES, ICON_MAP, autoPickIcon, CATEGORY_DEFAULT_ICON, CATEGORY_META } from '@/lib/icons';
import { Loader2, Pencil, Plus, Target, MapPin, Check, ChevronDown, Package } from 'lucide-react';

export interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  category: Category;
  status: ItemStatus;
  /** When editing, the item being edited */
  item?: Item | null;
  onSubmit: (
    data: { name: string; category: Category; note: string | null; icon: string | null },
  ) => Promise<void>;
  /** Title override for long-term add mode */
  title?: string;
  subtitle?: string;
  accentColor?: 'emerald' | 'amber' | 'blue';
}

const ACCENT = {
  emerald: { ring: 'focus:ring-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-600', shadow: 'shadow-emerald-200' },
  amber: { ring: 'focus:ring-amber-400', btn: 'bg-amber-500 hover:bg-amber-600', shadow: 'shadow-amber-200' },
  blue: { ring: 'focus:ring-blue-400', btn: 'bg-blue-500 hover:bg-blue-600', shadow: 'shadow-blue-200' },
};

const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: 'fresh', label: 'Кухня' },
  { key: 'household', label: 'Бытовая химия' },
  { key: 'long_term', label: 'Долгосрочные' },
];

export function ItemModal({
  open,
  onClose,
  mode,
  category: initialCategory,
  status,
  item,
  onSubmit,
  title,
  subtitle,
  accentColor = 'emerald',
}: ItemModalProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [busy, setBusy] = useState(false);
  const [manualIcon, setManualIcon] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && item) {
      setName(item.name);
      setNote(item.note ?? '');
      setIcon(item.icon ?? null);
      setCategory(item.category);
      setManualIcon(true);
      setShowIconPicker(false);
    } else {
      setName('');
      setNote('');
      setIcon(null);
      setCategory(initialCategory);
      setManualIcon(false);
      setShowIconPicker(false);
    }
  }, [open, mode, item, initialCategory]);

  // Auto-pick icon as user types (only if they haven't manually chosen one)
  useEffect(() => {
    if (mode === 'edit' || manualIcon || !name.trim()) return;
    const picked = autoPickIcon(name);
    setIcon(picked);
  }, [name, mode, manualIcon]);

  if (!open) return null;

  const accent = ACCENT[accentColor];
  const effectiveIcon = icon ?? CATEGORY_DEFAULT_ICON[category];
  const PreviewIcon = ICON_MAP[effectiveIcon] ?? ICON_MAP.Package;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        note: note.trim() || null,
        icon: icon ?? null,
      });
      onClose();
    } catch (err) {
      console.error('ItemModal submit error:', err);
    } finally {
      setBusy(false);
    }
  };

  const defaultTitle = mode === 'edit' ? 'Редактировать товар' : 'Добавить в дом';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          {mode === 'edit' ? (
            <Pencil className="w-5 h-5 text-gray-700" />
          ) : accentColor === 'amber' ? (
            <Target className="w-5 h-5 text-amber-500" />
          ) : (
            <Plus className="w-5 h-5 text-emerald-500" />
          )}
          <h3 className="text-lg font-bold text-gray-900">{title ?? defaultTitle}</h3>
        </div>
        {subtitle ? <p className="text-sm text-gray-400 mb-4">{subtitle}</p> : <div className="mb-3" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name with live icon preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Название</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <PreviewIcon className="w-5 h-5 text-gray-600" />
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название товара"
                className={`w-full pl-16 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${accent.ring} transition`}
              />
            </div>
          </div>

          {/* Category dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Категория</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 ${accent.ring} transition pr-10"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Note / Where to buy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Примечание / Где купить
              </span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например, Carrefour"
              className={`w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${accent.ring} transition`}
            />
          </div>

          {/* Collapsed icon picker */}
          <div>
            <button
              type="button"
              onClick={() => setShowIconPicker((s) => !s)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <PreviewIcon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium flex-1 text-left">Изменить иконку</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`}
              />
            </button>
            {showIconPicker && (
              <div className="grid grid-cols-6 gap-2 mt-3">
                {ICON_CHOICES.map((choice) => {
                  const Icon = ICON_MAP[choice.name];
                  const selected = effectiveIcon === choice.name;
                  return (
                    <button
                      key={choice.name}
                      type="button"
                      onClick={() => {
                        setIcon(choice.name);
                        setManualIcon(true);
                      }}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                        selected
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                      }`}
                      title={choice.label}
                      aria-label={choice.label}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className={`flex-1 py-3.5 rounded-2xl ${accent.btn} text-white font-semibold active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md ${accent.shadow}`}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'edit' ? <Check className="w-5 h-5" /> : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
