'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { MaterialUploader } from '@/components/MaterialUploader';
import { useVerbaStore } from '@/store/useVerbaStore';

const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

export default function DashboardPage() {
  const { dashboardSummary, interviewHistory, isLoadingDashboard, fetchDashboard, user } = useVerbaStore();

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  const quotaPercent = dashboardSummary
    ? Math.round((dashboardSummary.sessions_used_this_month / dashboardSummary.monthly_sessions_limit) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter max-w-7xl mx-auto w-full">
      <section className="col-span-1 md:col-span-8 elevated-card rounded-2xl p-6 md:p-7 relative overflow-hidden w-full">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <p className="font-label-sm text-label-sm text-secondary mb-2">Текущий тариф: {user?.subscription_title ?? '—'}</p>
            <h2 className="font-headline-md text-[22px] text-on-surface">Ваш учебный ритм</h2>
          </div>
          <Link href="/settings" className="font-label-sm text-label-sm text-secondary hover:underline">Управлять тарифом</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric icon="library_books" label="Материалов" value={dashboardSummary?.material_count ?? 0} loading={isLoadingDashboard} />
          <Metric icon="task_alt" label="Завершено" value={dashboardSummary?.completed_sessions ?? 0} loading={isLoadingDashboard} />
          <Metric icon="play_circle" label="В процессе" value={dashboardSummary?.active_sessions ?? 0} loading={isLoadingDashboard} />
          <Metric icon="grade" label="Средний балл" value={dashboardSummary?.average_score ? `${dashboardSummary.average_score}/100` : '—'} loading={isLoadingDashboard} />
        </div>
        <div className="mt-7 p-4 rounded-xl bg-primary text-white">
          <div className="flex justify-between gap-3 text-white mb-2">
            <span className="font-label-md text-label-md">Сессии в этом месяце</span>
            <span className="font-label-md text-label-md">{dashboardSummary?.sessions_used_this_month ?? 0} из {dashboardSummary?.monthly_sessions_limit ?? user?.monthly_sessions_limit ?? 0}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${Math.min(quotaPercent, 100)}%` }} />
          </div>
          <p className="mt-3 text-white/70 font-label-sm text-label-sm">Осталось: {dashboardSummary?.sessions_remaining ?? user?.sessions_remaining ?? 0} тренировочных сессий.</p>
        </div>
      </section>

      <MaterialUploader />

      <section className="col-span-1 md:col-span-12 elevated-card rounded-2xl p-6 md:p-7 w-full">
        <div className="flex justify-between items-center gap-4 mb-5">
          <h2 className="font-headline-md text-[20px] text-on-surface">Последние сессии</h2>
          <Link href="/exams" className="font-label-sm text-label-sm text-secondary hover:underline">Вся история</Link>
        </div>
        {interviewHistory.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-6 text-center">
            <span className="material-symbols-outlined text-primary text-3xl">record_voice_over</span>
            <p className="mt-2 text-on-surface font-label-md">Пока нет тренировочных сессий</p>
            <p className="mt-1 text-on-surface-variant font-label-sm">Загрузите PDF и запустите первую тренировку.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {interviewHistory.slice(0, 3).map((session) => (
              <Link href={session.status === 'completed' ? `/report?session=${session.id}` : session.status === 'in_progress' ? `/interview?session=${session.id}` : '/materials'} key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4 hover:bg-surface-container transition-colors">
                <div><p className="font-label-md text-label-md text-on-surface">{session.material_title}</p><p className="font-label-sm text-label-sm text-on-surface-variant">{formatDate(session.created_at)} · {session.total_questions} вопросов</p></div>
                <span className="rounded-full px-3 py-1 bg-primary-container text-on-primary-container font-label-sm text-label-sm">{session.status === 'completed' ? `Оценка: ${session.overall_score ?? '—'}` : session.status === 'in_progress' ? 'Продолжить' : session.status === 'failed' ? 'Создать заново' : 'Обработка'}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon, label, value, loading }: { icon: string; label: string; value: string | number; loading: boolean }) {
  return <div className="rounded-xl border border-outline-variant/35 bg-white/70 p-4 transition-transform hover:-translate-y-0.5"><span className="material-symbols-outlined text-secondary">{icon}</span><p className="mt-3 text-on-surface-variant font-label-sm text-label-sm">{label}</p><p className="mt-1 text-primary font-headline-md text-[24px]">{loading ? '…' : value}</p></div>;
}
