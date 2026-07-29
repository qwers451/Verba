'use client';

import React, { useRef, useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { FileUp, FileText, CheckCircle2, Play, AlertCircle, Loader2, Sparkles, Database } from 'lucide-react';

export const MaterialUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    materials,
    fetchMaterials,
    uploadPdf,
    isUploading,
    uploadError,
    selectedMaterial,
    selectMaterial,
    startInterview,
    isStartingInterview,
  } = useVerbaStore();

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadPdf(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadPdf(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Banner */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="glass-card glass-card-hover border-dashed border-2 border-indigo-500/30 p-8 rounded-2xl text-center cursor-pointer relative overflow-hidden group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            ) : (
              <FileUp className="w-8 h-8 text-indigo-400" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {isUploading ? 'Индексация материала и построение вектора...' : 'Перетащите PDF с учебным материалом'}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Загрузите конспект, учебник или лекцию в формате PDF. Система автоматически сформулирует вопросы и проведёт проверку знаний.
            </p>
          </div>

          {!isUploading && (
            <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Поддерживается автоматический RAG-чанкинг и метаданные страниц
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Загруженные учебные материалы ({materials.length})
          </h3>
        </div>

        {materials.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-sm">
            У вас пока нет загруженных материалов. Загрузите PDF-файл выше, чтобы начать подготовку.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((mat) => {
              const isSelected = selectedMaterial?.id === mat.id;
              return (
                <div
                  key={mat.id}
                  onClick={() => selectMaterial(mat)}
                  className={`glass-card p-5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base line-clamp-1">
                          {mat.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span>{mat.page_count} стр.</span>
                          <span>•</span>
                          <span>{mat.chunks_count} фрагментов</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Вектор готов
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-indigo-300 font-medium">Выбран для аттестации</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startInterview(mat.id);
                        }}
                        disabled={isStartingInterview}
                        className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
                      >
                        {isStartingInterview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Составление вопросов...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            Начать устное собеседование
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
