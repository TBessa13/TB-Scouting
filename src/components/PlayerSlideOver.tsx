import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';
import {
  Player,
  PlayerStatus,
  RatingSystem,
  getDisplayRating,
  getCategoryDisplayRating,
  convertCategoryInputToBase20,
  getSystemMaxVal,
  getPlayerAge,
  AttachmentFile,
} from '../types';
import { updatePlayerPipelineStageInDb, updatePlayerGeneralNotesInDb } from '../lib/supabase';

export function getFormattedCurrentDate(): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

import { AttachmentsSection } from './AttachmentsSection';
import { StarRating } from './StarRating';
import { EditPlayerModal } from './EditPlayerModal';
import { ReportPdfSection } from './ReportPdfSection';

interface PlayerSlideOverProps {
  player: Player | null;
  squadPlayers?: Player[];
  allPlayers?: Player[];
  onClose: () => void;
  onUpdateStatus: (playerId: string, status: PlayerStatus) => void;
  onUpdatePlayer?: (updatedPlayer: Player) => void;
  onSelectPlayer?: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  ratingSystem?: RatingSystem;
}

export const CategoryStarBadge: React.FC<{ value: number | string }> = ({ value }) => {
  const isLarge = String(value).length >= 3;
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 w-8 h-8 group cursor-default"
      title={`Avaliação: ${value}`}
    >
      <svg
        className="w-8 h-8 text-[#ff535b] drop-shadow-[0_0_8px_rgba(255,83,91,0.4)] transition-transform duration-200 group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-extrabold text-[#1c1b1c] font-mono-data pointer-events-none select-none pt-0.5 ${isLarge ? 'text-[8.5px]' : 'text-[10px]'}`}>
        {value}
      </span>
    </div>
  );
};

export const PlayerSlideOver: React.FC<PlayerSlideOverProps> = ({
  player,
  squadPlayers,
  allPlayers,
  onClose,
  onUpdateStatus,
  onUpdatePlayer,
  onSelectPlayer,
  onTriggerToast,
  ratingSystem = '20' as RatingSystem,
}) => {
  const isSquadPlayer = player
    ? (squadPlayers?.some((p) => p.id === player.id) ||
       player.club === 'Plantel Principal' ||
       player.club === 'Plantel Atual')
    : false;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTmModalOpen, setIsTmModalOpen] = useState(false);
  const [tmInputUrl, setTmInputUrl] = useState('');
  const [generalNotesText, setGeneralNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (player) {
      setGeneralNotesText(player.generalNotes || '');
    }
  }, [player]);

  const handleSaveGeneralNotes = async () => {
    if (!player) return;
    setIsSavingNotes(true);
    const cleanedNotes = generalNotesText.trim();
    const updatedPlayer: Player = {
      ...player,
      generalNotes: cleanedNotes,
    };

    // Direct update to Supabase players table column general_notes
    await updatePlayerGeneralNotesInDb(player.id, cleanedNotes);

    if (onUpdatePlayer) {
      onUpdatePlayer(updatedPlayer);
    }
    setIsSavingNotes(false);
    onTriggerToast(`Apontamentos gerais de ${player.name} guardados com sucesso!`);
  };

  // ESC key listener to close panel
  useEffect(() => {
    if (!player) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, onClose]);

  if (!player) return null;

  const handleDownloadPdf = () => {
    if (player.reportPdfUrl) {
      window.open(player.reportPdfUrl, '_blank', 'noopener,noreferrer');
      onTriggerToast(`A abrir Relatório de Observação PDF de ${player.name}...`);
    } else {
      onTriggerToast(`Relatório PDF completo de ${player.name} descarregado com sucesso.`);
    }
  };

  const handleOpenWyscout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url =
      player.wyscoutUrl && player.wyscoutUrl.trim().length > 0
        ? player.wyscoutUrl
        : `https://wyscout.com`;
    onTriggerToast(`A abrir perfil no Wyscout de ${player.name}...`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTransfermarkt = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url =
      player.transfermarktUrl && player.transfermarktUrl.trim().length > 0
        ? player.transfermarktUrl
        : `https://www.transfermarkt.pt/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`;
    onTriggerToast(`A abrir perfil no Transfermarkt de ${player.name}...`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenZerozero = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url =
      player.zerozeroUrl && player.zerozeroUrl.trim().length > 0
        ? player.zerozeroUrl
        : `https://www.zerozero.pt/pesquisa?search_string=${encodeURIComponent(player.name)}`;
    onTriggerToast(`A abrir perfil no zerozero de ${player.name}...`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveTmUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUrl = tmInputUrl.trim();
    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        transfermarktUrl: updatedUrl,
      });
    }
    setIsTmModalOpen(false);
    if (updatedUrl) {
      onTriggerToast(`URL do Transfermarkt para ${player.name} guardado com sucesso!`);
    } else {
      onTriggerToast(`URL do Transfermarkt removido.`);
    }
  };

  const handleAddPlayerAttachments = (files: AttachmentFile[]) => {
    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        attachments: [...(player.attachments || []), ...files],
      });
    }
  };

  const handleRemovePlayerAttachment = (attachmentId: string) => {
    if (onUpdatePlayer) {
      onUpdatePlayer({
        ...player,
        attachments: (player.attachments || []).filter((a) => a.id !== attachmentId),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide Out Panel */}
      <div className="relative z-10 bg-[#201f20] w-full lg:w-[480px] h-full shadow-2xl flex flex-col border-l border-[#5b403f] overflow-hidden transform transition-transform duration-300">
        
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-12 h-1.5 bg-[#353436] rounded-full" />
        </div>

        {/* Header & Actions */}
        <div className="px-5 pt-4 pb-4 flex justify-between items-start border-b border-[#353436] bg-[#201f20]/95 backdrop-blur sticky top-0 z-20">
          <div className="flex gap-4 items-center">
            {/* Profile Avatar with Flag */}
            <div className="relative">
              <Avatar
                name={player.name}
                className="w-16 h-16 text-base border-2 border-[#ff535b] shadow-[0_0_15px_rgba(255,83,91,0.25)] shrink-0"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#131314] border border-[#ab8987] w-6 h-6 rounded-full flex items-center justify-center text-[11px] shadow z-10">
                {player.flag || '⚽'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#e5e2e3] tracking-tight">{player.name}</h2>
                <button
                  type="button"
                  onClick={handleOpenTransfermarkt}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-data font-bold bg-[#141416] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#ff535b] border border-[#353436] hover:border-[#ff535b]/60 transition-all duration-200 cursor-pointer shadow-sm group"
                  title={`Aceder ao perfil de ${player.name} no Transfermarkt`}
                >
                  <span>TM</span>
                  <span className="material-symbols-outlined text-[13px] text-[#e4bebc] group-hover:text-[#ff535b] transition-colors duration-200">
                    open_in_new
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenZerozero}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-data font-bold bg-[#141416] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#ff535b] border border-[#353436] hover:border-[#ff535b]/60 transition-all duration-200 cursor-pointer shadow-sm group"
                  title={`Aceder ao perfil de ${player.name} no zerozero`}
                >
                  <span>ZZ</span>
                  <span className="material-symbols-outlined text-[13px] text-[#e4bebc] group-hover:text-[#ff535b] transition-colors duration-200">
                    open_in_new
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWyscout}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-data font-bold bg-[#141416] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#ff535b] border border-[#353436] hover:border-[#ff535b]/60 transition-all duration-200 cursor-pointer shadow-sm group"
                  title={`Aceder ao perfil de ${player.name} no Wyscout`}
                >
                  <span>WY</span>
                  <span className="material-symbols-outlined text-[13px] text-[#e4bebc] group-hover:text-[#ff535b] transition-colors duration-200">
                    open_in_new
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#ff535b] text-[#5b000e] px-2 py-0.5 rounded text-xs font-bold border border-[#ab8987] shrink-0">
                  {player.position}
                </span>
                <div className="flex flex-col">
                  <span className="text-[#e5e2e3] font-semibold text-xs">{player.club}</span>
                  <span className="text-[#e4bebc]/70 text-[11px] font-normal">({player.league || 'Liga Portugal'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Action Buttons (Edit + Close) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b4e6e] hover:brightness-110 text-[#8abfe4] border border-[#0b4e6e] text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
              title="Editar dados e definições do atleta"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#353436] text-[#e4bebc] hover:text-[#e5e2e3] transition-colors"
              title="Fechar"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col gap-6 pb-24 scrollbar-thin">
          {/* Pipeline Stage Selector (Sinalizado / Em Análise / Analisado) */}
          <div className="flex flex-col gap-2 h-auto min-h-fit bg-[#131314] p-3.5 rounded-xl border border-[#353436]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-[#e4bebc] uppercase">Estado de Observação (Funil)</span>
              <span className="text-[10px] text-[#e4bebc]/60 font-mono-data">Supabase Live</span>
            </div>

            <div className="grid grid-cols-3 gap-2 h-auto min-h-fit">
              <button
                type="button"
                onClick={() => {
                  if (player) {
                    updatePlayerPipelineStageInDb(player.id, 'Sinalizado');
                    if (onUpdatePlayer) {
                      onUpdatePlayer({ ...player, pipelineStage: 'Sinalizado' });
                    }
                    onTriggerToast(`Estado do atleta "${player.name}" alterado para "Sinalizado".`);
                  }
                }}
                className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer ${
                  (player?.pipelineStage || 'Sinalizado') === 'Sinalizado'
                    ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#8abfe4] shadow ring-1 ring-[#8abfe4]'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#26262B]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#8abfe4]">bookmark</span>
                <span>Sinalizado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (player) {
                    updatePlayerPipelineStageInDb(player.id, 'Em Análise');
                    if (onUpdatePlayer) {
                      onUpdatePlayer({ ...player, pipelineStage: 'Em Análise' });
                    }
                    onTriggerToast(`Estado do atleta "${player.name}" alterado para "Em Análise".`);
                  }
                }}
                className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer ${
                  player?.pipelineStage === 'Em Análise'
                    ? 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b] shadow ring-1 ring-[#ff535b]'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#26262B]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">search</span>
                <span>Em Análise</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (player) {
                    updatePlayerPipelineStageInDb(player.id, 'Analisado');
                    if (onUpdatePlayer) {
                      onUpdatePlayer({ ...player, pipelineStage: 'Analisado' });
                    }
                    onTriggerToast(`Estado do atleta "${player.name}" alterado para "Analisado".`);
                  }
                }}
                className={`px-2 py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 border cursor-pointer ${
                  player?.pipelineStage === 'Analisado'
                    ? 'bg-[#4CAF50]/20 text-[#81C784] border-[#4CAF50] shadow ring-1 ring-[#4CAF50]'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#26262B]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#81C784]">check_circle</span>
                <span>Analisado</span>
              </button>
            </div>
          </div>

          {/* Status Selector Pills (Recomendação) */}
          <div className="flex flex-col gap-2 h-auto min-h-fit">
            <span className="text-xs font-bold tracking-wider text-[#e4bebc] uppercase">Recomendação</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-auto min-h-fit">
              <button
                onClick={() => onUpdateStatus(player.id, 'pending')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] cursor-pointer ${
                  player.status === 'pending' || !player.status
                    ? 'bg-[#71717a] text-white border-[#71717a] shadow'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#353436]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#a1a1aa] shrink-0" />
                <span>Por definir</span>
              </button>

              <button
                onClick={() => onUpdateStatus(player.id, 'hire')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] cursor-pointer ${
                  player.status === 'hire'
                    ? 'bg-[#ff535b] text-white border-[#ff535b] shadow'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#353436]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#E63946] shrink-0" />
                <span>Contratar</span>
              </button>

              <button
                onClick={() => onUpdateStatus(player.id, 'track')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] cursor-pointer ${
                  player.status === 'track'
                    ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#0b4e6e] shadow'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#353436]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#457B9D] shrink-0" />
                <span>Acompanhar</span>
              </button>

              <button
                onClick={() => onUpdateStatus(player.id, 'squad')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] cursor-pointer ${
                  player.status === 'squad'
                    ? 'bg-[#8a9389] text-[#242c24] border-[#8a9389] shadow'
                    : 'bg-[#1c1b1c] text-[#e5e2e3] border-[#353436] hover:bg-[#353436]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#8A9389] shrink-0" />
                <span>Opção Plantel</span>
              </button>

              <button
                onClick={() => onUpdateStatus(player.id, 'discard')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] cursor-pointer ${
                  player.status === 'discard'
                    ? 'bg-[#353436] text-white border-[#353436] shadow'
                    : 'bg-[#1c1b1c] text-[#e4bebc] border-[#353436] hover:bg-[#353436]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#353436] shrink-0" />
                <span>Descartar</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid (Bento Style) */}
          <section className="grid grid-cols-3 gap-2.5 h-auto min-h-fit">
            <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Idade</span>
              <span className="font-mono-data text-sm font-bold text-[#e5e2e3]">{getPlayerAge(player)} anos</span>
            </div>

            <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Altura</span>
              <span className="font-mono-data text-sm font-bold text-[#e5e2e3]">{player.heightCm} cm</span>
            </div>

            <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Pé</span>
              <FootIndicator foot={player.dominantFoot} showLabel />
            </div>

            <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Agente</span>
              <span className="font-mono-data text-sm font-bold text-[#e5e2e3] truncate max-w-[120px]" title={player.agent}>
                {player.agent || 'N/A'}
              </span>
            </div>

            <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
              <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Avaliação Global</span>
              <StarRating value={player.rating} size="sm" />
            </div>

            {isSquadPlayer && (
              <div className="bg-[#1c1b1c] border border-[#353436] rounded-lg p-3 flex flex-col items-center justify-center min-h-[64px]">
                <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider mb-1">Fim Contrato</span>
                <span className={`font-mono-data text-sm font-bold ${player.isContractExpiringSoon ? 'text-[#ff535b]' : 'text-[#e5e2e3]'}`}>
                  {player.contractEnd}
                </span>
              </div>
            )}
          </section>

          {/* Tactical Fit Indicator */}
          <section className="bg-[#131314] border border-[#353436] rounded-xl p-4 flex flex-col gap-2.5 relative h-auto min-h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0b4e6e] rounded-full blur-[50px] opacity-20 pointer-events-none" />
            <div className="flex justify-between items-end relative z-10">
              <span className="text-sm font-bold text-[#e5e2e3]">Adequação Tática</span>
              <span className="text-2xl font-bold font-mono-data text-[#c7e7ff]">
                {player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? `${player.tacticalFitPercent}%` : '-'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#353436] rounded-full overflow-hidden relative z-10 border border-[#353436]">
              <div
                className="h-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b] rounded-full shadow-[0_0_10px_rgba(152,205,242,0.4)]"
                style={{ width: `${player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? player.tacticalFitPercent : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#e4bebc] font-bold tracking-wider uppercase">
              <span>{player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? 'Baixa' : 'Pendente (-)'}</span>
              <span>{player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? 'Alta Prioridade' : 'Sem Avaliação'}</span>
            </div>
          </section>

          {/* Plataformas & Links Externos */}
          <section className="bg-[#141416] border border-[#26262B] rounded-xl p-3.5 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#26262B] pb-2">
              <span className="material-symbols-outlined text-[#ff535b] text-[18px]">link</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e5e2e3]">
                Plataformas & Acessos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="bg-[#0A0A0B] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">picture_as_pdf</span>
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWyscout}
                className="bg-[#0A0A0B] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] hover:text-[#ff535b] py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
                title={`Aceder ao perfil de ${player.name} no Wyscout`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">open_in_new</span>
                <span>Wyscout</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTransfermarkt}
                className="bg-[#0A0A0B] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] hover:text-[#ff535b] py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
                title={`Aceder ao perfil de ${player.name} no Transfermarkt`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">open_in_new</span>
                <span>Transfermarkt</span>
              </button>

              <button
                type="button"
                onClick={handleOpenZerozero}
                className="bg-[#0A0A0B] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] hover:text-[#ff535b] py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
                title={`Aceder ao perfil de ${player.name} no zerozero`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">open_in_new</span>
                <span>zerozero</span>
              </button>
            </div>
          </section>

          {/* Relatório de Observação (PDF) */}
          <ReportPdfSection
            pdfUrl={player.reportPdfUrl}
            pdfName={player.reportPdfName}
            readOnly={true}
            title="Relatório de Observação"
          />

          {/* Apontamentos Gerais (Campo de Texto Livre Global) */}
          <section className="flex flex-col gap-3 bg-[#141416] border border-[#26262B] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#26262B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center text-[#ff535b]">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-sm text-[#e5e2e3] uppercase tracking-wider">
                    Apontamentos Gerais
                  </h3>
                  <span className="text-[10px] text-[#e4bebc]/70">Campo livre para notas e contexto geral do atleta</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <textarea
                rows={5}
                value={generalNotesText}
                onChange={(e) => setGeneralNotesText(e.target.value)}
                placeholder="Escreva aqui os apontamentos gerais sobre o atleta..."
                className="w-full bg-[#0A0A0B] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] text-xs p-3.5 rounded-xl outline-none transition-colors leading-relaxed resize-y min-h-[110px] placeholder:text-[#e4bebc]/40 font-normal"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveGeneralNotes}
                  className="bg-[#ff535b] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingNotes ? 'A guardar...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Attachments Section */}
          <AttachmentsSection
            attachments={player.attachments || []}
            onAddAttachments={handleAddPlayerAttachments}
            onRemoveAttachment={handleRemovePlayerAttachment}
            onTriggerToast={onTriggerToast}
            title="Relatórios & Anexos do Jogador"
          />

          {/* Agent info */}
          <div className="p-3 bg-[#1c1b1c] border border-[#353436] rounded-lg flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#e4bebc] uppercase tracking-wider">Agente Representante</span>
              <span className="text-xs font-medium text-[#e5e2e3]">{player.agent}</span>
            </div>
            <span className="material-symbols-outlined text-[#ffb3b1] text-[20px]">badge</span>
          </div>

        </div>
      </div>

      {/* TRANSFERMARKT CONFIGURATION MODAL */}
      {isTmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#1c1b1c] border border-[#353436] w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#353436] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b]">
                  <span className="material-symbols-outlined text-[20px]">link</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#e5e2e3]">Link do Transfermarkt</h3>
                  <p className="text-xs text-[#e4bebc]">{player.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTmModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#e4bebc] leading-relaxed">
              Associe ou atualize o perfil oficial no Transfermarkt para <strong className="text-[#e5e2e3]">{player.name}</strong>.
            </p>

            {/* Direct Search Shortcut */}
            <a
              href={`https://www.transfermarkt.pt/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#141416] hover:bg-[#26262B] border border-[#353436] hover:border-[#ff535b]/60 text-[#e5e2e3] p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff535b] text-[18px]">search</span>
                <span>Pesquisar "{player.name}" no Transfermarkt.pt</span>
              </div>
              <span className="material-symbols-outlined text-xs text-[#e4bebc] group-hover:text-white">open_in_new</span>
            </a>

            {/* URL Form */}
            <form onSubmit={handleSaveTmUrl} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  URL do Perfil
                </label>
                <input
                  type="url"
                  value={tmInputUrl}
                  onChange={(e) => setTmInputUrl(e.target.value)}
                  placeholder="https://www.transfermarkt.pt/nome/profil/spieler/12345"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#ff535b] font-mono-data"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#353436]">
                <button
                  type="button"
                  onClick={() => setIsTmModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#26262B] text-[#e4bebc] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {isEditModalOpen && (
        <EditPlayerModal
          player={player}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSavePlayer={(updated) => {
            if (onUpdatePlayer) {
              onUpdatePlayer(updated);
            }
            onTriggerToast(`Ficha de ${updated.name} atualizada com sucesso!`);
          }}
        />
      )}
    </div>
  );
};
