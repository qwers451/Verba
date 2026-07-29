'use client';

import React, { useState, useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { Mic, MicOff, Send, Sparkles, AlertTriangle, BookOpen, CheckCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const InterviewSimulator: React.FC = () => {
  const {
    activeSession,
    currentQuestionIdx,
    submitAnswer,
    isEvaluating,
    latestEvaluation,
    isVoiceModeActive,
    setVoiceModeActive,
  } = useVerbaStore();

  const [answerInput, setAnswerInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Initialize Speech Recognition if supported
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
      <div className="glass-card p-12 text-center text-gray-400">
        Нет активной сессии устного собеседования. Выберите материал в «Базе знаний» и нажмите «Начать устное собеседование».
      </div>
    );
  }

  const currentDialog = activeSession.dialogs[currentQuestionIdx];
  const totalQ = activeSession.total_questions;
  const qNum = currentDialog ? currentDialog.question_number : currentQuestionIdx + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Session Progress Header */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
            {activeSession.material_title}
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Тренировочное собеседование — Вопрос {qNum} из {totalQ}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-48 bg-gray-800 rounded-full h-3 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${(qNum / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentDialog && (
        <div className="glass-card p-8 rounded-2xl space-y-6 relative overflow-hidden border-indigo-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold">
                Q{qNum}
              </div>
              <h3 className="text-xl font-semibold text-white leading-relaxed">
                {currentDialog.question_text}
              </h3>
            </div>
          </div>

          {/* Referenced PDF pages */}
          {currentDialog.referenced_pages && currentDialog.referenced_pages.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Основано на материале:</span>
              {currentDialog.referenced_pages.map((p) => (
                <span key={p} className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-medium">
                  Стр. {p}
                </span>
              ))}
            </div>
          )}

          {/* Answer Input Area */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="block text-sm font-medium text-gray-300">
              Ваш устный / текстовый ответ:
            </label>

            <div className="relative">
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Дайте развернутый ответ своими словами..."
                rows={4}
                disabled={isEvaluating}
                className="w-full bg-gray-900/80 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all resize-none text-sm"
              />

              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-500/20 text-rose-400 text-xs px-3 py-1 rounded-full border border-rose-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Идет запись речи...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Mic STT Button */}
              <button
                type="button"
                onClick={startSpeechRecognition}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-gray-800/80 border-white/10 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                {isListening ? 'Остановить микрофон' : 'Ответить голосом (STT)'}
              </button>

              {/* Submit Button */}
              <button
                onClick={handleSendAnswer}
                disabled={!answerInput.trim() || isEvaluating}
                className="btn-primary flex items-center gap-2 py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Оценка LLM...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Отправить ответ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant Feedback Overlay / Results */}
          {currentDialog.score !== null && currentDialog.score !== undefined && (
            <div className="mt-6 p-6 rounded-xl bg-gray-900/90 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-white text-base">Оценка ответа LLM</h4>
                </div>
                <div
                  className={`text-sm font-extrabold px-3 py-1 rounded-lg border ${
                    currentDialog.score >= 80
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentDialog.score >= 60
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {currentDialog.score} / 100 баллов
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {currentDialog.feedback}
              </p>

              {currentDialog.missed_concepts && currentDialog.missed_concepts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Упущенные тезисы для повторения:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentDialog.missed_concepts.map((concept, idx) => (
                      <span key={idx} className="text-xs bg-rose-500/10 text-rose-300 px-2.5 py-1 rounded-md border border-rose-500/20">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
