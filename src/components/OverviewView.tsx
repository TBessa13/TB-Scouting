import React from 'react';
import { Player, MatchReport, MainView } from '../types';
import { Avatar } from './Avatar';

interface OverviewViewProps {
  squadPlayers: Player[];
  globalPlayers: Player[];
  matches: MatchReport[];
  onNavigate: (view: MainView) => void;
  onPlayerClick: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  squadPlayers = [],
  globalPlayers = [],
  matches = [],
  onNavigate,
  onPlayerClick,
  onTriggerToast,
}) => {
  // Active Pipeline Funnel Players
  const sinalizadosPlayers = globalPlayers.filter(
    (p) => p.pipelineStage === 'Sinalizado' || (!p.pipelineStage && p.status === 'track')
  );

  const emAnalisePlayers = globalPlayers.filter(
    (p) => p.pipelineStage === 'Em Análise' || (!p.pipelineStage && p.status === 'hire')
  );

  const upcomingMatches = matches.slice(0, 3);
  const recentPlayers = globalPlayers.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 animate-fade-in text-[#e5e2e3]">
      {/* 1. BOAS-VINDAS & AÇÕES RÁPIDAS (HEADER CARD TOPO) */}
      <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#ff535b]/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Welcome Text & Club Meta */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30 font-mono-data text-[11px] font-bold uppercase tracking-wider">
                Painel de Controlo
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#e5e2e3]">
              Visão Geral do Departamento
            </h1>

            <p className="text-xs sm:text-sm text-[#e4bebc] max-w-2xl leading-relaxed">
              Resumo executivo do plantel atual, funil de trabalho ativo, agenda de observações e atividade recente do departamento de prospeção.
            </p>

            {/* Quick Metrics Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-2 pt-3 border-t border-[#26262B]">
              <div className="flex items-center gap-2 bg-[#0A0A0B] border border-[#26262B] px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[#ff535b] text-[18px]">stadium</span>
                <span className="text-xs text-[#e4bebc]">Plantel Principal:</span>
                <span className="font-mono-data font-bold text-xs text-[#e5e2e3]">{squadPlayers.length} Atletas</span>
              </div>

              <div className="flex items-center gap-2 bg-[#0A0A0B] border border-[#26262B] px-3 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[#8abfe4] text-[18px]">badge</span>
                <span className="text-xs text-[#e4bebc]">Base Prospeção:</span>
                <span className="font-mono-data font-bold text-xs text-[#e5e2e3]">{globalPlayers.length} Atletas</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Header */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0 justify-start">
            <button
              onClick={() => onNavigate('wizard')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#ff535b] hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,83,91,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Adicionar Alvo</span>
            </button>

            <button
              onClick={() => {
                onNavigate('matches');
                onTriggerToast('A carregar gestão de jogos.');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] border border-[#26262B] hover:border-[#ff535b]/50 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[#ff535b] text-[18px]">sports_soccer</span>
              <span>Novo Relatório de Jogo</span>
            </button>

            <button
              onClick={() => {
                onNavigate('contacts');
                onTriggerToast('A carregar a rede de contactos.');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] border border-[#26262B] hover:border-[#8abfe4]/50 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[#8abfe4] text-[18px]">person_book</span>
              <span>Adicionar Contacto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 & 3. MAIN WIDGETS GRID (AGENDA ESQUERDA + ALERTAS DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WIDGET DE AGENDA */}
        <div className="lg:col-span-5 bg-[#141416] border border-[#26262B] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#26262B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0b4e6e]/30 border border-[#0b4e6e] flex items-center justify-center text-[#8abfe4]">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-extrabold text-sm text-[#e5e2e3] uppercase tracking-wider">
                    Jogos & Observações
                  </h2>
                  <span className="text-[10px] text-[#e4bebc]/70">Jogos e compromissos agendados</span>
                </div>
              </div>

              <span className="text-[10px] font-mono-data font-bold bg-[#0b4e6e]/40 text-[#8abfe4] border border-[#0b4e6e] px-2 py-0.5 rounded">
                {upcomingMatches.length} Registos
              </span>
            </div>

            {/* List of Scheduled Matches */}
            <div className="flex flex-col gap-3">
              {upcomingMatches.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[#26262B] rounded-xl text-xs text-[#e4bebc]/60">
                  Nenhum jogo ou observação agendada no momento.
                </div>
              ) : (
                upcomingMatches.map((m) => (
                  <div
                    key={m.id}
                    className="bg-[#0A0A0B] border border-[#26262B] hover:border-[#8abfe4]/50 rounded-xl p-3 flex flex-col gap-2 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono-data font-bold px-2 py-0.5 rounded uppercase border bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]/40">
                        {m.status}
                      </span>
                      <span className="text-[10px] font-mono-data text-[#8abfe4] font-bold">
                        {m.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#8abfe4] transition-colors leading-snug">
                      {m.homeTeam} vs {m.awayTeam} ({m.competition})
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-[#e4bebc]/80 pt-1 border-t border-[#1C1C1F]">
                      <span className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[12px] text-[#ff535b]">location_on</span>
                        <span className="truncate">{m.venue || 'Estádio Principal'}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#26262B] flex items-center justify-between">
            <span className="text-[11px] text-[#e4bebc]/70">Sincronizado com o Supabase</span>
            <button
              onClick={() => onNavigate('matches')}
              className="text-xs font-bold text-[#8abfe4] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Lista Completa</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* WIDGET DE FUNIL DE TRABALHO ATIVO */}
        <div className="lg:col-span-7 bg-[#141416] border border-[#26262B] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#26262B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center text-[#ff535b]">
                  <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-extrabold text-sm text-[#e5e2e3] uppercase tracking-wider">
                    Jogadores para observar
                  </h2>
                  <span className="text-[10px] text-[#e4bebc]/70">Atletas em fase de Sinalização e Análise ativa</span>
                </div>
              </div>

              <span className="text-[10px] font-mono-data font-bold bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40 px-2.5 py-0.5 rounded">
                {sinalizadosPlayers.length + emAnalisePlayers.length} Atletas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SECÇÃO 1: SINALIZADOS */}
              <div className="bg-[#0A0A0B] border border-[#26262B] rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#1C1C1F] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8abfe4]" />
                    <span className="text-xs font-bold text-[#e5e2e3] uppercase tracking-wider">Sinalizados</span>
                  </div>
                  <span className="font-mono-data font-bold text-[11px] text-[#8abfe4] bg-[#0b4e6e]/30 px-2 py-0.5 rounded border border-[#0b4e6e]">
                    {sinalizadosPlayers.length}
                  </span>
                </div>

                {sinalizadosPlayers.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-[#26262B] rounded-lg text-xs text-[#e4bebc]/70 my-auto">
                    Nenhum jogador em fase de sinalização.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
                    {sinalizadosPlayers.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => onPlayerClick(player)}
                        className="bg-[#141416] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#8abfe4]/60 rounded-lg p-2.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            name={player.name}
                            className="w-8 h-8 text-[11px] border border-[#26262B] group-hover:border-[#8abfe4] shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#8abfe4] truncate">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-[#e4bebc]/70 truncate">
                              {player.position} • {player.club}
                            </span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-[16px] text-[#8abfe4] group-hover:translate-x-0.5 transition-transform shrink-0">
                          arrow_forward
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECÇÃO 2: EM ANÁLISE */}
              <div className="bg-[#0A0A0B] border border-[#26262B] rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#1C1C1F] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff535b]" />
                    <span className="text-xs font-bold text-[#e5e2e3] uppercase tracking-wider">Em Análise</span>
                  </div>
                  <span className="font-mono-data font-bold text-[11px] text-[#ffb3b1] bg-[#ff535b]/20 px-2 py-0.5 rounded border border-[#ff535b]/40">
                    {emAnalisePlayers.length}
                  </span>
                </div>

                {emAnalisePlayers.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-[#26262B] rounded-lg text-xs text-[#e4bebc]/70 my-auto">
                    Nenhum jogador em fase de análise.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
                    {emAnalisePlayers.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => onPlayerClick(player)}
                        className="bg-[#141416] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#ff535b]/60 rounded-lg p-2.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            name={player.name}
                            className="w-8 h-8 text-[11px] border border-[#26262B] group-hover:border-[#ff535b] shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-[#e4bebc]/70 truncate">
                              {player.position} • {player.club}
                            </span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-[16px] text-[#ff535b] group-hover:translate-x-0.5 transition-transform shrink-0">
                          arrow_forward
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#26262B] flex items-center justify-between">
            <span className="text-[11px] text-[#e4bebc]/70">Pipeline de scouting em tempo real</span>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs font-bold text-[#ffb3b1] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Quadro de Prospeção</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. WIDGET DE ATIVIDADE RECENTE */}
      <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#26262B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#353436] border border-[#5b403f] flex items-center justify-center text-[#ffb3b1]">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-extrabold text-sm text-[#e5e2e3] uppercase tracking-wider">
                Atividade Recente
              </h2>
              <span className="text-[10px] text-[#e4bebc]/70">Últimos perfis acedidos</span>
            </div>
          </div>

          <span className="text-[10px] font-mono-data font-bold text-[#e4bebc] bg-[#0A0A0B] border border-[#26262B] px-2.5 py-1 rounded">
            {recentPlayers.length} Registo(s)
          </span>
        </div>

        {recentPlayers.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#26262B] rounded-xl text-xs text-[#e4bebc]/60">
            Nenhuma atividade recente registada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => onPlayerClick(player)}
                className="bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#ff535b]/50 p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={player.name} className="w-9 h-9 text-xs border border-[#26262B]" />
                  <div className="flex flex-col">
                    <h3 className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors">
                      {player.name}
                    </h3>
                    <span className="text-[10px] text-[#e4bebc]/70">
                      {player.position} • {player.club}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[16px] text-[#8abfe4] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
