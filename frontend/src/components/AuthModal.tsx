import React, { useState } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useVerbaStore();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password, name || 'Студент');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {isLoginMode ? 'Вход в аккаунт' : 'Регистрация'}
            </h2>
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="text-on-surface-variant hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl font-label-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLoginMode && (
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Имя</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-primary text-white py-3.5 rounded-xl font-label-md shadow-md hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLoginMode ? 'Войти' : 'Создать аккаунт'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
              }}
              className="font-label-sm text-secondary hover:underline"
            >
              {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
