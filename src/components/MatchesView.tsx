import React, { useState, useEffect } from 'react';
import { MatchReport, Player, AttachmentFile } from '../types';
import { AttachmentsSection } from './AttachmentsSection';
import { Avatar } from './Avatar';

interface MatchesViewProps {
  matches: MatchReport[];
  players: Player[];
  onPlayerClick: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  onOpenStadiumMode?: (match: MatchReport) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches: initialMatches,
  players,
  onPlayerClick,
  onTriggerToast,
  onOpenStadiumMode,
}) => {
  const [activeTab, setActiveTab] = useState<'agendados' | 'concluidos'>('agendados');
  const [matchesList, setMatchesList] = useState<MatchReport[]>(initialMatches);
  const [selectedMatch, setSelectedMatch] = useState<MatchReport | null>(null);

  useEffect(() => {
    setMatchesList(initialMatches);
  }, [initialMatches]);

  const scheduledMatches = matchesList.filter((m) => m.status !== 'concluido');
  const completedMatches = matchesList.filter((m) => m.status === 'concluido');

  const displayedMatches = activeTab === 'agendados' ? scheduledMatches : completedMatches;

  // Active match in modal synced with list
  const currentModalMatch = selectedMatch
    ? matchesList.find((m) => m.id === selectedMatch.id) || selectedMatch
    : null;

  const handleAddAttachments = (matchId: string, files: AttachmentFile[]) => {
    setMatchesList((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, attachments: [...(m.attachments || []), ...files] }
          : m
      )
    );
  };

  const handleRemoveAttachment = (matchId: string, attachmentId: string) => {
    setMatchesList((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              attachments: (m.attachments || []).filter((a) => a.id !== attachmentId),
            }
          : m
      )
    );
  };

  const handleUpdateStatus = (matchId: string, status: MatchReport['status']) => {
    setMatchesList((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status } : m))
    );
    onTriggerToast(`Estado do jogo atualizado para "${status.replace('_', ' ')}".`);
  };

  const handleAddSchedule = () => {
    const newMatch: MatchReport = {
      id: `m-${Date.now()}`,
      date: new Date().toISOString().split('T')[0] + ' - 20:00',
      competition: 'Liga Portugal Betclic',
      homeTeam: 'Equipa Casa',
      awayTeam: 'Equipa Fora',
      status: 'agendado',
      targetPlayerIds: players.slice(0, 1).map((p) => p.id),
      assignedScout: 'M. Ribeiro',
      venue: 'Estádio Principal',
      attachments: [],
    };
    setMatchesList((prev) => [newMatch, ...prev]);
    setSelectedMatch(newMatch);
    onTriggerToast('Novo agendamento de observação criado com sucesso!');
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 animate-fade-in pb-12">
      {/* Header with Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#e5e2e3] tracking-tight">Observação em Jogos</h2>
          <p className="text-sm text-[#e4bebc] mt-1">Agenda de Scouting ao Vivo e Histórico de Relatórios</p>
        </div>
        <button
          onClick={handleAddSchedule}
          className="bg-[#ff535b] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Agendar Observação</span>
        </button>
      </div>

      {/* Navigation Tabs (Agendados vs Concluídos) */}
      <div className="flex items-center gap-2 border-b border-[#26262B] pb-2">
        <button
          onClick={() => setActiveTab('agendados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'agendados'
              ? 'bg-[#2a2a2b] text-[#ff535b] border border-[#ff535b]/30 shadow-sm'
              : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1c1c1f]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>Agendados</span>
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full font-mono-data font-bold ${
              activeTab === 'agendados' ? 'bg-[#ff535b] text-white' : 'bg-[#1c1c1f] text-[#e4bebc]'
            }`}
          >
            {scheduledMatches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('concluidos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'concluidos'
              ? 'bg-[#2a2a2b] text-[#ff535b] border border-[#ff535b]/30 shadow-sm'
              : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1c1c1f]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">task_alt</span>
          <span>Concluídos</span>
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full font-mono-data font-bold ${
              activeTab === 'concluidos' ? 'bg-[#ff535b] text-white' : 'bg-[#1c1c1f] text-[#e4bebc]'
            }`}
          >
            {completedMatches.length}
          </span>
        </button>
      </div>

      {/* Grid of Match Cards */}
      {displayedMatches.length === 0 ? (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-4xl text-[#5b403f]">
            {activeTab === 'agendados' ? 'event_busy' : 'assignment_turned_in'}
          </span>
          <p className="text-sm font-bold text-[#e5e2e3]">
            {activeTab === 'agendados' ? 'Nenhum jogo agendado no momento.' : 'Nenhum relatório de jogo concluído.'}
          </p>
          <p className="text-xs text-[#e4bebc]">
            {activeTab === 'agendados'
              ? 'Utilize o botão "Agendar Observação" para adicionar novas partidas.'
              : 'Os relatórios finalizados de observação aparecerão neste histórico.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedMatches.map((m) => {
            const targetPlayers = players.filter((p) => m.targetPlayerIds.includes(p.id));
            const attachmentCount = m.attachments?.length || 0;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className="bg-[#141416] border border-[#26262B] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-[#ff535b]/50 transition-all cursor-pointer group shadow-md"
              >
                <div className="flex flex-col gap-2">
                  {/* Top line: Competition & Status & Attachment Badge */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] font-bold font-mono-data text-[#ffb3b1] uppercase truncate">
                      {m.competition}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {attachmentCount > 0 && (
                        <span className="text-[10px] font-bold font-mono-data bg-[#0b4e6e]/40 text-[#8abfe4] px-2 py-0.5 rounded border border-[#1b6287] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">attach_file</span>
                          <span>{attachmentCount}</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-data uppercase ${
                          m.status === 'concluido'
                            ? 'bg-[#203a2c] text-[#81c784] border border-[#2e5d41]'
                            : m.status === 'em_analise'
                            ? 'bg-[#0b4e6e] text-[#8abfe4]'
                            : 'bg-[#2a2a2b] text-[#e4bebc]'
                        }`}
                      >
                        {m.status === 'concluido'
                          ? 'Concluído'
                          : m.status === 'em_analise'
                          ? 'Em Análise'
                          : 'Agendado'}
                      </span>
                    </div>
                  </div>

                  {/* Teams & Score */}
                  <div className="text-base font-bold text-[#e5e2e3] my-0.5 flex items-center gap-1.5 flex-wrap group-hover:text-white transition-colors">
                    <span>{m.homeTeam}</span>
                    {m.score ? (
                      <span className="text-[#ff535b] font-mono-data bg-[#1c1c1f] px-2 py-0.5 rounded text-sm border border-[#26262B]">
                        {m.score}
                      </span>
                    ) : (
                      <span className="text-[#ff535b] font-mono-data text-xs px-0.5">vs</span>
                    )}
                    <span>{m.awayTeam}</span>
                  </div>

                  {/* Match Info: Date & Venue */}
                  <div className="flex flex-col gap-1 text-xs text-[#e4bebc]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb3b1]">event</span>
                      <span className="font-mono-data">{m.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#98cdf2]">stadium</span>
                      <span className="truncate">{m.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Targets & Action Footer */}
                <div className="border-t border-[#26262B] pt-2.5 mt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">
                      Alvos sob Observação:
                    </span>
                    {onOpenStadiumMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStadiumMode(m);
                        }}
                        className="bg-[#ff535b]/20 hover:bg-[#ff535b] text-[#ffb3b1] hover:text-white border border-[#ff535b]/40 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        title="Entrar em Modo Estádio (Zen Mode)"
                      >
                        <span className="material-symbols-outlined text-[13px]">stadium</span>
                        <span>Modo Estádio</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {targetPlayers.length === 0 ? (
                      <span className="text-xs text-[#e4bebc]/60 italic">Nenhum alvo associado</span>
                    ) : (
                      targetPlayers.map((tp) => (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayerClick(tp);
                          }}
                          className="flex items-center gap-2 p-1.5 bg-[#1C1C1F] border border-[#26262B] rounded-lg hover:border-[#ff535b] transition-all cursor-pointer"
                        >
                          <Avatar name={tp.name} className="w-7 h-7 text-[10px] shrink-0" />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-[#e5e2e3]">{tp.name}</span>
                            <span className="text-[10px] text-[#e4bebc]">{tp.position}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATCH DETAIL & ATTACHMENTS MODAL */}
      {currentModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#1c1b1c] border border-[#353436] w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#353436] pb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] shrink-0">
                  <span className="material-symbols-outlined text-2xl">sports_soccer</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono-data text-[#ffb3b1] uppercase">
                      {currentModalMatch.competition}
                    </span>
                    <span className="text-[#353436]">•</span>
                    <span className="text-xs text-[#e4bebc] font-mono-data">{currentModalMatch.date}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#e5e2e3] mt-0.5">
                    {currentModalMatch.homeTeam}{' '}
                    {currentModalMatch.score ? (
                      <span className="text-[#ff535b] font-mono-data mx-1">({currentModalMatch.score})</span>
                    ) : (
                      'vs'
                    )}{' '}
                    {currentModalMatch.awayTeam}
                  </h3>
                  <span className="text-xs text-[#e4bebc] mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#8abfe4]">stadium</span>
                    <span>{currentModalMatch.venue}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="w-9 h-9 rounded-xl bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer font-bold text-sm"
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
                    const targetM = currentModalMatch;
                    setSelectedMatch(null);
                    onOpenStadiumMode(targetM);
                  }}
                  className="bg-gradient-to-r from-[#ff535b] to-[#c92a32] hover:brightness-110 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">stadium</span>
                  <span>Entrar em Modo Estádio (Zen Mode)</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#e4bebc] uppercase tracking-wider hidden sm:inline">
                  Estado:
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(currentModalMatch.id, 'agendado')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    currentModalMatch.status === 'agendado'
                      ? 'bg-[#2a2a2b] text-[#e4bebc] border border-[#ff535b]'
                      : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                  }`}
                >
                  Agendado
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(currentModalMatch.id, 'em_analise')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    currentModalMatch.status === 'em_analise'
                      ? 'bg-[#0b4e6e] text-[#8abfe4] border border-[#1b6287]'
                      : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                  }`}
                >
                  Em Análise
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(currentModalMatch.id, 'concluido')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    currentModalMatch.status === 'concluido'
                      ? 'bg-[#203a2c] text-[#81c784] border border-[#2e5d41]'
                      : 'bg-[#1c1b1c] text-[#e4bebc]/60 hover:text-white'
                  }`}
                >
                  Concluído
                </button>
              </div>
            </div>

            {/* Targets Section */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider">
                Alvos Acompanhados nesta Partida
              </h4>
              <div className="flex flex-wrap gap-2">
                {players
                  .filter((p) => currentModalMatch.targetPlayerIds.includes(p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedMatch(null);
                        onPlayerClick(p);
                      }}
                      className="flex items-center gap-2.5 p-2 bg-[#141416] border border-[#353436] hover:border-[#ff535b] rounded-xl text-left transition-all cursor-pointer"
                    >
                      <Avatar name={p.name} className="w-8 h-8 text-xs shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#e5e2e3]">{p.name}</span>
                        <span className="text-[10px] text-[#e4bebc]">{p.position} • {p.club}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* RELATÓRIOS & ANEXOS DEDICATED SECTION */}
            <AttachmentsSection
              attachments={currentModalMatch.attachments || []}
              onAddAttachments={(files) => handleAddAttachments(currentModalMatch.id, files)}
              onRemoveAttachment={(attId) => handleRemoveAttachment(currentModalMatch.id, attId)}
              onTriggerToast={onTriggerToast}
              title="Relatórios & Anexos do Jogo"
            />

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-[#353436]">
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="bg-[#ff535b] hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
