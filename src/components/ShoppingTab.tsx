import { useState } from 'react';
import { useHousehold } from '@/context/HouseholdContext';
import type { Category, Item } from '@/lib/supabase';
import { CATEGORY_META, getItemIcon, getItemIconColor } from '@/lib/icons';
import { ItemModal } from '@/components/ItemModal';
import { SwipeableCard } from '@/components/SwipeableCard';
import { Plus, Check, ShoppingCart, MapPin } from 'lucide-react';

type Filter = 'all' | 'fresh' | 'household' | 'long_term';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'fresh', label: 'Продукты' },
  { key: 'household', label: 'Химия' },
  { key: 'long_term', label: 'Долгосрочные' },
];

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function ShoppingTab() {
  const { items, addItem, updateItemStatus, deleteItem, updateItem } = useHousehold();
  // Default to 'fresh' (Продукты) per design spec
  const [filter, setFilter] = useState<Filter>('fresh');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const matchesFilter = (cat: Category) => filter === 'all' || cat === filter;

  const toBuy = items.filter((i) => i.status === 'to_buy' && matchesFilter(i.category));

  const now = Date.now();
  const bought = items.filter(
    (i) =>
      i.status === 'in_stock' &&
      i.bought_at &&
      now - new Date(i.bought_at).getTime() < TWENTY_FOUR_HOURS &&
      matchesFilter(i.category),
  );

  const handleAddSubmit = async (data: { name: string; category: Category; note: string | null; icon: string | null }) => {
    await addItem({ name: data.name, category: data.category, status: 'to_buy', note: data.note, icon: data.icon });
  };

  const handleEditSubmit = async (data: { name: string; category: Category; note: string | null; icon: string | null }) => {
    if (!editing) return;
    await updateItem(editing.id, { name: data.name, note: data.note, icon: data.icon });
  };

  return (
    <div className="pb-28">
      {/* Filter chips */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md px-4 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-2 rounded-2xl font-medium text-[13px] whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  active
                    ? 'bg-white shadow-md border border-gray-100 text-gray-900'
                    : 'bg-transparent text-gray-400/80 hover:text-gray-500'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Need to buy */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Нужно купить</h2>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {toBuy.length}
          </span>
        </div>

        {toBuy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">Список покупок пуст</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {toBuy.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <SwipeableCard
                  key={item.id}
                  resetKey={filter}
                  onEdit={() => setEditing(item)}
                  onDelete={() => deleteItem(item.id)}
                >
                  <div className="bg-white border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 animate-[fadeIn_0.25s_ease]">
                    {/* Left: icon square */}
                    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>

                    {/* Middle: name + note */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                      {item.note ? (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.note}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">{CATEGORY_META[item.category].label}</p>
                      )}
                    </div>

                    {/* Right: circle checkbox */}
                    <button
                      onClick={() => updateItemStatus(item.id, 'in_stock')}
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition flex items-center justify-center shrink-0 active:scale-90"
                      aria-label="Отметить купленным"
                    />
                  </div>
                </SwipeableCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Куплено */}
      {bought.length > 0 && (
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Куплено</h2>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {bought.length}
            </span>
          </div>
          <div className="space-y-2">
            {bought.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <div
                  key={item.id}
                  className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-3.5 flex items-center gap-3 animate-[fadeIn_0.25s_ease]"
                >
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0 opacity-50`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-400 text-sm line-through truncate">{item.name}</p>
                    {item.note && (
                      <p className="text-xs text-gray-300 mt-0.5 line-through truncate">{item.note}</p>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-300 mt-2.5 text-center">Исчезнут через 24 часа</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-300 hover:bg-emerald-600 active:scale-95 transition flex items-center justify-center z-20"
        aria-label="Добавить товар"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <ItemModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        mode="add"
        category={filter === 'all' ? 'fresh' : filter}
        status="to_buy"
        onSubmit={handleAddSubmit}
        subtitle="Добавьте товар в список покупок"
        accentColor="emerald"
      />

      <ItemModal
        open={!!editing}
        onClose={() => setEditing(null)}
        mode="edit"
        category={editing?.category ?? 'fresh'}
        status={editing?.status ?? 'to_buy'}
        item={editing}
        onSubmit={handleEditSubmit}
        accentColor="emerald"
      />
    </div>
  );
}
