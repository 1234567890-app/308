import { useState } from 'react';
import { useHousehold } from '@/context/HouseholdContext';
import type { Category, Item } from '@/lib/supabase';
import { CATEGORY_META, getItemIcon, getItemIconColor } from '@/lib/icons';
import { ItemModal } from '@/components/ItemModal';
import { SwipeableCard } from '@/components/SwipeableCard';
import { Plus, MapPin } from 'lucide-react';

const CAT_TABS: Category[] = ['fresh', 'household', 'long_term'];

export function HomeTab() {
  const { items, addItem, updateItemStatus, deleteItem, updateItem } = useHousehold();
  const [activeCat, setActiveCat] = useState<Category>('fresh');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const inStock = items.filter((i) => i.status === 'in_stock' && i.category === activeCat);

  const handleEditSubmit = async (data: { name: string; category: Category; note: string | null; icon: string | null }) => {
    if (!editing) return;
    await updateItem(editing.id, { name: data.name, note: data.note, icon: data.icon });
  };

  const handleAddSubmit = async (data: { name: string; category: Category; note: string | null; icon: string | null }) => {
    await addItem({ name: data.name, category: data.category, status: 'in_stock', note: data.note, icon: data.icon });
  };

  return (
    <div className="pb-28">
      {/* Category chips */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md px-4 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CAT_TABS.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = getItemIcon({ category: cat, icon: meta.defaultIcon });
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-medium text-[13px] whitespace-nowrap shrink-0 transition-all active:scale-[0.97] ${
                  active
                    ? 'bg-white shadow-md border border-gray-100 text-gray-900'
                    : 'bg-transparent text-gray-400/80 hover:text-gray-500'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? meta.color : 'text-gray-400'}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="px-4 pt-2">
        {inStock.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-16 h-16 rounded-2xl ${CATEGORY_META[activeCat].bg} flex items-center justify-center mb-4`}>
              {(() => {
                const Icon = getItemIcon({ category: activeCat, icon: null });
                return <Icon className={`w-8 h-8 ${CATEGORY_META[activeCat].color}`} />;
              })()}
            </div>
            <p className="text-gray-400 font-medium">Здесь пока пусто</p>
            <p className="text-sm text-gray-300 mt-1">Добавьте товар кнопкой ниже</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {inStock.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <SwipeableCard
                  key={item.id}
                  resetKey={activeCat}
                  onEdit={() => setEditing(item)}
                  onDelete={() => deleteItem(item.id)}
                >
                  <div className="bg-white border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 animate-[fadeIn_0.25s_ease]">
                    {/* Left: rounded icon square only */}
                    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>

                    {/* Middle: bold name + muted store/note */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.name}</p>
                      {item.note ? (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.note}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">{CATEGORY_META[item.category].label}</p>
                      )}
                    </div>

                    {/* Right: soft pink "Пополнить запасы" */}
                    <button
                      onClick={() => updateItemStatus(item.id, 'to_buy')}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95"
                      style={{ background: '#FFECEC', color: '#E53E3E' }}
                    >
                      Пополнить запасы
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
        aria-label="Добавить товар"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <ItemModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        mode="add"
        category={activeCat}
        status="in_stock"
        onSubmit={handleAddSubmit}
        subtitle={CATEGORY_META[activeCat].label}
        accentColor="emerald"
      />

      <ItemModal
        open={!!editing}
        onClose={() => setEditing(null)}
        mode="edit"
        category={editing?.category ?? activeCat}
        status={editing?.status ?? 'in_stock'}
        item={editing}
        onSubmit={handleEditSubmit}
        accentColor="emerald"
      />
    </div>
  );
}
