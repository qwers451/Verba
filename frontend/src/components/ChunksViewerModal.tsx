import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ChunksViewerModalProps {
  materialId: string;
  materialTitle: string;
  onClose: () => void;
}

export function ChunksViewerModal({ materialId, materialTitle, onClose }: ChunksViewerModalProps) {
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChunks = async () => {
      try {
        setLoading(true);
        const data = await api.getMaterialChunks(materialId);
        setChunks(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchChunks();
  }, [materialId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-surface-container-highest">
          <div>
            <h2 className="font-headline-sm text-on-surface">Извлеченные данные</h2>
            <p className="font-body-sm text-on-surface-variant mt-1">{materialTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px] mb-4">progress_activity</span>
              <p>Загрузка данных...</p>
            </div>
          )}

          {error && (
            <div className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && chunks.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">data_alert</span>
              <p>Для этого материала нет извлеченного текста.</p>
            </div>
          )}

          {!loading && !error && chunks.length > 0 && (
            <div className="flex flex-col gap-6">
              {chunks.map((chunk, index) => (
                <div key={chunk.id || index} className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
                  <div className="bg-surface-container-lowest px-4 py-3 border-b border-outline-variant/30 flex justify-between items-center">
                    <span className="font-label-md text-primary bg-primary/10 px-2 py-1 rounded">Чанк {index + 1}</span>
                    <span className="font-label-sm text-on-surface-variant">Стр. {chunk.page_number}</span>
                  </div>
                  
                  <div className="p-4">
                    {chunk.keywords && chunk.keywords.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {chunk.keywords.map((kw: string, i: number) => (
                          <span key={i} className="text-xs bg-secondary-container/50 text-on-secondary-container px-2 py-1 rounded-full border border-secondary/20">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-wrap font-body-md bg-surface-container-lowest p-4 rounded-lg border border-surface-container-highest">
                      {chunk.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
