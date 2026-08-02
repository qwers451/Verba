'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { useRouter } from 'next/navigation';

export const ReportCard: React.FC = () => {
  const { finalReport, activeSession } = useVerbaStore();
  const router = useRouter();

  if (!finalReport || !activeSession) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl text-center border-outline-variant/30">
        <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">analytics</span>
        <h3 className="font-headline-md text-headline-md text-on-surface">Нет доступного отчета</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
          Пройдите устное собеседование до конца, чтобы система сформировала подробный отчет по вашим знаниям.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-2 bg-secondary text-on-secondary rounded-lg font-label-md transition-opacity hover:opacity-90"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 mt-gutter">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="font-label-sm text-label-sm text-tertiary-container uppercase tracking-wider bg-tertiary-container/10 px-3 py-1 rounded-full border border-tertiary-container/20">
            Итоговый отчет
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mt-3">
            {activeSession.material_title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Анализ проведен на основе {activeSession.total_questions} вопросов.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-surface-variant transition-colors font-label-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined">home</span>
          На главную
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="col-span-1 glass-card p-6 rounded-2xl border-outline-variant/30 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
          
          <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 transition-colors relative
            ${finalReport.overall_score >= 80 ? 'border-tertiary-container text-tertiary-container' : finalReport.overall_score >= 60 ? 'border-secondary text-secondary' : 'border-error text-error'}"
            style={{ 
              borderColor: finalReport.overall_score >= 80 ? 'var(--color-tertiary-container)' : finalReport.overall_score >= 60 ? 'var(--color-secondary)' : 'var(--color-error)',
              color: finalReport.overall_score >= 80 ? 'var(--color-tertiary-container)' : finalReport.overall_score >= 60 ? 'var(--color-secondary)' : 'var(--color-error)'
            }}
          >
            <span className="font-display-lg text-[32px] font-bold">{finalReport.overall_score}</span>
          </div>

          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">
            {finalReport.grade_label}
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Средний балл</p>
        </div>

        {/* Recommendations Card */}
        <div className="col-span-1 md:col-span-2 glass-card p-6 rounded-2xl border-outline-variant/30">
          <h3 className="font-headline-md text-[20px] text-on-surface flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
            Рекомендации AI-экзаменатора
          </h3>
          <ul className="space-y-3">
            {finalReport.key_recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg border border-surface-container-high">
                <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">check_circle</span>
                <span className="font-body-md text-body-md text-on-surface">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topics Breakdown */}
      <div className="glass-card p-6 rounded-2xl border-outline-variant/30 mt-6">
        <h3 className="font-headline-md text-[20px] text-on-surface flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">grading</span>
          Детальный разбор ответов
        </h3>

        <div className="space-y-4">
          {finalReport.topics_breakdown.map((topic, idx) => {
            const isStrong = topic.status === 'strong';
            const isMedium = topic.status === 'medium';

            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border-l-4 bg-surface-container-lowest shadow-sm
                  ${isStrong ? 'border-l-tertiary-fixed-dim' : isMedium ? 'border-l-secondary' : 'border-l-error'}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-2">
                      {topic.topic}
                    </h4>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-3">
                      {topic.advice}
                    </p>
                    {topic.pages && topic.pages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">menu_book</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Материалы на страницах: {topic.pages.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded font-label-sm text-label-sm
                      ${isStrong ? 'bg-tertiary-container/10 text-tertiary-container' : isMedium ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}
                    >
                      {isStrong ? 'Усвоено' : isMedium ? 'Требует внимания' : 'Слабое место'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
