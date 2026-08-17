import { useState } from 'react';
import { useHousehold } from '@/context/HouseholdContext';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, LogIn, Loader2, Copy, Check, Home } from 'lucide-react';

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function OnboardingScreen() {
  const { createHousehold, joinHousehold } = useHousehold();
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const startCreate = () => {
    setMode('create');
    setName('Наша семья');
    setPin(randomPin());
    setError(null);
  };

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN должен быть 4 цифры');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createHousehold(name.trim() || 'Наша семья', pin);
    if (error) setError(error);
    setBusy(false);
  };

  const doJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinPin.length !== 4) {
      setError('Введите 4-значный PIN');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await joinHousehold(joinPin);
    if (error) setError(error);
    setBusy(false);
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
            <Home className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Семейная корзина</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {user?.email}
          </p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={startCreate}
              className="w-full p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition text-left flex items-center gap-4 active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <PlusCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Создать новую семейную корзину</p>
                <p className="text-sm text-gray-500">Получите PIN-код для приглашения</p>
              </div>
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className="w-full p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition text-left flex items-center gap-4 active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <LogIn className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Присоединиться к семейной корзине</p>
                <p className="text-sm text-gray-500">Введите PIN-код от супруга</p>
              </div>
            </button>
            <button
              onClick={signOut}
              className="w-full py-3 mt-4 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Выйти из аккаунта
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={doCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Название семьи</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN-код для приглашения</label>
              <div className="flex gap-2">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 text-2xl tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                />
                <button
                  type="button"
                  onClick={copyPin}
                  className="px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Поделитесь этим кодом с супругом</p>
            </div>
            {error && <p className="text-sm text-rose-500 px-1">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-5 h-5 animate-spin" />}
              Создать корзину
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Назад
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={doJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Введите PIN-код</label>
              <input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                placeholder="••••"
                className="w-full px-4 py-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-3xl tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
            {error && <p className="text-sm text-rose-500 px-1">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-5 h-5 animate-spin" />}
              Присоединиться
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Назад
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
