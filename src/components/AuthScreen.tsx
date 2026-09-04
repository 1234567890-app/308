import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Home, Loader2, Mail, ArrowLeft, UserRound } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthScreen() {
  const { signIn, signUp, resetPassword, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (mode === 'reset') {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setError(error);
      } else {
        setInfo('Ссылка для сброса пароля отправлена на вашу почту');
      }
      setBusy(false);
      return;
    }

    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
            <Home className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ДомЗапас</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Совместные покупки и домашние запасы для всей семьи
          </p>
        </div>

        {mode === 'reset' ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>
            {error && <p className="text-sm text-rose-500 px-1">{error}</p>}
            {info && <p className="text-sm text-emerald-600 px-1">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-5 h-5 animate-spin" />}
              Отправить ссылку
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setInfo(null);
              }}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад ко входу
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
              {error && <p className="text-sm text-rose-500 px-1">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-5 h-5 animate-spin" />}
                {mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
              </button>
            </form>

            {mode === 'signin' && (
              <button
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
                className="w-full text-sm text-gray-400 hover:text-emerald-500 transition mt-3 text-center"
              >
                Забыли пароль?
              </button>
            )}

            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">или</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={() => {
                signInAsGuest();
              }}
              className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <UserRound className="w-5 h-5" />
              Войти как гость
            </button>

            <button
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError(null);
              }}
              className="w-full py-3.5 mt-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:scale-[0.98] transition"
            >
              {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
