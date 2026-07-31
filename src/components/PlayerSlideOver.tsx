import React, { useState, useEffect, useMemo } from 'react';
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
  NoteEntry,
} from '../types';

export function getFormattedCurrentDate(): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}
import { AIReportModal } from './AIReportModal';
import { AttachmentsSection } from './AttachmentsSection';
import { StarRating } from './StarRating';

export interface SimilarMatch {
  player: Player;
  similarityPercent: number;
  matchedCriteriaCount: number;
  matchedCriteria: string[];
}

export function computeSimilarPlayers(
  targetPlayer: Player,
  globalList: Player[]
): SimilarMatch[] {
  const targetAge = getPlayerAge(targetPlayer);
  const targetRatingVal = targetPlayer.rating <= 5 ? targetPlayer.rating : targetPlayer.rating / 4;

  const results: SimilarMatch[] = [];

  for (const p of globalList) {
    if (p.id === targetPlayer.id) continue;

    const pAge = getPlayerAge(p);
    const pRatingVal = p.rating <= 5 ? p.rating : p.rating / 4;

    const samePosition = p.position === targetPlayer.position;
    const sameFoot = p.dominantFoot === targetPlayer.dominantFoot;
    const ageDiff = Math.abs(pAge - targetAge);
    const approxAge = ageDiff <= 3;
    const ratingDiff = Math.abs(pRatingVal - targetRatingVal);
    const similarRating = ratingDiff <= 1.0;

    let count = 0;
    const matched: string[] = [];

    if (samePosition) {
      count++;
      matched.push('Posição');
    }
    if (sameFoot) {
      count++;
      matched.push('Pé ' + p.dominantFoot);
    }
    if (approxAge) {
      count++;
      matched.push('Idade (~' + pAge + 'a)');
    }
    if (similarRating) {
      count++;
      matched.push('Rating (~' + Math.round(pRatingVal) + '★)');
    }

    // Must share at least 3 of 4 fundamental criteria
    if (count >= 3) {
      let rawScore = 0;
      rawScore += samePosition ? 35 : 10;
      rawScore += sameFoot ? 15 : 5;
      if (ratingDiff === 0) rawScore += 30;
      else if (ratingDiff <= 0.5) rawScore += 24;
      else rawScore += 18;

      if (ageDiff === 0) rawScore += 20;
      else if (ageDiff === 1) rawScore += 17;
      else if (ageDiff === 2) rawScore += 14;
      else rawScore += 10;

      const similarityPercent = Math.min(98, Math.max(76, Math.round(rawScore)));

      results.push({
        player: p,
        similarityPercent,
        matchedCriteriaCount: count,
        matchedCriteria: matched,
      });
    }
  }

  results.sort((a, b) => {
    if (b.similarityPercent !== a.similarityPercent) {
      return b.similarityPercent - a.similarityPercent;
    }
    return b.player.rating - a.player.rating;
  });

  return results.slice(0, 5);
}

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
  const [activeAccordion, setActiveAccordion] = useState<string | null>('tecnica');
  const [isAiReportOpen, setIsAiReportOpen] = useState(false);
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isTmModalOpen, setIsTmModalOpen] = useState(false);
  const [tmInputUrl, setTmInputUrl] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  // Helper to extract logbook history entries (newest first)
  const getPlayerHistoryNotes = (p: Player | null): NoteEntry[] => {
    if (!p) return [];
    if (p.notes?.history && Array.isArray(p.notes.history)) {
      return p.notes.history;
    }
    const fallback: NoteEntry[] = [];
    if (p.notes?.tatica) {
      fallback.push({
        id: 'init-tatica',
        date: '28 Jul 2026',
        text: `[Análise Tática] ${p.notes.tatica}`,
      });
    }
    if (p.notes?.tecnica) {
      fallback.push({
        id: 'init-tecnica',
        date: '15 Jul 2026',
        text: `[Análise Técnica] ${p.notes.tecnica}`,
      });
    }
    if (p.notes?.fisica) {
      fallback.push({
        id: 'init-fisica',
        date: '02 Jul 2026',
        text: `[Análise Física] ${p.notes.fisica}`,
      });
    }
    if (p.notes?.psicologica) {
      fallback.push({
        id: 'init-psicologica',
        date: '20 Jun 2026',
        text: `[Análise Atitudinal] ${p.notes.psicologica}`,
      });
    }
    return fallback;
  };

  const handleAddNote = () => {
    if (!player) return;
    if (!newNoteText.trim()) {
      onTriggerToast('Por favor introduza o texto da observação antes de adicionar.');
      return;
    }

    const currentEntries = getPlayerHistoryNotes(player);

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}`,
      date: getFormattedCurrentDate(),
      text: newNoteText.trim(),
    };

    // Newest entry first (ordenação decrescente)
    const updatedHistory = [newEntry, ...currentEntries];

    const updatedPlayer: Player = {
      ...player,
      notes: {
        ...player.notes,
        history: updatedHistory,
      },
    };

    if (onUpdatePlayer) {
      onUpdatePlayer(updatedPlayer);
    }

    setNewNoteText('');
    onTriggerToast(`Novo registo adicionado ao Diário de Bordo de ${player.name}!`);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!player) return;
    const currentEntries = getPlayerHistoryNotes(player);
    const updatedHistory = currentEntries.filter((n) => n.id !== noteId);

    const updatedPlayer: Player = {
      ...player,
      notes: {
        ...player.notes,
        history: updatedHistory,
      },
    };

    if (onUpdatePlayer) {
      onUpdatePlayer(updatedPlayer);
    }

    onTriggerToast('Registo removido do Diário de Bordo.');
  };

  const allPlayersList = useMemo(() => {
    if (allPlayers && allPlayers.length > 0) return allPlayers;
    return squadPlayers || [];
  }, [allPlayers, squadPlayers]);

  const similarMatches = useMemo(() => {
    if (!player) return [];
    return computeSimilarPlayers(player, allPlayersList);
  }, [player, allPlayersList]);

  // Edit states for notes & ratings
  const [tecnicaText, setTecnicaText] = useState('');
  const [taticaText, setTaticaText] = useState('');
  const [fisicaText, setFisicaText] = useState('');
  const [psicologicaText, setPsicologicaText] = useState('');

  const [tecnicaVal, setTecnicaVal] = useState<number>(16);
  const [taticaVal, setTaticaVal] = useState<number>(16);
  const [fisicaVal, setFisicaVal] = useState<number>(16);
  const [psicologicaVal, setPsicologicaVal] = useState<number>(16);

  useEffect(() => {
    if (player) {
      const defaultBase = player.rating * 4;
      setTecnicaText(player.notes.tecnica);
      setTaticaText(player.notes.tatica);
      setFisicaText(player.notes.fisica);
      setPsicologicaText(player.notes.psicologica);

      setTecnicaVal(getCategoryDisplayRating(player.notes.tecnicaRating, defaultBase, ratingSystem));
      setTaticaVal(getCategoryDisplayRating(player.notes.taticaRating, defaultBase, ratingSystem));
      setFisicaVal(getCategoryDisplayRating(player.notes.fisicaRating, defaultBase, ratingSystem));
      setPsicologicaVal(getCategoryDisplayRating(player.notes.psicologicaRating, defaultBase, ratingSystem));
      setIsEditingNotes(false);
    }
  }, [player, ratingSystem]);

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

  const defaultBaseRating = player.rating * 4;
  const tecnicaDisplay = getCategoryDisplayRating(player.notes.tecnicaRating, defaultBaseRating, ratingSystem);
  const taticaDisplay = getCategoryDisplayRating(player.notes.taticaRating, defaultBaseRating, ratingSystem);
  const fisicaDisplay = getCategoryDisplayRating(player.notes.fisicaRating, defaultBaseRating, ratingSystem);
  const psicologicaDisplay = getCategoryDisplayRating(player.notes.psicologicaRating, defaultBaseRating, ratingSystem);

  const maxScaleVal = getSystemMaxVal(ratingSystem);

  const toggleAccordion = (key: string) => {
    setActiveAccordion(prev => (prev === key ? null : key));
  };

  const handleSaveNotes = () => {
    const updatedPlayer: Player = {
      ...player,
      notes: {
        tecnica: tecnicaText,
        tatica: taticaText,
        fisica: fisicaText,
        psicologica: psicologicaText,
        tecnicaRating: convertCategoryInputToBase20(tecnicaVal, ratingSystem),
        taticaRating: convertCategoryInputToBase20(taticaVal, ratingSystem),
        fisicaRating: convertCategoryInputToBase20(fisicaVal, ratingSystem),
        psicologicaRating: convertCategoryInputToBase20(psicologicaVal, ratingSystem),
      },
    };

    if (onUpdatePlayer) {
      onUpdatePlayer(updatedPlayer);
    }
    setIsEditingNotes(false);
    onTriggerToast(`Relatório de observação e avaliações de ${player.name} atualizados com sucesso!`);
  };

  const handleDownloadPdf = () => {
    onTriggerToast(`Relatório PDF completo de ${player.name} descarregado com sucesso.`);
  };

  const handleOpenWyscout = () => {
    onTriggerToast(`A abrir plataforma Wyscout para observação de vídeo de ${player.name}...`);
    if (player.wyscoutUrl) {
      window.open(player.wyscoutUrl, '_blank');
    }
  };

  const handleOpenHudl = () => {
    onTriggerToast(`A carregar análise Hudl e dados telemétricos de ${player.name}...`);
    if (player.hudlUrl) {
      window.open(player.hudlUrl, '_blank');
    }
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

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#353436] text-[#e4bebc] hover:text-[#e5e2e3] transition-colors"
            title="Fechar"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col gap-6 pb-24 scrollbar-thin">
          {/* Status Selector Pills */}
          <div className="flex flex-col gap-2 h-auto min-h-fit">
            <span className="text-xs font-bold tracking-wider text-[#e4bebc] uppercase">Status de Acompanhamento</span>
            <div className="grid grid-cols-2 gap-2 h-auto min-h-fit">
              <button
                onClick={() => onUpdateStatus(player.id, 'hire')}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] ${
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
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] ${
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
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] ${
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
                className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border h-auto min-h-[38px] ${
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
                {player.tacticalFitPercent}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#353436] rounded-full overflow-hidden relative z-10 border border-[#353436]">
              <div
                className="h-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b] rounded-full shadow-[0_0_10px_rgba(152,205,242,0.4)]"
                style={{ width: `${player.tacticalFitPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#e4bebc] font-bold tracking-wider uppercase">
              <span>Baixa</span>
              <span>Alta Prioridade</span>
            </div>
          </section>

          {/* AI Executive Report Section (AI Report Generator) */}
          <section className="bg-gradient-to-br from-[#1C1C1F] to-[#131314] border border-[#ff535b]/60 rounded-xl p-4.5 flex flex-col gap-3.5 shadow-lg relative h-auto min-h-fit my-1">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#ff535b]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff535b] text-[20px]">
                  auto_awesome
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#e5e2e3]">
                  AI Executive Report
                </span>
              </div>
              <span className="text-[10px] font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] px-2 py-0.5 rounded font-bold border border-[#ff535b]/40">
                1-Page Summary
              </span>
            </div>

            <p className="text-[11px] text-[#e4bebc] leading-relaxed">
              Sintetiza automaticamente as notas técnicas, táticas, físicas e atitude do jogador num parecer executivo para a Direção Desportiva.
            </p>

            <button
              onClick={() => setIsAiReportOpen(true)}
              className="w-full bg-[#ff535b] hover:brightness-110 transition-all text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-[0.98] h-auto min-h-[42px]"
            >
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
              <span>Gerar Relatório Executivo (IA)</span>
            </button>

            <button
              onClick={() => {
                setIsSimilarModalOpen(true);
                onTriggerToast(`A analisar a base global para encontrar alternativas idênticas a ${player.name}...`);
              }}
              className="w-full bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] hover:text-[#ffb3b1] border border-[#353436] hover:border-[#ff535b]/60 transition-all text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer active:scale-[0.98] shadow-sm h-auto min-h-[40px]"
            >
              <span className="material-symbols-outlined text-[#ff535b] text-[18px]">
                psychology
              </span>
              <span>Procurar Semelhantes</span>
            </button>

            <div className="grid grid-cols-3 gap-2 mt-1 h-auto min-h-fit">
              <button
                onClick={handleDownloadPdf}
                className="bg-[#141416] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>PDF</span>
              </button>

              <button
                onClick={handleOpenWyscout}
                className="bg-[#141416] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
              >
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                <span>Wyscout</span>
              </button>

              <button
                onClick={handleOpenTransfermarkt}
                className="bg-[#141416] hover:bg-[#26262B] border border-[#26262B] text-[#e5e2e3] hover:text-[#ff535b] py-2 px-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-colors cursor-pointer h-auto min-h-[38px]"
                title={`Aceder ao perfil de ${player.name} no Transfermarkt`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  open_in_new
                </span>
                <span>Transfermarkt</span>
              </button>
            </div>
          </section>

          {/* Diário de Bordo (Notas de Observação em Linha do Tempo / Timeline) */}
          <section className="flex flex-col gap-4 bg-[#141416] border border-[#26262B] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#26262B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center text-[#ff535b]">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-sm text-[#e5e2e3] uppercase tracking-wider">
                    Diário de Bordo do Atleta
                  </h3>
                  <span className="text-[10px] text-[#e4bebc]/70">Análises tático-físicas e registos de campo</span>
                </div>
              </div>
              <span className="font-mono-data font-bold text-xs text-[#ffb3b1] bg-[#ff535b]/10 border border-[#ff535b]/30 px-2 py-0.5 rounded">
                {getPlayerHistoryNotes(player).length} {getPlayerHistoryNotes(player).length === 1 ? 'Registo' : 'Registos'}
              </span>
            </div>

            {/* Interface de Inserção de Registo */}
            <div className="flex flex-col gap-2.5 bg-[#0A0A0B] border border-[#26262B] p-3.5 rounded-xl">
              <label className="text-xs font-bold text-[#e5e2e3] uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">edit_note</span>
                <span>Nova Observação Tática / Física</span>
              </label>
              <textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escreva aqui a análise tática, desempenho físico ou impressão da última sessão..."
                className="w-full bg-[#141416] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] text-xs p-3 rounded-lg outline-none transition-colors leading-relaxed resize-none placeholder:text-[#e4bebc]/50"
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                <span className="text-[11px] text-[#e4bebc]/70 font-mono-data">
                  Data do registo: <strong className="text-[#ffb3b1]">{getFormattedCurrentDate()}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="w-full sm:w-auto bg-[#ff535b] hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">post_add</span>
                  <span>Adicionar Registo</span>
                </button>
              </div>
            </div>

            {/* Visualização em Linha do Tempo (Timeline) */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#ff535b]">timeline</span>
                Linha do Tempo de Observações
              </span>

              {getPlayerHistoryNotes(player).length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#353436] rounded-xl text-xs text-[#e4bebc]/70">
                  Nenhum registo de observação inserido.
                </div>
              ) : (
                <div className="relative pl-5 ml-2 border-l-2 border-[#26262B] flex flex-col gap-3.5">
                  {getPlayerHistoryNotes(player).map((entry, idx) => (
                    <div key={entry.id || idx} className="relative group">
                      {/* Node da timeline */}
                      <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#141416] border-2 border-[#ff535b] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff535b]" />
                      </div>

                      {/* Bloco da Observação */}
                      <div className="bg-[#0A0A0B] border border-[#26262B] hover:border-[#ff535b]/50 p-3.5 rounded-xl flex flex-col gap-2 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-data font-bold text-[#ffb3b1] bg-[#ff535b]/15 border border-[#ff535b]/30 px-2 py-0.5 rounded">
                            {entry.date}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#e4bebc]/60 hover:text-[#ff535b] transition-all text-xs flex items-center gap-1 p-0.5 cursor-pointer"
                            title="Remover registo"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>

                        <p className="text-xs text-[#e5e2e3] leading-relaxed whitespace-pre-wrap">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Observation History Timeline */}
          <section className="mt-2">
            <h3 className="text-sm font-bold text-[#e4bebc] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">history</span>
              Histórico de Observação
            </h3>
            <div className="relative pl-4 ml-2 border-l border-[#353436] flex flex-col gap-4">
              {player.timeline.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#ff535b] ring-4 ring-[#201f20]" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold font-mono-data text-[#e4bebc]">{event.date}</span>
                    <span className="text-sm font-medium text-[#e5e2e3]">{event.title}</span>
                    <span className="text-xs text-[#e4bebc] font-mono-data">
                      Scout: {event.scout} {event.rating && `(Nota: ${event.rating})`}
                    </span>
                  </div>
                </div>
              ))}
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

      {/* AI REPORT MODAL */}
      <AIReportModal
        player={player}
        isOpen={isAiReportOpen}
        onClose={() => setIsAiReportOpen(false)}
        onTriggerToast={onTriggerToast}
      />

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

      {/* MOTOR DE SIMILARIDADE PREDITIVA MODAL */}
      {isSimilarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141416] border border-[#353436] w-full max-w-xl rounded-2xl p-6 shadow-2xl flex flex-col gap-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#26262B] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] shadow-[0_0_12px_rgba(255,83,91,0.25)]">
                  <span className="material-symbols-outlined text-[22px]">psychology</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#e5e2e3]">Motor de Similaridade Preditiva</h3>
                    <span className="bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40 text-[10px] font-mono-data font-bold px-2 py-0.5 rounded">
                      Scouting IA
                    </span>
                  </div>
                  <p className="text-xs text-[#e4bebc] mt-0.5">
                    Alternativas no mercado com perfil idêntico a <strong className="text-white">{player.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimilarModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Specs Summary Banner */}
            <div className="bg-[#1c1b1c] border border-[#26262B] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-data text-[#e4bebc]">
              <div className="flex items-center gap-2">
                <span className="text-[#ff535b] font-bold">Análise Base:</span>
                <span className="bg-[#26262B] text-white px-2 py-0.5 rounded font-bold">{player.position}</span>
                <div className="flex items-center gap-1">
                  <span>• Pé:</span>
                  <FootIndicator foot={player.dominantFoot} />
                </div>
                <span>• {getPlayerAge(player)} anos</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#141416] px-2 py-0.5 rounded border border-[#353436]">
                <StarRating value={player.rating} size="xs" variant="single" />
              </div>
            </div>

            {/* Results List */}
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {similarMatches.length > 0 ? (
                similarMatches.map((match) => (
                  <div
                    key={match.player.id}
                    onClick={() => {
                      if (onSelectPlayer) {
                        onSelectPlayer(match.player);
                      } else if (onUpdatePlayer) {
                        onUpdatePlayer(match.player);
                      }
                      setIsSimilarModalOpen(false);
                      onTriggerToast(`Perfil de ${match.player.name} selecionado (${match.similarityPercent}% de similaridade).`);
                    }}
                    className="bg-[#0e0e0f] border border-[#26262B] hover:border-[#ff535b] rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all hover:bg-[#1f1e21] cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar
                          name={match.player.name}
                          className="w-12 h-12 text-xs border border-[#353436] group-hover:border-[#ff535b] transition-colors shrink-0"
                        />
                        <span className="absolute -bottom-1 -right-1 text-xs">
                          {match.player.flag || '⚽'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate transition-colors">
                            {match.player.name}
                          </span>
                          <span className="bg-[#ff535b]/20 text-[#ff535b] px-1.5 py-0.2 rounded text-[10px] font-bold border border-[#ff535b]/40">
                            {match.player.position}
                          </span>
                        </div>
                        <span className="text-xs text-[#e4bebc] font-mono-data truncate mt-0.5">
                          {getPlayerAge(match.player)} anos • {match.player.club || 'Sem Clube'} ({match.player.league || 'Liga Portugal'})
                        </span>

                        {/* Matched Criteria Badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {match.matchedCriteria.map((crit, idx) => (
                            <span
                              key={idx}
                              className="text-[9.5px] bg-[#1c1b1c] text-[#74c69d] border border-[#2d6a4f]/50 px-1.5 py-0.2 rounded font-mono-data"
                            >
                              ✓ {crit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Similarity % & Rating */}
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <div className="bg-[#ff535b]/15 text-[#ffb3b1] border border-[#ff535b]/40 px-2.5 py-1 rounded-full text-xs font-mono-data font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(255,83,91,0.2)]">
                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                        <span>{match.similarityPercent}%</span>
                      </div>
                      <div className="bg-[#18181A] px-2 py-0.5 rounded-md border border-[#26262B]">
                        <StarRating value={match.player.rating} size="xs" variant="single" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#e4bebc] bg-[#0e0e0f] rounded-xl border border-[#26262B]">
                  <span className="material-symbols-outlined text-[32px] text-[#ff535b]/60 mb-2">search_off</span>
                  <p className="text-xs font-medium">
                    Nenhum atleta na base cumpre simultaneamente 3 dos 4 critérios de similaridade para {player.name}.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#26262B]">
              <span className="text-[11px] text-[#e4bebc] italic">
                Cruzamento de dados baseado em {allPlayersList.length} atletas na base global.
              </span>
              <button
                type="button"
                onClick={() => setIsSimilarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#26262B] text-[#e4bebc] hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
