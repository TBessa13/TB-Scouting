import React from 'react';

interface FloatingCompareBarProps {
  selectedCount: number;
  onCompareClick: () => void;
  onClearClick: () => void;
}

export const FloatingCompareBar: React.FC<FloatingCompareBarProps> = ({
  selectedCount,
  onCompareClick,
  onClearClick,
}) => {
  if (selectedCount < 2) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg bg-[#141416]/95 backdrop-blur-md border-2 border-[#ff535b] p-3.5 rounded-full shadow-[0_0_30px_rgba(255,83,91,0.35)] flex items-center justify-between gap-3 animate-fade-in transition-all">
      <div className="flex items-center gap-3 pl-2">
        <div className="w-9 h-9 rounded-full bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#ff535b] text-[20px]">
            check_box
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-[#e5e2e3] flex items-center gap-1.5">
            <span className="font-mono-data text-sm text-[#ffb3b1] font-extrabold">
              {selectedCount}
            </span>
            <span>{selectedCount === 1 ? 'Jogador Selecionado' : 'Jogadores Selecionados'}</span>
          </span>
          <span className="text-[10px] text-[#e4bebc]">
            Pronto para comparação de métricas
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClearClick}
          className="text-xs font-bold text-[#e4bebc] hover:text-[#ff535b] px-2.5 py-1.5 rounded-full hover:bg-[#1C1C1F] transition-colors cursor-pointer"
        >
          Limpar
        </button>

        <button
          onClick={onCompareClick}
          className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
          <span>Comparar Jogadores</span>
        </button>
      </div>
    </div>
  );
};
