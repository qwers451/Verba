'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

export default function CoachPage() {
  const { interviewHistory, finalReport, activeSession, fetchDashboard, fetchReport, isLoadingReport } = useVerbaStore();
  const latestCompleted = interviewHistory.find((item) => item.status === 'completed');

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => {
    if (latestCompleted && (activeSession?.id !== latestCompleted.id || !finalReport)) void fetchReport(latestCompleted.id);
  }, [activeSession?.id, fetchReport, finalReport, latestCompleted]);

  return <div className="max-w-5xl mx-auto grid gap-6">
    <section className="glass-card rounded-xl p-6">
      <p className="text-secondary font-label-sm">AI-ТРЕНЕР</p>
      <h2 className="mt-2 font-headline-md text-[26px] text-on-surface">Ваш маршрут подготовки</h2>
      <p className="mt-2 max-w-2xl text-on-surface-variant">Рекомендации строятся по результатам последнего завершённого собеседования.</p>
    </section>
    {isLoadingReport ? <div className="glass-card rounded-xl p-8 text-center text-on-surface-variant">Анализируем последнюю сессию…</div> : finalReport ? <>
      <section className="grid md:grid-cols-3 gap-4">
        <article className="rounded-xl bg-primary text-white p-5"><p className="text-white/70">Средний результат</p><p className="mt-2 text-3xl font-semibold">{finalReport.overall_score}/100</p><p className="mt-2">{finalReport.grade_label}</p></article>
        <article className="md:col-span-2 rounded-xl bg-surface-container-low p-5"><h3 className="font-headline-md text-on-surface">Что повторить</h3><ul className="mt-3 grid gap-2 text-on-surface-variant">{finalReport.key_recommendations.map((item) => <li key={item} className="flex gap-2"><span className="material-symbols-outlined text-secondary">arrow_right</span>{item}</li>)}</ul></article>
      </section>
      <section className="grid md:grid-cols-2 gap-4">{finalReport.topics_breakdown.map((topic) => <article key={`${topic.topic}-${topic.pages.join('-')}`} className="rounded-xl bg-surface-container-low p-5"><div className="flex justify-between gap-3"><h3 className="font-label-md text-on-surface">{topic.topic}</h3><span className="text-secondary font-label-sm">стр. {topic.pages.join(', ') || '—'}</span></div><p className="mt-2 text-on-surface-variant">{topic.advice}</p></article>)}</section>
      <div className="flex gap-3"><Link href={`/report?session=${latestCompleted?.id}`} className="rounded-xl bg-secondary text-on-secondary px-5 py-3">Открыть полный отчёт</Link><Link href="/materials" className="rounded-xl border border-outline px-5 py-3 text-on-surface">Начать новую тренировку</Link></div>
    </> : <section className="glass-card rounded-xl p-8 text-center"><h3 className="font-headline-md text-on-surface">Пока нет данных для рекомендаций</h3><p className="mt-2 text-on-surface-variant">Завершите первую тренировку, и здесь появится персональный план повторения.</p><Link href="/materials" className="inline-block mt-5 rounded-xl bg-primary text-on-primary px-5 py-3">Выбрать учебник</Link></section>}
  </div>;
}
