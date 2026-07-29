'use client';

import React, { useState, useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

export const InterviewSimulator: React.FC = () => {
  const {
    activeSession,
    currentQuestionIdx,
    submitAnswer,
    isEvaluating,
    setVoiceModeActive,
    setActiveTab,
  } = useVerbaStore();

  const [answerInput, setAnswerInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается вашим браузером. Используйте текстовый ввод.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceModeActive(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceModeActive(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceModeActive(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSendAnswer = async () => {
    if (!answerInput.trim() || isEvaluating) return;
    const currentText = answerInput;
    setAnswerInput('');
    await submitAnswer(currentText);
  };

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant font-body-md text-body-md">
        Нет активной сессии. Вернитесь на панель управления и выберите материал.
      </div>
    );
  }

  const currentDialog = activeSession.dialogs[currentQuestionIdx];
  const totalQ = activeSession.total_questions;
  const qNum = currentDialog ? currentDialog.question_number : currentQuestionIdx + 1;
  const progressPercent = Math.min(100, (qNum / totalQ) * 100);

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Left Side: Study Material Context */}
      <section className="hidden md:flex md:w-1/3 lg:w-2/5 bg-surface-container-low flex-col border-r border-outline-variant/30 h-full">
        <header className="p-gutter border-b border-outline-variant/30 flex justify-between items-center">
          <div className="flex items-center gap-base">
            <span className="material-symbols-outlined text-primary text-2xl">school</span>
            <h1 className="font-headline-md text-headline-md text-on-surface line-clamp-1">
              {activeSession.material_title}
            </h1>
          </div>
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-gutter space-y-6">
          <article className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
            <h2 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">
              Контекст
            </h2>
            <p className="font-body-md text-body-md text-on-surface mb-4">
              Идет тренировочное собеседование по материалу. Для каждого вопроса RAG-система находит нужный фрагмент из PDF.
            </p>

            {currentDialog?.referenced_pages && currentDialog.referenced_pages.length > 0 && (
              <div className="bg-surface-container p-4 rounded-lg mt-6">
                <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Связанные страницы PDF
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  {currentDialog.referenced_pages.join(', ')}
                </span>
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Right Side: Interactive AI Coach Interface */}
      <section className="w-full md:w-2/3 lg:w-3/5 bg-surface-bright flex flex-col h-full relative">
        <header className="p-4 md:p-gutter flex justify-between items-center border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h2 className="font-label-md text-label-md text-on-surface font-semibold">AI Экзаменатор</h2>
              <span className="font-label-sm text-label-sm text-tertiary-container flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span> {isEvaluating ? 'Оценивает ответ...' : 'Слушает'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                Вопрос {qNum} из {totalQ}
              </span>
              <div className="w-32 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 rounded-lg border border-error text-error hover:bg-error-container transition-colors font-label-md text-label-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              <span className="hidden sm:inline">Завершить</span>
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 md:p-gutter space-y-6 flex flex-col pb-48">
          
          {/* Loop through all dialogs (we can show history, but here we just show current for simplicity, 
              actually it's better to show current question, user answer (if answered), and feedback (if evaluated) */}
          
          {/* AI Question */}
          {currentDialog && (
            <div className="flex gap-4 max-w-3xl self-start">
              <div className="w-8 h-8 rounded-full bg-surface-variant flex-shrink-0 flex items-center justify-center mt-1">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">smart_toy</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-2xl rounded-tl-none shadow-sm border border-outline-variant/10 text-on-surface font-body-md text-body-md leading-relaxed">
                {currentDialog.question_text}
              </div>
            </div>
          )}

          {/* User Answer (if already submitted in current dialog object, wait currentDialog doesn't store user answer in local state if it's evaluated, it moves to next. But if it's evaluated, it's already in dialogs array. Actually VerbaStore creates a new empty dialog when moving to next. So we only see current empty one. ) */}
          {/* Let's show active input here if not evaluated, or just rely on the sticky bottom input */}

          {/* AI Follow-up / Feedback (from previous if needed, but VerbaStore updates current dialog with score then creates next. We can show latestEvaluation here) */}
          
        </div>

        {/* Input Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-gutter bg-gradient-to-t from-surface-bright via-surface-bright to-transparent pt-12">
          <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-2xl shadow-[0px_8px_30px_rgba(0,0,0,0.1)] border border-outline-variant/20 p-2 flex items-center gap-2 relative">
            
            {isListening && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1" id="recording-indicator">
                <div className="px-3 py-1 bg-error-container text-on-error-container rounded-full font-label-sm text-label-sm flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> Идет запись...
                </div>
              </div>
            )}

            <input
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
              disabled={isEvaluating || isListening}
              className="flex-grow bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md px-4 outline-none"
              placeholder="Введите ответ или нажмите на микрофон..."
              type="text"
            />
            
            <button 
              onClick={handleSendAnswer}
              disabled={!answerInput.trim() || isEvaluating || isListening}
              className="p-3 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50" 
              title="Отправить"
            >
              {isEvaluating ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">send</span>
              )}
            </button>

            <button 
              onClick={isListening ? () => setIsListening(false) : startSpeechRecognition}
              className={`relative p-4 rounded-xl transition-all shadow-md group ${
                isListening ? 'bg-error text-on-error hover:bg-error/90' : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              {isListening && <div className="absolute inset-0 rounded-xl bg-error/20 pulse-ring block"></div>}
              <span className="material-symbols-outlined" data-weight="fill">{isListening ? 'mic_off' : 'mic'}</span>
            </button>
          </div>
          
          <div className="text-center mt-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant/60">Отвечайте голосом для имитации реального экзамена</span>
          </div>
        </div>
      </section>
    </div>
  );
};
