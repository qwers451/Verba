'use client';

import React, { useRef, useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

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
    <>
      {/* Upload Section - Spans 4 cols on desktop */}
      <section 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="col-span-1 md:col-span-4 glass-card rounded-xl p-6 hover-lift flex flex-col justify-center items-center text-center bg-gradient-to-b from-surface-container-lowest to-surface-container-low border-dashed border-2 border-outline-variant hover:border-secondary transition-colors relative cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
          {isUploading ? (
            <span className="material-symbols-outlined text-[32px] animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[32px]">upload_file</span>
          )}
        </div>
        <h3 className="font-headline-md text-[18px] text-on-surface mb-2">
          {isUploading ? 'Загрузка и индексация...' : 'Загрузить новый материал'}
        </h3>
        <p className="font-body-md text-[14px] text-on-surface-variant mb-6">
          Загрузите конспект или лекцию (PDF) для генерации новых вопросов к экзамену.
        </p>
        
        {uploadError && (
          <div className="text-error text-xs mb-4 p-2 bg-error-container rounded">
            {uploadError}
          </div>
        )}

        <button 
          disabled={isUploading}
          className="w-full bg-secondary text-on-secondary rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-label-md text-label-md"
        >
          <span className="material-symbols-outlined">add</span>
          Выбрать файл
        </button>
      </section>

      {/* Recent Materials List - Spans 6 cols on desktop */}
      <section className="col-span-1 md:col-span-6 glass-card rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-[20px] text-on-surface">Мои материалы</h2>
          <span className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer">
            Все ({materials.length})
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          {materials.length === 0 ? (
            <div className="text-center text-on-surface-variant p-4 text-sm bg-surface-container-lowest rounded-lg border border-surface-container">
              Нет загруженных материалов.
            </div>
          ) : (
            materials.map((mat) => {
              const isSelected = selectedMaterial?.id === mat.id;
              return (
                <div key={mat.id} className="flex flex-col gap-2">
                  <div 
                    onClick={() => selectMaterial(mat)}
                    className={`flex items-center p-3 rounded-lg transition-colors group cursor-pointer border ${
                      isSelected ? 'bg-surface-container-low border-secondary shadow-sm' : 'bg-surface-container-lowest border-transparent hover:border-surface-container-high'
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-error-container text-on-error-container flex items-center justify-center mr-4 shrink-0">
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                        {mat.title}
                      </h4>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {mat.page_count} стр. • {mat.chunks_count} фрагментов
                      </p>
                    </div>
                    {isSelected ? (
                       <span className="material-symbols-outlined text-secondary">check_circle</span>
                    ) : (
                       <button className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="material-symbols-outlined">more_vert</span>
                       </button>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center justify-between p-3 bg-secondary-fixed rounded-lg border border-secondary-fixed-dim">
                       <span className="text-xs text-on-secondary-fixed font-medium">Выбран для аттестации</span>
                       <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startInterview(mat.id);
                          }}
                          disabled={isStartingInterview}
                          className="bg-primary text-on-primary rounded-lg py-2 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-label-sm text-label-sm shadow-sm"
                        >
                          {isStartingInterview ? (
                            <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          )}
                          Начать собеседование
                       </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};
