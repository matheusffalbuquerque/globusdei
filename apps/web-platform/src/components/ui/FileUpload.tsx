'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Upload, Loader2, CheckCircle2, X, ImageIcon } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { AppSession } from '../../lib/auth';

export type FileUploadProps = {
  session: AppSession;
  /** Contexto para organização no R2: "agent-photo", "agent-cover", etc. */
  context: string;
  /** PUBLIC ou PRIVATE */
  visibility?: 'PUBLIC' | 'PRIVATE';
  /** Tipos MIME aceitos (ex: "image/*") */
  accept?: string;
  /** Callback quando o upload é concluído */
  onUpload: (result: { fileId: string; publicUrl?: string; key: string }) => void;
  /** URL atual para preview */
  currentUrl?: string;
  /** Label do botão */
  label?: string;
  /** Estilo: avatar, banner, default, ou hidden (apenas input invisível) */
  variant?: 'avatar' | 'banner' | 'default' | 'hidden';
  /** ID customizado para o input (usado com variant=hidden) */
  inputId?: string;
};

export function FileUpload({
  session,
  context,
  visibility = 'PUBLIC',
  accept = 'image/*',
  onUpload,
  currentUrl,
  label = 'Enviar arquivo',
  variant = 'default',
  inputId,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<'idle' | 'requesting' | 'uploading' | 'confirming' | 'done'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Máximo: ${isImage ? '10MB' : '50MB'}`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 1. Solicitar signed upload URL ao backend
      setProgress('requesting');
      const uploadData = await apiFetch('/files/upload-url', {
        session,
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          visibility,
          context,
        }),
      });

      // 2. Upload direto para o R2 via signed URL
      setProgress('uploading');
      const putResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error('Falha ao enviar arquivo para o armazenamento.');
      }

      // 3. Confirmar upload no backend
      setProgress('confirming');
      await apiFetch(`/files/${uploadData.fileId}/confirm`, {
        session,
        method: 'POST',
      });

      // 4. Atualizar preview e notificar componente pai
      setProgress('done');
      if (isImage) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }

      onUpload({
        fileId: uploadData.fileId,
        publicUrl: uploadData.publicUrl,
        key: uploadData.key,
      });

      // Reset após 2s
      setTimeout(() => setProgress('idle'), 2000);
    } catch (err) {
      setError((err as Error).message || 'Erro ao fazer upload.');
      setProgress('idle');
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [session, context, visibility, onUpload]);

  const progressLabels = {
    idle: label,
    requesting: 'Preparando...',
    uploading: 'Enviando...',
    confirming: 'Finalizando...',
    done: 'Concluído!',
  };

  // Hidden variant — just the invisible input, parent controls visual
  if (variant === 'hidden') {
    return (
      <input id={inputId} ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
    );
  }

  // Avatar variant
  if (variant === 'avatar') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => inputRef.current?.click()}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          {progressLabels[progress]}
        </Button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className="space-y-2">
        <div
          className="relative w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => inputRef.current?.click()}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs font-medium">Clique para enviar uma imagem de capa</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {progress === 'done' && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Imagem enviada!</p>}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {progress === 'done' ? (
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
          ) : uploading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-1.5" />
          )}
          {progressLabels[progress]}
        </Button>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[200px]">
            Abrir arquivo
          </a>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {error}</p>}
    </div>
  );
}
