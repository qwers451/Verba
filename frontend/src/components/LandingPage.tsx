'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <div className="app-shell text-on-background font-body-md text-body-md antialiased w-full overflow-x-hidden min-h-screen relative">
      <header className="sticky top-0 z-50 border-b border-outline-variant/35 bg-white/85 backdrop-blur-xl w-full">
        <nav className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-20">
          <div className="flex items-center gap-6">
            <a className="flex items-center" href="#" aria-label="Verba AI — главная страница">
              <Image
                src="/Verba_Logo_with_Speech_Bubbles_and_Book-removebg-preview.png"
                alt="Verba AI"
                width={180}
                height={48}
                priority
              className="h-10 w-auto object-contain"
              />
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
              className="focus-ring hidden md:inline-flex font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors rounded-md"
            >
              Войти
            </button>
            <button 
              onClick={handleStartClick}
              className="focus-ring inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:-translate-y-0.5 hover:bg-primary/90 transition-all shadow-[0px_8px_20px_rgba(32,44,98,0.22)]"
            >
              Начать работу
            </button>
          </div>
        </nav>
      </header>
      
      <main>
        <section className="relative px-4 pt-12 pb-16 md:px-10 md:pt-20 md:pb-24 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-white shadow-[0_24px_60px_rgba(32,44,98,0.24)] md:px-12 md:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(110,145,255,0.46),transparent_24rem),radial-gradient(circle_at_12%_100%,rgba(77,215,179,0.22),transparent_25rem)]" />
            <div className="relative flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col items-start gap-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white font-label-sm text-label-sm border border-white/20">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Новое поколение академической подготовки
            </div>
            <h1 className="font-display-lg text-display-lg text-white max-w-2xl">
              Подготовься к устным экзаменам системно
            </h1>
            <p className="font-body-lg text-body-lg text-white/78 max-w-xl">
              Веб-сервис для самостоятельной подготовки к устным аттестациям по собственным учебным материалам. Загрузите PDF, пройдите тренировку и сохраните результат в личном кабинете.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button 
                onClick={handleStartClick}
                className="focus-ring inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-primary font-label-md text-label-md hover:-translate-y-0.5 transition-all shadow-lg shadow-black/10"
              >
                Начать бесплатно
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
              <a className="focus-ring inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-white/35 text-white hover:bg-white/10 transition-colors font-label-md text-label-md" href="#features">
                Узнать больше
              </a>
            </div>
          </div>
          <div className="flex-1 relative w-full rounded-2xl overflow-hidden border border-white/20 bg-white/10 p-4 md:p-6 backdrop-blur-sm">
            <div className="relative rounded-xl bg-white p-5 shadow-[0_18px_42px_rgba(7,13,44,0.24)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Тренировочная сессия</p>
                <p className="font-label-md text-label-md text-on-surface">Загрузите PDF и начните подготовку в своём темпе.</p>
              </div>
              <div className="ml-auto flex gap-1 items-end" aria-label="Индикатор аудио">
                <div className="w-1.5 h-4 bg-secondary rounded-full"></div>
                <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                <div className="w-1.5 h-3 bg-secondary rounded-full"></div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-white">
              <div className="rounded-xl border border-white/15 bg-white/5 p-4"><p className="text-label-sm font-label-sm text-white/60">Материалы</p><p className="mt-1 text-xl font-semibold">PDF</p></div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-4"><p className="text-label-sm font-label-sm text-white/60">Формат</p><p className="mt-1 text-xl font-semibold">Диалог</p></div>
            </div>
          </div>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-10 pb-16" aria-label="Поддержка проекта">
          <div className="max-w-7xl mx-auto rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="grid w-full shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:w-[560px]">
                <a href="https://fasie.ru/" target="_blank" rel="noreferrer" className="flex min-h-[11rem] flex-col justify-between rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5" aria-label="Фонд содействия инновациям">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Фонд содействия инновациям</span>
                  <Image src="/fsi-logo.png" alt="Официальный логотип Фонда содействия инновациям" width={376} height={211} className="h-20 w-full object-contain object-left md:h-24" />
                </a>
                <a href="https://univertechpred.ru/" target="_blank" rel="noreferrer" className="flex min-h-[11rem] flex-col justify-between rounded-xl bg-primary p-5 shadow-sm transition-transform hover:-translate-y-0.5" aria-label="Платформа университетского технологического предпринимательства">
                  <span className="font-label-sm text-label-sm text-white/80">Платформа университетского технологического предпринимательства</span>
                  <Image src="/utp-logo.svg" alt="Логотип Платформы университетского технологического предпринимательства" width={106} height={81} className="h-20 w-full object-contain object-left md:h-24" />
                </a>
              </div>
              <p className="font-label-sm text-label-sm leading-6 text-on-surface-variant">Проект реализован при поддержке Фонда содействия инновациям в рамках программы «Студенческий стартап» Платформы университетского технологического предпринимательства федерального проекта «Технологии», входящего в состав национального проекта «Эффективная и конкурентная экономика».</p>
            </div>
          </div>
        </section>
        
        <section className="py-24 px-4 md:px-10 bg-white border-y border-outline-variant/20" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Инструменты для вашего успеха</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Превратите пассивное чтение в активную тренировку: храните материалы, проходите сессии и возвращайтесь к истории подготовки.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface rounded-xl p-8 border border-white shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_30px_rgba(0,86,198,0.08)] hover:border-secondary/10 transition-all duration-300 group flex flex-col h-full">
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[28px]">upload_file</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Загрузка PDF</h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                  Загружайте лекции и конспекты в PDF. Сервис сохраняет материал, извлекает текст и подготавливает его к работе.
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
                  Проходите тренировочные сессии в формате диалога по загруженному материалу. Голосовой режим будет добавлен на следующих этапах.
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
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">История подготовки</h3>
                <p className="font-body-md text-body-md text-on-surface-variant flex-grow">
                  Сохраняйте завершённые сессии и возвращайтесь к результатам. Интеллектуальная оценка и персональные рекомендации развиваются поэтапно.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-low p-3 rounded-lg border-l-4 border-tertiary-fixed-dim">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Сессии</p>
                    <p className="font-headline-md text-headline-md text-on-surface">История</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border-l-4 border-secondary">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Результаты</p>
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
          <div className="max-w-md mx-auto bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(27,45,83,0.12)] border border-outline-variant/30 overflow-hidden relative">
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
                  <span className="font-body-md text-body-md text-on-surface">История тренировочных сессий</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-body-md text-on-surface">Тестовый режим оплаты через ЮKassa</span>
                </li>
              </ul>
              <button 
                onClick={handleStartClick}
                className="focus-ring w-full py-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:-translate-y-0.5 hover:bg-primary/90 transition-all shadow-md"
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
