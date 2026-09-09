import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Category, Item, ItemStatus } from '@/lib/supabase';
import { CATEGORY_META, getItemIcon, getItemIconColor, autoPickIcon } from '@/lib/icons';
import { HomeTab } from '@/components/HomeTab';
import { ShoppingTab } from '@/components/ShoppingTab';
import { ItemModal } from '@/components/ItemModal';
import { Home, ShoppingCart, LogOut, UserPlus, ChefHat, X, Plus, Check, Pencil, Trash2 } from 'lucide-react';

type Tab = 'home' | 'shopping';

const STORAGE_KEY = 'domzapas_guest_items';

type StoredItem = Omit<Item, 'household_id' | 'created_by'>;

function loadItems(): StoredItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: StoredItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function GuestApp() {
  const { exitGuest, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [items, setItems] = useState<StoredItem[]>(loadItems);
  const [showBanner, setShowBanner] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const addItem = useCallback((data: { name: string; category: Category; status: ItemStatus; note: string | null; icon: string | null }) => {
    const newItem: StoredItem = {
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category,
      status: data.status,
      note: data.note,
      icon: data.icon ?? autoPickIcon(data.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bought_at: data.status === 'in_stock' ? new Date().toISOString() : null,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItemStatus = useCallback((id: string, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status, bought_at: status === 'in_stock' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }
          : it,
      ),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const updateItem = useCallback((id: string, patch: { name: string; note: string | null; icon: string | null }) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, ...patch, updated_at: new Date().toISOString() } : it,
      ),
    );
  }, []);

  const toBuyCount = items.filter((i) => i.status === 'to_buy').length;

  const handleExit = async () => {
    exitGuest();
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sync banner */}
      {showBanner && (
        <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 animate-[fadeIn_0.3s_ease]">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 truncate">
              Вы в гостевом режиме. Зарегистрируйтесь или введите PIN семьи для синхронизации.
            </p>
          </div>
          <button
            onClick={handleExit}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 active:scale-95 transition shrink-0"
          >
            Войти
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="w-6 h-6 rounded-md text-amber-500 hover:bg-amber-100 transition flex items-center justify-center shrink-0"
            aria-label="Скрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gray-400 flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight text-sm">ДомЗапас</p>
            <p className="text-xs text-gray-400 leading-tight">Гостевой режим</p>
          </div>
        </div>
        <button
          onClick={handleExit}
          className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
          aria-label="Выйти"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sub-tab switcher */}
      <div className="sticky top-[57px] z-20 bg-gray-50/80 backdrop-blur-md px-4 pt-2">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setTab('home')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              tab === 'home' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            <Home className="w-4 h-4" />
            Мой дом
          </button>
          <button
            onClick={() => setTab('shopping')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all relative ${
              tab === 'shopping' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            В магазине
            {toBuyCount > 0 && (
              <span className="absolute top-1 right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-400 text-white text-[10px] font-bold flex items-center justify-center">
                {toBuyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div key={tab} className="animate-[fadeIn_0.3s_ease]">
          {tab === 'home' && <GuestHome items={items} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onStatus={updateItemStatus} />}
          {tab === 'shopping' && <GuestShopping items={items} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} onStatus={updateItemStatus} />}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setTab('home')}
            className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all active:scale-90 ${tab === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Home className="w-5 h-5" strokeWidth={tab === 'home' ? 2.4 : 2} />
            <span className="text-[11px] font-medium">Мой дом</span>
          </button>
          <button
            onClick={() => setTab('shopping')}
            className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all active:scale-90 ${tab === 'shopping' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={tab === 'shopping' ? 2.4 : 2} />
            <span className="text-[11px] font-medium">Покупки</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/* ---- Guest Home ---- */
function GuestHome({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onStatus,
}: {
  items: StoredItem[];
  onAdd: (d: { name: string; category: Category; status: ItemStatus; note: string | null; icon: string | null }) => void;
  onUpdate: (id: string, p: { name: string; note: string | null; icon: string | null }) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, s: ItemStatus) => void;
}) {
  const [activeCat, setActiveCat] = useState<Category>('fresh');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const inStock = items.filter((i) => i.status === 'in_stock' && i.category === activeCat);
  const CAT_TABS: Category[] = ['fresh', 'household', 'long_term'];

  return (
    <div className="pb-28">
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
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all active:scale-[0.97] ${
                  active ? 'bg-white shadow-sm text-gray-900' : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? meta.color : ''}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
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
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {inStock.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <div key={item.id} className="group w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 animate-[fadeIn_0.25s_ease]">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setEditing(item as unknown as Item)} className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-90 transition flex items-center justify-center" aria-label="Редактировать">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition flex items-center justify-center" aria-label="Удалить">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pl-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  </div>
                  <button onClick={() => onStatus(item.id, 'to_buy')} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-500 font-medium text-xs hover:bg-rose-100 active:scale-95 transition flex items-center gap-1 shrink-0">
                    <X className="w-3 h-3" />
                    Закончилось
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-300 hover:bg-emerald-600 active:scale-95 transition flex items-center justify-center z-20" aria-label="Добавить">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
      <ItemModal open={showAdd} onClose={() => setShowAdd(false)} mode="add" category={activeCat} status="in_stock" onSubmit={async (d) => { onAdd({ ...d, status: 'in_stock' }); }} subtitle={CATEGORY_META[activeCat].label} accentColor="emerald" />
      <ItemModal open={!!editing} onClose={() => setEditing(null)} mode="edit" category={editing?.category ?? activeCat} status={editing?.status ?? 'in_stock'} item={editing} onSubmit={async (d) => { if (editing) onUpdate(editing.id, d); }} accentColor="emerald" />
    </div>
  );
}

/* ---- Guest Shopping ---- */
function GuestShopping({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onStatus,
}: {
  items: StoredItem[];
  onAdd: (d: { name: string; category: Category; status: ItemStatus; note: string | null; icon: string | null }) => void;
  onUpdate: (id: string, p: { name: string; note: string | null; icon: string | null }) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, s: ItemStatus) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const toBuy = items.filter((i) => i.status === 'to_buy');
  const bought = items.filter(
    (i) => i.status === 'in_stock' && i.bought_at && now - new Date(i.bought_at).getTime() < TWENTY_FOUR_HOURS,
  );

  return (
    <div className="pb-28">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Нужно купить</h2>
        {toBuy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">Список покупок пуст</p>
          </div>
        ) : (
          <div className="space-y-2">
            {toBuy.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-3.5 animate-[fadeIn_0.25s_ease]">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setEditing(item as unknown as Item)} className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-90 transition flex items-center justify-center" aria-label="Редактировать">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition flex items-center justify-center" aria-label="Удалить">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pl-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    </div>
                    <button onClick={() => onStatus(item.id, 'in_stock')} className="w-7 h-7 rounded-full border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition flex items-center justify-center shrink-0 active:scale-90" aria-label="Отметить купленным" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bought.length > 0 && (
        <div className="px-4 pt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Куплено</h2>
          <div className="space-y-2">
            {bought.map((item) => {
              const Icon = getItemIcon(item);
              const { color, bg } = getItemIconColor(item);
              return (
                <div key={item.id} className="group bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3.5 animate-[fadeIn_0.25s_ease]">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center opacity-60`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pl-1">
                      <p className="font-medium text-gray-400 text-sm line-through">{item.name}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-300 hover:bg-emerald-600 active:scale-95 transition flex items-center justify-center z-20" aria-label="Добавить">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
      <ItemModal open={showAdd} onClose={() => setShowAdd(false)} mode="add" category="fresh" status="to_buy" onSubmit={async (d) => { onAdd({ ...d, status: 'to_buy' }); }} subtitle="Добавьте товар в список покупок" accentColor="emerald" />
      <ItemModal open={!!editing} onClose={() => setEditing(null)} mode="edit" category={editing?.category ?? 'fresh'} status={editing?.status ?? 'to_buy'} item={editing} onSubmit={async (d) => { if (editing) onUpdate(editing.id, d); }} accentColor="emerald" />
    </div>
  );
}
