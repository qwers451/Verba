'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { Award, BookOpen, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Download, RotateCcw } from 'lucide-react';

export const ReportCard: React.FC = () => {
  const { finalReport, isLoadingReport, setActiveTab, selectedMaterial, startInterview } = useVerbaStore();

  if (isLoadingReport) {
    return (
      <div className="glass-card p-12 text-center text-gray-400 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-white font-medium">Формирование отчета устного аттестационного собеседования...</p>
      </div>
    );
  }

  if (!finalReport) {
    return (
      <div className="glass-card p-12 text-center text-gray-400">
        Отчет пока не создан. Пройдите тренировочное собеседование до конца.
      </div>
    );
  }

  const score = finalReport.overall_score;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/30">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
            Результаты аттестации • {finalReport.material_title}
          </span>
          <h2 className="text-2xl font-bold text-white">
            Итоговый отчёт готовности
          </h2>
          <p className="text-sm text-gray-400">
            Анализ ответов составлен на основе содержания загруженных учебных материалов.
          </p>
        </div>

        {/* Score Radial Badge */}
        <div className="flex items-center gap-4 bg-gray-900/80 p-5 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-400">
              {score}%
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Средний балл</div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div>
            <div className="text-sm font-bold text-white">
              {finalReport.grade_label}
            </div>
            <div className="text-xs text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Завершено
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations & Action Plan */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Рекомендации по дальнейшей подготовке
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {finalReport.key_recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-900/60 border border-white/5 text-sm text-gray-300">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                {idx + 1}
              </div>
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topics Breakdown */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Разбор изученных тем и ссылок на страницы PDF
        </h3>

        <div className="space-y-3">
          {finalReport.topics_breakdown.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-900/50 border border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-white text-sm">{item.topic}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    item.status === 'strong'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : item.status === 'medium'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {item.status === 'strong' ? 'Освоено' : item.status === 'medium' ? 'Требует внимания' : 'Пробел'}
                </span>
              </div>

              <p className="text-xs text-gray-400">{item.advice}</p>

              {item.pages && item.pages.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 pt-1">
                  <span>Страницы в PDF для повторения:</span>
                  {item.pages.map((p) => (
                    <span key={p} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-semibold">
                      Стр. {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-all"
        >
          Вернуться в базу знаний
        </button>

        {selectedMaterial && (
          <button
            onClick={() => startInterview(selectedMaterial.id)}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Пройти собеседование повторно
          </button>
        )}
      </div>
    </div>
  );
};
