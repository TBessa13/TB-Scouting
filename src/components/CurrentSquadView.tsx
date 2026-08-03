import React, { useState, useMemo } from 'react';
import { Player, PlayerStatus, FormationName, RatingSystem, getDisplayRating, getPlayerAge } from '../types';
import { AddSquadPlayerModal } from './AddSquadPlayerModal';
import { TacticalPitch } from './TacticalPitch';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';

const statusLabels: Record<PlayerStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Por definir', badgeClass: 'bg-[#71717a]/20 text-[#a1a1aa] border-[#71717a]/40' },
  hire: { label: 'Contratar', badgeClass: 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]/40' },
  track: { label: 'Acompanhar', badgeClass: 'bg-[#0b4e6e]/40 text-[#8abfe4] border-[#0b4e6e]' },
  squad: { label: 'Opção Plantel', badgeClass: 'bg-[#26262B] text-[#e4bebc] border-[#353436]' },
  discard: { label: 'Descartar', badgeClass: 'bg-red-950/40 text-red-400 border-red-900/40' },
};

interface CurrentSquadViewProps {
  squadPlayers: Player[];
  allGlobalPlayers?: Player[];
  onPlayerClick: (player: Player) => void;
  defaultFormation: FormationName;
  onFormationChange: (formation: FormationName) => void;
  ratingSystem?: RatingSystem;
  onTriggerToast?: (msg: string) => void;
  onAddPlayerToSquad?: (player: Player) => void;
  onRemovePlayerFromSquad?: (playerId: string) => void;
}

export const CurrentSquadView: React.FC<CurrentSquadViewProps> = ({
  squadPlayers,
  allGlobalPlayers = [],
  onPlayerClick,
  defaultFormation = '4-2-3-1',
  onFormationChange,
  ratingSystem = '20' as RatingSystem,
  onTriggerToast,
  onAddPlayerToSquad,
  onRemovePlayerFromSquad,
}) => {
  // Toggle view mode: 'list' (Gestão de Ativos) or 'tactical' (Relvado Interativo)
  const [viewMode, setViewMode] = useState<'list' | 'tactical'>('list');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  // Sorting for List view
  const [sortField, setSortField] = useState<'name' | 'age' | 'contract' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Tactical Pitch State
  const [formation, setFormation] = useState<FormationName>(defaultFormation);

  // Sync formation with prop
  React.useEffect(() => {
    setFormation(defaultFormation);
  }, [defaultFormation]);

  // List View Calculated Stats
  const totalSquadCount = squadPlayers.length;
  const avgAge = useMemo(() => {
    if (totalSquadCount === 0) return 0;
    const sum = squadPlayers.reduce((acc, p) => acc + getPlayerAge(p), 0);
    return (sum / totalSquadCount).toFixed(1);
  }, [squadPlayers, totalSquadCount]);

  const expiringContractsCount = useMemo(() => {
    return squadPlayers.filter((p) => p.isContractExpiringSoon).length;
  }, [squadPlayers]);

  // Sorted Squad Players for List View
  const sortedSquad = useMemo(() => {
    return [...squadPlayers].sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortField === 'contract') {
        valA = a.contractEnd;
        valB = b.contractEnd;
      } else if (sortField === 'age') {
        valA = getPlayerAge(a);
        valB = getPlayerAge(b);
      } else if (sortField === 'rating') {
        valA = a.rating <= 5 ? a.rating : a.rating / 4;
        valB = b.rating <= 5 ? b.rating : b.rating / 4;
      } else {
        valA = a.name;
        valB = b.name;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [squadPlayers, sortField, sortOrder]);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#1c1b1c] p-4 sm:p-5 rounded-2xl border border-[#353436]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#ff535b] text-[24px]">stadium</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#e5e2e3]">
              Gestão do Plantel Atual
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#e4bebc]">
            Supervisão de Ativos, Duração de Contratos e Configuração Tática da Equipa Principal.
          </p>
        </div>

        {/* Action Controls: Add Player + View Mode Toggle Switch */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Primary Action Button: ADICIONAR AO PLANTEL */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>ADICIONAR AO PLANTEL</span>
          </button>

          {/* View Mode Toggle Switch (Vista de Lista vs Vista Tática) */}
          <div className="flex items-center bg-[#0e0e0f] border border-[#353436] rounded-xl p-1 shrink-0 justify-center">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#ff535b] text-white shadow-lg'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1C1C1F]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
              <span>Vista de Lista (Ativos)</span>
            </button>

            <button
              onClick={() => setViewMode('tactical')}
              className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tactical'
                  ? 'bg-[#ff535b] text-white shadow-lg'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1C1C1F]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
              <span>Vista Tática (Relvado)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#1c1b1c] border border-[#353436] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0b4e6e]/40 border border-[#8abfe4]/30 flex items-center justify-center text-[#8abfe4]">
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Total Plantel</div>
            <div className="font-mono-data text-lg font-bold text-[#e5e2e3]">{totalSquadCount} Jogadores</div>
          </div>
        </div>

        <div className="bg-[#1c1b1c] border border-[#353436] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ff535b]/10 border border-[#ff535b]/30 flex items-center justify-center text-[#ffb3b1]">
            <span className="material-symbols-outlined text-[20px]">cake</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Média de Idades</div>
            <div className="font-mono-data text-lg font-bold text-[#e5e2e3]">{avgAge} Anos</div>
          </div>
        </div>

        <div
          onClick={() => setViewMode('list')}
          className={`bg-[#1c1b1c] border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
            expiringContractsCount > 0
              ? 'border-[#ff535b] bg-[#ff535b]/10 shadow-[0_0_15px_rgba(255,83,91,0.2)]'
              : 'border-[#353436]'
          }`}
          title="Contratos a expirar em < 12 meses"
        >
          <div className="w-10 h-10 rounded-lg bg-[#ff535b] text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ffb3b1]">
              Contratos &lt; 12 Meses
            </div>
            <div className="font-mono-data text-lg font-bold text-[#ff535b]">
              {expiringContractsCount} {expiringContractsCount === 1 ? 'Jogador' : 'Jogadores'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: VISTA DE LISTA (GESTÃO DE ATIVOS) */}
      {/* ========================================================= */}
      {viewMode === 'list' && (
        <div className="bg-[#1c1b1c] border border-[#353436] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#353436]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141416] text-[#e4bebc] uppercase font-mono-data tracking-wider border-b border-[#353436]">
                <tr>
                  <th className="py-4 px-6 font-bold">Jogador</th>
                  <th className="py-4 px-4 font-bold text-center">Posição</th>
                  <th className="py-4 px-4 font-bold text-center">Recomendação</th>
                  <th className="py-4 px-4 font-bold text-center cursor-pointer hover:text-white" onClick={() => { setSortField('age'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    Idade {sortField === 'age' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-4 font-bold text-center">Altura</th>
                  <th className="py-4 px-4 font-bold text-center">Pé</th>
                  <th className="py-4 px-6 font-bold text-center cursor-pointer hover:text-white" onClick={() => { setSortField('contract'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    Fim de Contrato {sortField === 'contract' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-2 font-bold text-center cursor-pointer hover:text-white w-16" onClick={() => { setSortField('rating'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                    Rating {sortField === 'rating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-6 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262B]">
                {sortedSquad.map((player) => {
                  const isExpiring = player.isContractExpiringSoon;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onPlayerClick(player)}
                      className="group cursor-pointer transition-colors hover:bg-[#26262B]/50"
                    >
                      {/* Player Avatar & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative shrink-0">
                            <Avatar
                              name={player.name}
                              className="w-11 h-11 text-xs border border-[#353436] group-hover:border-[#ff535b] transition-colors"
                            />
                            <span className="absolute -bottom-1 -right-1 text-[11px] bg-[#0A0A0B] rounded-full px-0.5 border border-[#353436]">
                              {player.flag}
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors text-sm truncate">
                                {player.name}
                              </span>
                            </div>
                            <span className="text-xs text-[#e5e2e3] font-semibold truncate mt-0.5">
                              {player.club}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position Code */}
                      <td className="py-4 px-4 text-center">
                        <span className="bg-[#0e0e0f] text-[#ffb3b1] border border-[#ff535b]/40 font-mono-data font-bold text-xs px-2.5 py-1 rounded">
                          {player.position}
                        </span>
                      </td>

                      {/* Recomendação */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {(() => {
                          const info = statusLabels[player.status] || statusLabels.pending;
                          return (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${info.badgeClass}`}>
                              {info.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Age */}
                      <td className="py-4 px-4 text-center font-mono-data text-[#e5e2e3] font-semibold text-sm">
                        {getPlayerAge(player)} anos
                      </td>

                      {/* Altura */}
                      <td className="py-4 px-4 text-center font-mono-data text-[#e5e2e3] font-semibold text-xs">
                        {player.heightCm ? `${player.heightCm} cm` : '-'}
                      </td>

                      {/* Pé */}
                      <td className="py-4 px-4 text-center">
                        <FootIndicator foot={player.dominantFoot} />
                      </td>

                      {/* Contract End (RED HIGHLIGHT for < 12 months) */}
                      <td className="py-4 px-6 text-center">
                        {isExpiring ? (
                          <div className="inline-flex items-center gap-1 bg-[#ff535b]/20 border border-[#ff535b] text-[#ff535b] font-bold px-3 py-1 rounded-lg font-mono-data text-xs animate-pulse">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            <span>{player.contractEnd} (&lt;12m)</span>
                          </div>
                        ) : (
                          <span className="font-mono-data text-[#e4bebc] text-xs font-semibold">
                            {player.contractEnd}
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-2 text-center whitespace-nowrap w-16">
                        <div className="inline-flex items-center justify-center bg-[#18181A] px-2 py-0.5 rounded-md border border-[#26262B]">
                          <StarRating value={player.rating} size="xs" variant="single" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onPlayerClick(player)}
                            className="px-3 py-1.5 bg-[#26262B] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Ver Perfil
                          </button>

                          <a
                            href={player.transfermarktUrl || `https://www.transfermarkt.pt/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1.5 bg-[#1A2836] hover:bg-[#253A4E] text-[#8abfe4] hover:text-white rounded-lg text-[10px] font-bold border border-[#8abfe4]/30 transition-all cursor-pointer flex items-center gap-1"
                            title="Abrir perfil no Transfermarkt"
                          >
                            <span className="font-extrabold text-[10px]">TM</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </a>

                          <button
                            onClick={() => setPlayerToRemove(player)}
                            className="p-1.5 bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Remover do Plantel Atual"
                          >
                            <span className="material-symbols-outlined text-[16px] block">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedSquad.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#e4bebc]">
                      Nenhum jogador no Plantel Atual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: VISTA TÁTICA (RELVADO INTERATIVO + MATRIZ DE PROFUNDIDADE) */}
      {/* ========================================================= */}
      {viewMode === 'tactical' && (
        <TacticalPitch
          players={squadPlayers}
          squadPlayers={squadPlayers}
          onPlayerClick={onPlayerClick}
          defaultFormation={formation}
          onFormationChange={onFormationChange}
          ratingSystem={ratingSystem}
        />
      )}

      {/* Add Squad Player Modal */}
      <AddSquadPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        allGlobalPlayers={allGlobalPlayers}
        squadPlayers={squadPlayers}
        onAddExistingPlayer={(player) => {
          if (onAddPlayerToSquad) onAddPlayerToSquad(player);
        }}
        onCreateNewPlayer={(newPlayer) => {
          if (onAddPlayerToSquad) onAddPlayerToSquad(newPlayer);
        }}
        ratingSystem={ratingSystem}
      />

      {/* Confirm Removal Modal (Data Protection) */}
      {playerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1c1b1c] border border-[#353436] w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-[#353436] pb-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] shrink-0">
                <span className="material-symbols-outlined text-[22px]">person_remove</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-[#e5e2e3]">Remover do Plantel Atual</h3>
                <p className="text-xs text-[#e4bebc]">Confirmação de alteração de estado</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#141416] p-3 rounded-xl border border-[#353436]">
              <Avatar
                name={playerToRemove.name}
                className="w-11 h-11 text-xs border border-[#353436]"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-[#e5e2e3] truncate">{playerToRemove.name}</div>
                <div className="text-xs text-[#e4bebc]">{playerToRemove.position} • {playerToRemove.club}</div>
              </div>
            </div>

            <p className="text-xs text-[#e4bebc] leading-relaxed">
              Tem a certeza que pretende remover <strong className="text-white">{playerToRemove.name}</strong> do Plantel Atual?
            </p>

            <div className="p-3 bg-[#0e0e0f] rounded-xl border border-[#353436] text-[11px] text-[#e4bebc] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#8abfe4] text-[16px] shrink-0 mt-0.5">info</span>
              <span>
                Esta ação remove o atleta do plantel ativo. O registo do jogador e os seus relatórios continuarão guardados e seguros na <strong>Base de Dados Global</strong>.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#353436]">
              <button
                type="button"
                onClick={() => setPlayerToRemove(null)}
                className="px-4 py-2 rounded-xl bg-[#26262B] hover:bg-[#353436] text-[#e4bebc] hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemovePlayerFromSquad) {
                    onRemovePlayerFromSquad(playerToRemove.id);
                  }
                  setPlayerToRemove(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Remover do Plantel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
