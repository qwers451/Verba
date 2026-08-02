'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const { logout } = useVerbaStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-surface-container-lowest text-on-surface font-label-md text-label-md h-screen w-64 fixed left-0 top-0 flex flex-col p-4 gap-4 hidden md:flex border-r border-outline-variant/30 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="px-2 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold font-headline-md text-headline-md shadow-sm">
          VA
        </div>
        <div>
          <div className="font-headline-md text-[18px] font-bold text-primary tracking-tight">Verba AI</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">Кабинет студента</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1.5 px-2 mt-4">
        <Link 
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/dashboard' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          Главная
        </Link>
        <Link 
          href="/materials"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/materials' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/materials' ? "'FILL' 1" : "'FILL' 0" }}>library_books</span>
          Мои материалы
        </Link>
        <Link 
          href="/exams"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/exams' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/exams' ? "'FILL' 1" : "'FILL' 0" }}>record_voice_over</span>
          Мои экзамены
        </Link>
        <Link 
          href="/coach"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/coach' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/coach' ? "'FILL' 1" : "'FILL' 0" }}>psychology</span>
          AI Тренер
        </Link>
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/settings' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
          Настройки
        </Link>
      </div>

      {/* Footer Tab */}
      <div className="px-2 mt-auto pb-4 flex flex-col gap-1.5">
        <Link 
          href="/help"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/help' ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/help' ? "'FILL' 1" : "'FILL' 0" }}>help</span>
          Помощь
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-all group"
        >
          <span className="material-symbols-outlined">logout</span>
          Выйти
        </button>
      </div>
    </nav>
  );
}
