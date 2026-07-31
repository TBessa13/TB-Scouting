import React, { useRef } from 'react';
import { AttachmentFile } from '../types';

export interface AttachmentsSectionProps {
  attachments: AttachmentFile[];
  onAddAttachments: (files: AttachmentFile[]) => void;
  onRemoveAttachment: (id: string) => void;
  onTriggerToast: (msg: string) => void;
  title?: string;
  readOnly?: boolean;
}

export const getFileIcon = (fileType: string, fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (fileType.includes('pdf') || ext === 'pdf') {
    return { icon: 'picture_as_pdf', color: 'text-[#ff535b]' };
  }
  if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    return { icon: 'image', color: 'text-[#81c784]' };
  }
  if (fileType.includes('word') || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return { icon: 'description', color: 'text-[#8abfe4]' };
  }
  if (fileType.includes('sheet') || fileType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: 'table_chart', color: 'text-[#ffd54f]' };
  }
  if (fileType.includes('video') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    return { icon: 'movie', color: 'text-[#ba68c8]' };
  }
  return { icon: 'attach_file', color: 'text-[#ffb3b1]' };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onTriggerToast,
  title = 'Relatórios & Anexos',
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newAttachments: AttachmentFile[] = Array.from(selectedFiles).map((file: File) => {
      const blobUrl = URL.createObjectURL(file);
      const today = new Date().toLocaleDateString('pt-PT');
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || 'application/octet-stream',
        url: blobUrl,
        uploadedAt: today,
      };
    });

    onAddAttachments(newAttachments);
    onTriggerToast(
      newAttachments.length === 1
        ? `Ficheiro "${newAttachments[0].name}" anexado com sucesso!`
        : `${newAttachments.length} ficheiros anexados com sucesso!`
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenOrDownload = (att: AttachmentFile) => {
    if (att.url) {
      window.open(att.url, '_blank');
      onTriggerToast(`A abrir/descarregar "${att.name}"...`);
    } else {
      onTriggerToast(`A simular download de "${att.name}"...`);
    }
  };

  const handleRemove = (id: string, name: string) => {
    onRemoveAttachment(id);
    onTriggerToast(`Ficheiro "${name}" removido dos anexos.`);
  };

  return (
    <div className="bg-[#1c1b1c] border border-[#353436] rounded-2xl p-5 flex flex-col gap-4">
      {/* Header with Title and Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#353436] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b]">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#e5e2e3]">{title}</h4>
            <p className="text-[11px] text-[#e4bebc]">
              Documentos táticos, relatórios em PDF, dados de vídeo e análises
            </p>
          </div>
        </div>

        {!readOnly && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#26262B] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow border border-[#353436] hover:border-[#ff535b]"
            >
              <span className="material-symbols-outlined text-[18px]">attach_file</span>
              <span>+ Anexar Relatório</span>
            </button>
          </div>
        )}
      </div>

      {/* File List */}
      {attachments.length === 0 ? (
        <div className="bg-[#141416] border border-dashed border-[#353436] rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-[#5b403f]">
            upload_file
          </span>
          <p className="text-xs font-bold text-[#e5e2e3]">Nenhum relatório ou anexo associado.</p>
          <p className="text-[11px] text-[#e4bebc]">
            Clique no botão "+ Anexar Relatório" para carregar documentos PDF ou análises em vídeo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => {
            const { icon, color } = getFileIcon(att.type, att.name);

            return (
              <div
                key={att.id}
                className="bg-[#141416] border border-[#353436] hover:border-[#5b403f] rounded-xl p-3 flex items-center justify-between gap-3 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-[#1c1b1c] border border-[#353436] flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined text-[22px] ${color}`}>
                      {icon}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#e5e2e3] truncate group-hover:text-[#ffb3b1] transition-colors">
                      {att.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[#e4bebc] font-mono-data mt-0.5">
                      <span>{att.size}</span>
                      <span>•</span>
                      <span>{att.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenOrDownload(att)}
                    className="w-8 h-8 rounded-lg bg-[#1c1b1c] hover:bg-[#ff535b]/20 hover:text-[#ffb3b1] text-[#e4bebc] border border-[#353436] flex items-center justify-center transition-all cursor-pointer"
                    title="Descarregar / Abrir Ficheiro"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemove(att.id, att.name)}
                      className="w-8 h-8 rounded-lg bg-[#1c1b1c] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white border border-[#353436] flex items-center justify-center transition-all cursor-pointer"
                      title="Eliminar Anexo"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
