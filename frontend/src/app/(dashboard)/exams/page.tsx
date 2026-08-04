'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

export default function ExamsPage() {
  const { interviewHistory, fetchDashboard, isLoadingDashboard } = useVerbaStore();
  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);
  return <section className="max-w-5xl mx-auto glass-card rounded-xl p-6"><p className="text-secondary font-label-sm">ТРЕНИРОВОЧНЫЕ СЕССИИ</p><h2 className="mt-2 font-headline-md text-[26px] text-on-surface">История подготовки</h2><p className="mt-1 text-on-surface-variant">Вопросы формируются по материалу учебника, а ответы оцениваются с использованием найденного RAG-контекста.</p><div className="mt-6 grid gap-3">{isLoadingDashboard ? <p className="text-on-surface-variant">Загружаем историю…</p> : interviewHistory.length === 0 ? <div className="rounded-xl bg-surface-container-low p-8 text-center"><p className="text-on-surface">История пока пуста.</p><Link href="/materials" className="inline-block mt-3 text-secondary hover:underline">Перейти к материалам</Link></div> : interviewHistory.map((item) => <Link key={item.id} href={item.status === 'completed' ? `/report?session=${item.id}` : item.status === 'in_progress' ? `/interview?session=${item.id}` : '/materials'} className="rounded-xl bg-surface-container-low p-4 flex flex-wrap justify-between items-center gap-3 hover:bg-surface-container"><div><h3 className="text-on-surface font-label-md">{item.material_title}</h3><p className="text-on-surface-variant font-label-sm mt-1">{item.total_questions} вопросов · {new Date(item.created_at).toLocaleDateString('ru-RU')}</p></div><span className="rounded-full px-3 py-1 bg-primary-container text-on-primary-container font-label-sm">{item.status === 'completed' ? `Оценка ${item.overall_score ?? '—'}` : item.status === 'failed' ? 'Создать заново' : item.status === 'in_progress' ? 'Продолжить' : 'Обработка'}</span></Link>)}</div></section>;
}
