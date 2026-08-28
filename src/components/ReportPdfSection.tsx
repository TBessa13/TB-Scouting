import React, { useRef } from 'react';

interface ReportPdfSectionProps {
  pdfUrl?: string;
  pdfName?: string;
  onChange?: (url: string | undefined, name: string | undefined) => void;
  readOnly?: boolean;
  title?: string;
  className?: string;
}

export const ReportPdfSection: React.FC<ReportPdfSectionProps> = ({
  pdfUrl,
  pdfName,
  onChange,
  readOnly = false,
  title = 'Relatório de Observação',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um ficheiro em formato PDF (.pdf).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (onChange) {
        onChange(dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (newUrl: string) => {
    if (!onChange) return;
    const trimmed = newUrl.trim();
    if (!trimmed) {
      onChange(undefined, undefined);
    } else {
      const derivedName = pdfName && pdfName !== 'Relatorio_Observacao.pdf' ? pdfName : 'Relatorio_Observacao.pdf';
      onChange(trimmed, derivedName);
    }
  };

  const handleRemove = () => {
    if (onChange) {
      onChange(undefined, undefined);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = pdfName || 'Relatorio_Observacao.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // If in read-only / display mode (like in Player Profile or Match Profile)
  if (readOnly) {
    if (!pdfUrl) {
      return (
        <div className={`p-4 bg-[#141416] border border-[#26262B] rounded-2xl flex flex-col gap-2 ${className}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-[#e4bebc] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px] text-[#ff535b]">picture_as_pdf</span>
            <span>{title}</span>
          </div>
          <div className="p-4 border border-dashed border-[#353436] rounded-xl text-center text-xs text-[#e4bebc]/60">
            Nenhum relatório de observação em PDF associado.
          </div>
        </div>
      );
    }

    return (
      <div className={`p-4.5 bg-[#141416] border border-[#ff535b]/40 rounded-2xl flex flex-col gap-3 shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center text-[#ff535b]">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#e5e2e3] uppercase tracking-wider">{title}</h4>
              <p className="text-[11px] text-[#e4bebc] font-mono-data truncate max-w-[220px] sm:max-w-sm">
                {pdfName || 'Relatorio_Observacao.pdf'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono-data bg-[#ff535b]/15 text-[#ffb3b1] px-2 py-0.5 rounded border border-[#ff535b]/30">
            PDF
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={handleOpenPdf}
            className="w-full bg-[#ff535b] hover:brightness-110 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Abrir PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] hover:text-[#ff535b] border border-[#353436] font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Descarregar</span>
          </button>
        </div>
      </div>
    );
  }

  // Edit / Form Mode
  return (
    <div className={`flex flex-col gap-3 bg-[#131314] p-4 rounded-xl border border-[#26262B] ${className}`}>
      <div className="flex items-center justify-between border-b border-[#26262B] pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ff535b] text-[18px]">picture_as_pdf</span>
          <label className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider">{title}</label>
        </div>
        {pdfUrl && (
          <span className="text-[10px] font-bold text-[#4CAF50] bg-[#4CAF50]/15 px-2 py-0.5 rounded border border-[#4CAF50]/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            PDF Anexado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Upload File Option */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#e4bebc] uppercase">Anexar Ficheiro (.PDF)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
            id={`report-pdf-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`report-pdf-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-dashed border-[#353436] hover:border-[#ff535b] text-[#e5e2e3] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-[#ff535b]">upload_file</span>
            <span>{pdfName ? 'Substituir Ficheiro PDF' : 'Carregar Ficheiro PDF do Computador'}</span>
          </label>
        </div>

        {/* Cloud Link Option */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#e4bebc] uppercase">Ou Link Direto na Cloud (Google Drive, Dropbox, etc.)</label>
          <input
            type="url"
            value={pdfUrl?.startsWith('data:') ? '' : (pdfUrl || '')}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://drive.google.com/... ou URL do PDF"
            className="w-full rounded-xl bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-xs font-mono-data focus:border-[#ff535b] outline-none"
          />
        </div>
      </div>

      {/* Attached file status banner */}
      {pdfUrl && (
        <div className="flex items-center justify-between bg-[#1C1C1F] border border-[#353436] p-2.5 rounded-lg mt-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined text-[#ff535b] text-[18px] shrink-0">description</span>
            <span className="text-xs font-bold text-[#e5e2e3] truncate max-w-[240px] sm:max-w-md font-mono-data">
              {pdfName || (pdfUrl.startsWith('data:') ? 'Ficheiro_PDF_Anexado.pdf' : pdfUrl)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenPdf}
              className="px-2 py-1 bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Pré-visualizar PDF"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              <span>Ver</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-[#e4bebc] hover:text-[#ff535b] rounded transition-colors cursor-pointer"
              title="Remover PDF"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
