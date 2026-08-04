'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Sidebar() {
  const { logout } = useVerbaStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-primary text-white font-label-md text-label-md h-screen w-64 fixed left-0 top-0 flex flex-col p-4 gap-4 hidden md:flex z-10 shadow-[8px_0_28px_rgba(18,28,70,0.14)]">
      {/* Header */}
      <div className="px-2 py-4">
        <Image
          src="/Verba_Logo_with_Speech_Bubbles_and_Book-removebg-preview.png"
          alt="Verba AI"
          width={180}
          height={48}
          priority
          className="h-11 w-auto object-contain object-left brightness-0 invert"
        />
        <div className="mt-2 font-label-sm text-label-sm text-white/60">Кабинет студента</div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1.5 px-2 mt-4">
        <Link 
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/dashboard' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          Главная
        </Link>
        <Link 
          href="/materials"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/materials' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/materials' ? "'FILL' 1" : "'FILL' 0" }}>library_books</span>
          Мои материалы
        </Link>
        <Link 
          href="/exams"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/exams' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/exams' ? "'FILL' 1" : "'FILL' 0" }}>record_voice_over</span>
          Мои экзамены
        </Link>
        <Link 
          href="/coach"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/coach' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/coach' ? "'FILL' 1" : "'FILL' 0" }}>psychology</span>
          AI Тренер
        </Link>
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/settings' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
          Настройки
        </Link>
      </div>

      {/* Footer Tab */}
      <div className="px-2 mt-auto pb-4 flex flex-col gap-1.5">
        <Link 
          href="/help"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all duration-200 ${pathname === '/help' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/help' ? "'FILL' 1" : "'FILL' 0" }}>help</span>
          Помощь
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-all group"
        >
          <span className="material-symbols-outlined">logout</span>
          Выйти
        </button>
      </div>
    </nav>
  );
}
