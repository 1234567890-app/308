import { useState } from 'react';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { HomeTab } from '@/components/HomeTab';
import { ShoppingTab } from '@/components/ShoppingTab';
import { RecipesTab } from '@/components/RecipesTab';
import { Home, ShoppingCart, LogOut, Users, ChefHat } from 'lucide-react';

type Tab = 'home' | 'shopping' | 'recipes';

export function MainApp() {
  const { household, items } = useHousehold();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');

  const toBuyCount = items.filter((i) => i.status === 'to_buy').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight text-sm">ДомЗапас</p>
            <p className="text-xs text-gray-400 leading-tight flex items-center gap-1">
              <Users className="w-3 h-3" />
              {household?.name ?? 'Семья'}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center justify-center"
          aria-label="Выйти"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Home / Shopping sub-tab switcher (only on home & shopping) */}
      {(tab === 'home' || tab === 'shopping') && (
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
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div key={tab} className="animate-[fadeIn_0.3s_ease]">
          {tab === 'home' && <HomeTab />}
          {tab === 'shopping' && <ShoppingTab />}
          {tab === 'recipes' && <RecipesTab />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setTab('home')}
            className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all active:scale-90 ${
              tab === 'home' || tab === 'shopping' ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={tab === 'home' || tab === 'shopping' ? 2.4 : 2} />
            <span className="text-[11px] font-medium">Покупки</span>
          </button>
          <button
            onClick={() => setTab('recipes')}
            className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all active:scale-90 ${
              tab === 'recipes' ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            <ChefHat className="w-5 h-5" strokeWidth={tab === 'recipes' ? 2.4 : 2} />
            <span className="text-[11px] font-medium">Рецепты</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
