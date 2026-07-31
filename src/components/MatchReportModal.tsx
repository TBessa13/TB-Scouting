import React, { useEffect } from 'react';
import { MatchReport, Player, AttachmentFile } from '../types';
import { AttachmentsSection } from './AttachmentsSection';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';

interface MatchReportModalProps {
  match: MatchReport | null;
  onClose: () => void;
  players?: Player[];
  onPlayerClick?: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  onUpdateMatchStatus?: (matchId: string, status: MatchReport['status']) => void;
  onAddAttachments?: (matchId: string, files: AttachmentFile[]) => void;
  onRemoveAttachment?: (matchId: string, attachmentId: string) => void;
  onOpenStadiumMode?: (match: MatchReport) => void;
}

export const MatchReportModal: React.FC<MatchReportModalProps> = ({
  match,
  onClose,
  players = [],
  onPlayerClick,
  onTriggerToast,
  onUpdateMatchStatus,
  onAddAttachments,
  onRemoveAttachment,
  onOpenStadiumMode,
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    if (!match) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, onClose]);

  if (!match) return null;

  const targetPlayers = players.filter((p) => match.targetPlayerIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Centered Modal Card */}
      <div className="relative z-10 bg-[#1c1b1c] border border-[#353436] w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#353436] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] shrink-0">
              <span className="material-symbols-outlined text-2xl">sports_soccer</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono-data text-[#ffb3b1] uppercase">
                  {match.competition}
                </span>
                <span className="text-[#353436]">•</span>
                <span className="text-xs text-[#e4bebc] font-mono-data">{match.date}</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#e5e2e3] mt-0.5">
                {match.homeTeam}{' '}
                {match.score ? (
                  <span className="text-[#ff535b] font-mono-data mx-1">({match.score})</span>
                ) : (
                  'vs'
                )}{' '}
                {match.awayTeam}
              </h3>
              <span className="text-xs text-[#e4bebc] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#8abfe4]">stadium</span>
                <span>{match.venue || 'Estádio Principal'}</span>
                {match.assignedScout && (
                  <>
                    <span className="text-[#353436]">•</span>
                    <span>Scout: <strong>{match.assignedScout}</strong></span>
                  </>
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer font-bold text-sm shrink-0"
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Status Control Bar & Stadium Mode Launch */}
        <div className="bg-[#141416] p-3 rounded-xl border border-[#353436] flex flex-wrap items-center justify-between gap-3">
          {onOpenStadiumMode && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStadiumMode(match);
              }}
              className="bg-gradient-to-r from-[#ff535b] to-[#c92a32] hover:brightness-110 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">stadium</span>
              <span>Entrar em Modo Estádio (Zen Mode)</span>
            </button>
          )}

          {onUpdateMatchStatus && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#e4bebc] uppercase tracking-wider hidden sm:inline">
                Estado:
              </span>
              <button
                type="button"
                onClick={() => onUpdateMatchStatus(match.id, 'agendado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  match.status === 'agendado'
                    ? 'bg-[#2a2a2b] text-[#e4bebc] border border-[#ff535b]'
                    : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                }`}
              >
                Agendado
              </button>
              <button
                type="button"
                onClick={() => onUpdateMatchStatus(match.id, 'em_analise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  match.status === 'em_analise'
                    ? 'bg-[#0b4e6e] text-[#8abfe4] border border-[#1b6287]'
                    : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                }`}
              >
                Em Análise
              </button>
              <button
                type="button"
                onClick={() => onUpdateMatchStatus(match.id, 'concluido')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  match.status === 'concluido'
                    ? 'bg-[#203a2c] text-[#81c784] border border-[#2e5d41]'
                    : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                }`}
              >
                Concluído
              </button>
            </div>
          )}
        </div>

        {/* Targets Section */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider">
            Alvos Acompanhados nesta Partida ({targetPlayers.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {targetPlayers.length === 0 ? (
              <span className="text-xs text-[#e4bebc]/60 italic">Nenhum jogador associado diretamente</span>
            ) : (
              targetPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onPlayerClick) onPlayerClick(p);
                  }}
                  className="flex items-center gap-2.5 p-2 bg-[#141416] border border-[#353436] hover:border-[#ff535b] rounded-xl text-left transition-all cursor-pointer"
                >
                  <Avatar name={p.name} className="w-8 h-8 text-xs shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-[#e5e2e3]">{p.name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#e4bebc]">
                      <span>{p.position} • {p.club}</span>
                      <span className="text-[#353436]">•</span>
                      <StarRating value={p.rating} size="xs" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RELATÓRIOS & ANEXOS DEDICATED SECTION */}
        <AttachmentsSection
          attachments={match.attachments || []}
          onAddAttachments={(files) => onAddAttachments && onAddAttachments(match.id, files)}
          onRemoveAttachment={(attId) => onRemoveAttachment && onRemoveAttachment(match.id, attId)}
          onTriggerToast={onTriggerToast}
          title="Relatórios & Anexos do Jogo"
        />

        {/* Modal Actions */}
        <div className="flex justify-end pt-2 border-t border-[#353436]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#ff535b] hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
