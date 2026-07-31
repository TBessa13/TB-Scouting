import React, { useState } from 'react';
import { Player, PlayerStatus, RatingSystem, getDisplayRating, getPlayerAge } from '../types';
import { StarRating } from './StarRating';
import { CategoryStarBadge } from './PlayerSlideOver';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';

interface KanbanBoardProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  onUpdateStatus: (playerId: string, status: PlayerStatus) => void;
  onAddNewTarget: () => void;
  selectedPlayerIdsForCompare?: string[];
  onToggleSelectForCompare?: (playerId: string) => void;
  ratingSystem?: RatingSystem;
}

interface ColumnDef {
  status: PlayerStatus;
  title: string;
  dotColor: string;
  topBarClass: string;
  accentClass: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'hire',
    title: 'Contratar',
    dotColor: 'bg-[#ff535b]',
    topBarClass: 'status-bar-hire',
    accentClass: 'text-[#ffb3b1]',
  },
  {
    status: 'track',
    title: 'Continuar a Acompanhar',
    dotColor: 'bg-[#98cdf2]',
    topBarClass: 'status-bar-track',
    accentClass: 'text-[#98cdf2]',
  },
  {
    status: 'squad',
    title: 'Opção de Plantel',
    dotColor: 'bg-[#c0c9be]',
    topBarClass: 'status-bar-squad',
    accentClass: 'text-[#c0c9be]',
  },
  {
    status: 'discard',
    title: 'Descartar',
    dotColor: 'bg-[#353436]',
    topBarClass: 'status-bar-discard',
    accentClass: 'text-[#e4bebc]',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  players,
  onPlayerClick,
  onUpdateStatus,
  onAddNewTarget,
  selectedPlayerIdsForCompare = [],
  onToggleSelectForCompare,
  ratingSystem = '20' as RatingSystem,
}) => {
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PlayerStatus | null>(null);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlayerId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: PlayerStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: PlayerStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedPlayerId;
    if (id) {
      onUpdateStatus(id, status);
    }
    setDraggedPlayerId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex-1 flex overflow-x-auto gap-6 pb-6 select-none scrollbar-thin">
      {COLUMNS.map((col) => {
        const colPlayers = players.filter((p) => p.status === col.status);
        const isTargeted = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex-shrink-0 w-[300px] flex flex-col gap-3 p-2 rounded-xl transition-colors ${
              isTargeted ? 'bg-[#201f20]/60 ring-2 ring-[#ff535b]/50' : ''
            }`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center px-1 mb-1">
              <h3 className="font-semibold text-base text-[#e5e2e3] flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                {col.title}
              </h3>
              <span className="font-mono-data text-xs text-[#e4bebc] bg-[#2a2a2b] px-2 py-0.5 rounded">
                {colPlayers.length}
              </span>
            </div>

            {/* Column Cards List */}
            <div className="flex flex-col gap-3 min-h-[350px]">
              {colPlayers.map((player) => {
                const isSelectedForCompare = selectedPlayerIdsForCompare.includes(player.id);

                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player.id)}
                    onClick={() => onPlayerClick(player)}
                    className={`kanban-card rounded-lg ${col.topBarClass} p-4 flex flex-col gap-3 cursor-pointer relative group transition-all active:scale-[0.98] ${
                      isSelectedForCompare ? 'ring-2 ring-[#ff535b] bg-[#1a1314]' : ''
                    } ${draggedPlayerId === player.id ? 'opacity-40' : 'opacity-100'}`}
                  >
                    {/* Top Left Selection Checkbox */}
                    {onToggleSelectForCompare && (
                      <div
                        className="absolute top-2.5 left-2.5 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => onToggleSelectForCompare(player.id)}
                          className="w-4 h-4 rounded border-[#353436] bg-[#0A0A0B] accent-[#ff535b] cursor-pointer"
                          title="Selecionar para comparação"
                        />
                      </div>
                    )}

                    {/* Card Header Row */}
                    <div className="flex gap-3 items-start pt-1">
                      <Avatar
                        name={player.name}
                        className="w-12 h-12 text-xs border border-[#353436] bg-[#0A0A0B] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-[#e5e2e3] leading-tight truncate">
                          {player.name}
                        </h4>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <div className="flex items-center gap-2">
                            <span className={`data-chip ${col.accentClass} px-1.5 py-0.5 rounded font-mono-data text-[10px] font-bold uppercase shrink-0`}>
                              {player.position}
                            </span>
                            <span className="text-[#e5e2e3] font-semibold text-xs truncate">{player.club}</span>
                          </div>
                          <span className="text-[#e4bebc]/70 text-[11px] font-normal truncate">
                            ({player.league || 'Liga Portugal'})
                          </span>
                        </div>
                      </div>

                    {/* Quick Move Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenCardMenuId(openCardMenuId === player.id ? null : player.id)}
                        className="text-[#e4bebc] hover:text-[#e5e2e3] p-1 rounded hover:bg-[#353436]"
                        title="Mover de lista"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {openCardMenuId === player.id && (
                        <div className="absolute right-0 top-7 z-30 bg-[#201f20] border border-[#5b403f] rounded-lg shadow-xl w-44 py-1 flex flex-col">
                          <span className="px-3 py-1 text-[10px] font-bold uppercase text-[#e4bebc]">Mover para:</span>
                          {COLUMNS.map((targetCol) => (
                            <button
                              key={targetCol.status}
                              onClick={() => {
                                onUpdateStatus(player.id, targetCol.status);
                                setOpenCardMenuId(null);
                              }}
                              className={`px-3 py-1.5 text-xs text-left hover:bg-[#353436] flex items-center gap-2 ${
                                player.status === targetCol.status ? 'text-[#ffb3b1] font-bold' : 'text-[#e5e2e3]'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${targetCol.dotColor}`} />
                              {targetCol.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Stats Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Idade / Altura</span>
                      <span className="font-mono-data text-[#e5e2e3]">
                        {getPlayerAge(player)}a / {(player.heightCm / 100).toFixed(2)}m
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]">Agente</span>
                      <span className="font-mono-data text-[#e5e2e3] truncate max-w-[110px]" title={player.agent}>
                        {player.agent || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Dominant Foot & Star Rating Badge */}
                  <div className="border-t border-[#26262B] pt-2.5 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#e4bebc] uppercase">Pé Dominante</span>
                      <div className="mt-0.5">
                        <FootIndicator foot={player.dominantFoot} showLabel />
                      </div>
                    </div>

                    <StarRating value={player.rating} size="xs" />
                  </div>
                </div>
              );
            })}

              {colPlayers.length === 0 && (
                <div className="border border-dashed border-[#353436] rounded-lg h-36 flex flex-col items-center justify-center p-4 text-center">
                  <span className="material-symbols-outlined text-[#e4bebc] text-[28px] mb-1">
                    inbox
                  </span>
                  <span className="text-xs text-[#e4bebc] italic">Nenhum jogador nesta lista</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
