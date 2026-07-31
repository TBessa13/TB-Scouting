import React, { useState } from 'react';

interface CreateShadowTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string) => void;
}

export const CreateShadowTeamModal: React.FC<CreateShadowTeamModalProps> = ({
  isOpen,
  onClose,
  onCreateTeam,
}) => {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) {
      setError('Por favor, introduza um nome válido para a Shadow Team.');
      return;
    }
    onCreateTeam(trimmed);
    setTeamName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-[#141416] border border-[#353436] w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#26262B] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shadow-[0_0_15px_rgba(255,83,91,0.2)]">
              <span className="material-symbols-outlined text-[#ff535b] text-[22px]">
                group_add
              </span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#e5e2e3]">
                Criar Nova Shadow Team
              </h3>
              <p className="text-xs text-[#e4bebc]">
                Estrutura o teu planeamento com um novo plantel isolado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1C1C1F] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#e4bebc] uppercase tracking-wider mb-2">
              Nome da Nova Shadow Team <span className="text-[#ff535b]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                if (error) setError('');
              }}
              placeholder="ex: Shadow Team 2026/27, Plantel Alternativo, Sub-23..."
              className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] rounded-xl px-4 py-3 text-sm text-[#e5e2e3] outline-none transition-all placeholder:text-[#353436]"
            />
            {error && <p className="text-xs text-[#ff535b] mt-1.5 font-semibold">{error}</p>}
          </div>

          <p className="text-xs text-[#e4bebc] leading-relaxed bg-[#1C1C1F] p-3 rounded-xl border border-[#26262B]">
            💡 <strong className="text-[#e5e2e3]">Nota:</strong> A nova Shadow Team iniciará completamente vazia e independente. Podes adicionar novos alvos e organizá-los na lista.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#26262B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1C1C1F] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#ff535b] hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Criar Shadow Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
