'use client';

import React from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { MaterialUploader } from '@/components/MaterialUploader';
import { api } from '@/lib/api';
import { ChunksViewerModal } from '@/components/ChunksViewerModal';
import { useRouter } from 'next/navigation';

export function MaterialsTab() {
  const { materials, deleteMaterial, startInterview, isStartingInterview } = useVerbaStore();
  const [viewingChunksFor, setViewingChunksFor] = React.useState<{id: string, title: string} | null>(null);
  const router = useRouter();

  const handleStartInterview = async (materialId: string) => {
    const sessionId = await startInterview(materialId);
    if (sessionId) {
      router.push('/interview');
    }
  };

  const handleViewPdf = async (materialId: string) => {
    try {
      const blob = await api.getMaterialPdfBlob(materialId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (e: any) {
      console.error('Error viewing PDF', e);
      alert('Не удалось открыть PDF файл. ' + (e.response?.data?.detail || ''));
    }
  };

  const handleDelete = async (materialId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот материал? Это действие нельзя отменить.')) {
      await deleteMaterial(materialId);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-container-max mx-auto h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-headline-md text-[24px] text-on-surface">Мои материалы</h2>
        <span className="font-label-sm text-label-sm bg-surface-container-high text-primary px-3 py-1 rounded-full">
          {materials.length} загружено
        </span>
      </div>

      {/* Upload New Material Section */}
      <div className="w-full mb-6">
         <MaterialUploader />
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.length === 0 ? (
          <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">description</span>
            <p className="font-body-lg">У вас пока нет загруженных материалов.</p>
            <p className="font-body-md mt-2">Загрузите PDF-файл выше, чтобы начать подготовку.</p>
          </div>
        ) : (
          materials.map((material) => (
            <div key={material.id} className="glass-card rounded-xl p-5 hover-lift flex flex-col relative group border border-outline-variant/20">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface line-clamp-2" title={material.title}>
                      {material.title}
                    </h3>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      {material.page_count} стр. • {(material.file_size_bytes / (1024 * 1024)).toFixed(2)} МБ
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(material.id)}
                  className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 shrink-0 rounded-full hover:bg-error/10"
                  title="Удалить"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-surface-container-highest">
                <button 
                  onClick={() => handleViewPdf(material.id)}
                  className="w-full py-2.5 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                  Просмотреть PDF
                </button>

                <button 
                  onClick={() => setViewingChunksFor({ id: material.id, title: material.title })}
                  className="w-full py-2.5 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">data_object</span>
                  Извлеченный текст
                </button>
                
                <button 
                  onClick={() => handleStartInterview(material.id)}
                  disabled={isStartingInterview}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary font-label-md transition-colors flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  {isStartingInterview ? 'Загрузка...' : 'Начать экзамен'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingChunksFor && (
        <ChunksViewerModal 
          materialId={viewingChunksFor.id} 
          materialTitle={viewingChunksFor.title} 
          onClose={() => setViewingChunksFor(null)} 
        />
      )}
    </div>
  );
}
