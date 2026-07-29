'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import Sidebar from '@/components/Sidebar';
import { MaterialUploader } from '@/components/MaterialUploader';
import { InterviewSimulator } from '@/components/InterviewSimulator';
import { ReportCard } from '@/components/ReportCard';

export default function Home() {
  const { activeTab } = useVerbaStore();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Navigation (Visible on Dashboard and Report, optionally hidden on Interview) */}
      {activeTab !== 'interview' && <Sidebar />}

      {/* Main Content Area */}
      <main className={`flex-1 transition-all ${activeTab !== 'interview' ? 'md:ml-64 p-margin-mobile md:p-margin-desktop' : 'w-full'} min-h-screen`}>
        
        {/* Mobile Header Toggle - visible only when sidebar is active */}
        {activeTab !== 'interview' && (
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Student Dashboard</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Welcome back. Here is your recent academic progress.</p>
            </div>
            <button className="md:hidden p-2 rounded-lg bg-surface-container text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </header>
        )}

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter max-w-container-max mx-auto">
            {/* Overall Progress Chart Placeholder - Spans 8 cols */}
            <section className="col-span-1 md:col-span-8 glass-card rounded-xl p-6 hover-lift relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-[20px] text-on-surface">Общий прогресс</h2>
                <span className="font-label-sm text-label-sm bg-surface-container-high text-primary px-3 py-1 rounded-full">Последние 30 дней</span>
              </div>
              
              <div className="h-48 w-full bg-surface-container-low rounded-lg relative flex items-end justify-around p-4">
                <div className="w-1/12 bg-primary-container rounded-t-sm h-1/4 opacity-60"></div>
                <div className="w-1/12 bg-primary-container rounded-t-sm h-2/4 opacity-70"></div>
                <div className="w-1/12 bg-primary-container rounded-t-sm h-1/3 opacity-80"></div>
                <div className="w-1/12 bg-primary-container rounded-t-sm h-3/4 opacity-90"></div>
                <div className="w-1/12 bg-secondary rounded-t-sm h-full relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-label-sm text-label-sm bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded">92%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 border-t border-surface-container-high pt-4">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Средний балл</div>
                  <div className="font-headline-md text-headline-md text-primary">88/100</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Пройдено экзаменов</div>
                  <div className="font-headline-md text-headline-md text-primary">14</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Время подготовки</div>
                  <div className="font-headline-md text-headline-md text-primary">32ч</div>
                </div>
              </div>
            </section>

            {/* Material Uploader and Recent Materials (Spans 4 and 6 cols respectively) */}
            <MaterialUploader />

            {/* История сессий - Spans 6 cols */}
            <section className="col-span-1 md:col-span-6 glass-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-[20px] text-on-surface">История сессий</h2>
                <a href="#" className="font-label-sm text-label-sm text-secondary hover:underline">Показать все</a>
              </div>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest p-4 rounded-r-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface font-semibold">Mock Exam: Neuroanatomy</h4>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Вчера, 14:30 • 45 мин</p>
                    </div>
                    <div className="bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded font-label-sm text-label-sm">
                      Оценка: A-
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3">
                    <div className="progress-bar-fill h-1.5 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Full screen interview simulator */}
        {activeTab === 'interview' && (
          <div className="h-screen -m-margin-mobile md:-m-margin-desktop">
            <InterviewSimulator />
          </div>
        )}

        {/* Report Card Full Width */}
        {activeTab === 'report' && (
           <div className="max-w-4xl mx-auto">
             <ReportCard />
           </div>
        )}

      </main>
    </div>
  );
}
