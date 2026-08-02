'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { useRouter } from 'next/navigation';

export const LandingPage: React.FC = () => {
  const { token, setAuthModalOpen } = useVerbaStore();
  const router = useRouter();

  const handleStartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (token) {
      router.push('/dashboard');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container w-full overflow-x-hidden min-h-screen relative">
      <header className="sticky top-0 z-50 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] w-full">
        <nav className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-20">
          <div className="flex items-center gap-6">
            <a className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2" href="#">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              Verba AI
            </a>
            <div className="hidden md:flex items-center gap-6 ml-8">
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#" onClick={handleStartClick}>Дашборд</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#features">Преимущества</a>
              <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#pricing">Тарифы</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleStartClick}
              className="hidden md:inline-flex font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors"
            >
              Войти
            </button>
            <button 
              onClick={handleStartClick}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0px_6px_24px_rgba(0,86,198,0.15)]"
            >
              Начать работу
            </button>
          </div>
        </nav>
      </header>
      
      <main>
        <section className="relative pt-24 pb-32 px-4 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 overflow-hidden">
          <div className="flex-1 flex flex-col items-start gap-6 z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Новое поколение академической подготовки
            </div>
            <h1 className="font-display-lg text-display-lg text-primary max-w-2xl">
              Подготовься к устным экзаменам с ИИ-тренером
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Интеллектуальная платформа Verba AI анализирует ваши учебные материалы (RAG), проводит реалистичные голосовые мок-интервью и предоставляет глубокую аналитику знаний.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button 
                onClick={handleStartClick}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-secondary text-on-secondary font-label-md text-label-md hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
              >
                Начать бесплатно
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
              <a className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-outline text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md" href="#features">
                Узнать больше
              </a>
            </div>
          </div>
          <div className="flex-1 relative w-full aspect-square md:aspect-auto md:h-[600px] rounded-xl overflow-hidden shadow-[0px_12px_40px_rgba(0,0,0,0.08)] border border-white/50 bg-white group">
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest to-surface-container-high opacity-50"></div>
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="AI illustration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnIEB5aZUPjaLL38WZYo1McBtakCWbD77r2BYALG8e166PaENxpdCpPKBixLeCJ6gY-EkNCgcJS-nGC-hfDKmFr4zxEhRM8sklwXeQNt8Bvnqbs4EkFr7oKF8OHQPnDVMU_WpI3kvjlegfJgLcaO1d-bLYm8NXAJZWR7y_gaHbQ0DlolXNQKhnI8L-JeY9DFZ2ud9DOfsS2neYEsRYdSpllDCmRh7J8KG4BoKoMoiVAe2mDiS9g3cjmA"/>
            <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md rounded-lg p-4 border border-white/40 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ИИ-Экзаменатор</p>
                <p className="font-label-md text-label-md text-on-surface">"Объясните основную концепцию материала..."</p>
              </div>
              <div className="ml-auto flex gap-1">
                <div className="w-1.5 h-4 bg-tertiary-fixed-dim rounded-full animate-pulse"></div>
                <div className="w-1.5 h-6 bg-tertiary-fixed-dim rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-3 bg-tertiary-fixed-dim rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-24 px-4 md:px-10 bg-surface-container-lowest border-y border-outline-variant/20" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Инструменты для вашего успеха</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Превратите пассивное чтение в активную тренировку. Verba AI использует RAG и передовые модели LLM для симуляции реальных экзаменов по вашим методичкам.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface rounded-xl p-8 border border-white shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_30px_rgba(0,86,198,0.08)] hover:border-secondary/10 transition-all duration-300 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[28px]">upload_file</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Загрузка PDF</h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                  Просто загрузите лекции или конспекты. ИИ мгновенно проанализирует контекст, разобьет его на чанки и выделит ключевые тезисы.
                </p>
                <div className="mt-6 pt-6 border-t border-dashed border-outline-variant/40">
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed-dim w-3/4 rounded-full"></div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 text-right">Векторная БД готова</p>
                </div>
              </div>
              <div className="bg-surface rounded-xl p-8 border border-white shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_30px_rgba(0,86,198,0.08)] hover:border-secondary/10 transition-all duration-300 group flex flex-col h-full md:translate-y-4">
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[28px]">record_voice_over</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Устные собеседования</h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                  Проходите голосовые мок-интервью. Экзаменатор задает вопросы по загруженному тексту и слушает ваш ответ в реальном времени.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="bg-surface-container-low p-3 rounded-lg rounded-tl-none self-start max-w-[85%]">
                    <p className="font-label-sm text-label-sm text-on-surface">Что сказано на странице 42?</p>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-lg rounded-tr-none self-end max-w-[85%]">
                    <p className="font-label-sm text-label-sm">Там описан метод...</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface rounded-xl p-8 border border-white shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_30px_rgba(0,86,198,0.08)] hover:border-secondary/10 transition-all duration-300 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[28px]">insights</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Мгновенный фидбек</h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                  Получайте оценку (0-100), список упущенных терминов и ссылки на страницы исходника для повторения сразу после ответа.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-low p-3 rounded-lg border-l-4 border-tertiary-fixed-dim">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Оценка ответа</p>
                    <p className="font-headline-md text-headline-md text-on-surface">88/100</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border-l-4 border-secondary">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Точность RAG</p>
                    <p className="font-headline-md text-headline-md text-on-surface">99%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Инвестируйте в свои знания</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">Прозрачные тарифы без скрытых платежей. Платформа работает по модели SaaS.</p>
          </div>
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-[0px_12px_40px_rgba(0,0,0,0.08)] border border-outline-variant/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="p-8">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Студенческая подписка</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">Идеально для подготовки к сессии</p>
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-outline-variant/20">
                <span className="font-display-lg text-display-lg text-primary">690</span>
                <span className="font-body-md text-body-md text-on-surface-variant">руб / мес</span>
              </div>
              <ul className="flex flex-col gap-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-body-md text-on-surface">До 15 устных сессий (мок-интервью)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-body-md text-on-surface">Неограниченная загрузка PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-body-md text-on-surface">Голосовой ввод (Speech-to-Text)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-body-md text-on-surface">Детальная аналитика прогресса</span>
                </li>
              </ul>
              <button 
                onClick={handleStartClick}
                className="w-full py-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-md"
              >
                Оформить подписку
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-surface-dim w-full py-6 px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-6 md:gap-0">
          <div className="font-label-md text-label-md font-bold text-primary">
            © 2026 Verba AI. Подготовка к устным аттестациям.
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Пользовательское соглашение</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Политика конфиденциальности</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Поддержка</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
