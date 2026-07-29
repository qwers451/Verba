'use client';

import React, { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { Brain, Sparkles, BookOpen, MessageSquare, Award, CreditCard } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, fetchUser, activeTab, setActiveTab, activeSession, finalReport } = useVerbaStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const used = user?.sessions_used_this_month || 0;
  const limit = user?.monthly_sessions_limit || 15;
  const remaining = Math.max(0, limit - used);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0F19]/80 border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Verba AI</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SaaS v1.0
              </span>
            </div>
            <p className="text-xs text-gray-400">Платформа подготовки к устным аттестациям</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-gray-900/60 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            База знаний
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            disabled={!activeSession}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'interview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : activeSession
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Собеседование
            {activeSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('report')}
            disabled={!finalReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'report'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : finalReport
                ? 'text-gray-400 hover:text-white hover:bg-white/5'
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Award className="w-4 h-4" />
            Отчёт
          </button>
        </nav>

        {/* Subscription & Quota Card */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
              <CreditCard className="w-3.5 h-3.5" />
              Подписка: 690 ₽/мес
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Осталось: <span className="text-emerald-400 font-semibold">{remaining}</span> / {limit} сессий
            </div>
          </div>

          <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden border border-white/10 hidden sm:block">
            <div
              className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-full transition-all duration-500"
              style={{ width: `${(remaining / limit) * 100}%` }}
            />
          </div>
        </div>

      </div>
    </header>
  );
};
