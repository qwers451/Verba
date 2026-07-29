'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { Header } from '@/components/Header';
import { MaterialUploader } from '@/components/MaterialUploader';
import { InterviewSimulator } from '@/components/InterviewSimulator';
import { ReportCard } from '@/components/ReportCard';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const { activeTab } = useVerbaStore();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Top Hero Banner */}
        {activeTab === 'dashboard' && (
          <div className="mb-8 p-8 rounded-3xl glass-card relative overflow-hidden border-indigo-500/20">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Интеллектуальная подготовка к экзаменам на базе LLM
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Устные тренинги и автоматическая оценка знаний по вашим конспектам
              </h2>

              <p className="text-gray-400 text-base leading-relaxed">
                Загрузите учебные материалы в формате PDF. Система построит векторную базу знаний, проведет моделирование устного экзамена и выдаст персональный отчет со ссылками на первоисточники.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>RAG-анализ точных страниц PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Голосовой & Текстовый диалог</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Подписка 690 ₽/мес (15 сессий)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab views */}
        {activeTab === 'dashboard' && <MaterialUploader />}
        {activeTab === 'interview' && <InterviewSimulator />}
        {activeTab === 'report' && <ReportCard />}

      </main>

      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-gray-500">
        Verba AI SaaS Platform • Разработано для студентов и абитуриентов • 2026
      </footer>
    </div>
  );
}
