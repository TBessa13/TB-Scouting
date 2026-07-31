import React from 'react';
import { Player, getPlayerAge } from '../types';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';

interface PlayerComparisonModalProps {
  isOpen: boolean;
  selectedPlayers: Player[];
  allPlayers: Player[];
  onClose: () => void;
  onRemovePlayer: (playerId: string) => void;
  onAddPlayer: (player: Player) => void;
  onPlayerClick: (player: Player) => void;
  onClearAll: () => void;
}

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  isOpen,
  selectedPlayers,
  allPlayers,
  onClose,
  onRemovePlayer,
  onAddPlayer,
  onPlayerClick,
  onClearAll,
}) => {
  if (!isOpen) return null;

  // Players not yet selected that can be added to compare
  const unselectedPlayers = allPlayers.filter(
    (p) => !selectedPlayers.some((sp) => sp.id === p.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* 1. TOP HEADER BAR */}
      <div className="p-4 md:p-6 bg-[#0e0e0f] border-b border-[#26262B] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shadow-[0_0_15px_rgba(255,83,91,0.3)]">
            <span className="material-symbols-outlined text-[#ff535b] text-[22px]">
              compare_arrows
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#e5e2e3]">
                Comparação Múltipla de Jogadores
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono-data font-bold bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40">
                {selectedPlayers.length} {selectedPlayers.length === 1 ? 'Jogador' : 'Jogadores'}
              </span>
            </div>
            <p className="text-xs text-[#e4bebc] mt-0.5">
              Análise cruzada de métricas táticas, físicas e financeiras alinhadas horizontalmente
            </p>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Add player dropdown */}
          {unselectedPlayers.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const target = allPlayers.find((p) => p.id === e.target.value);
                  if (target) {
                    onAddPlayer(target);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] border border-[#353436] text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-[#ff535b]"
              >
                <option value="" disabled>
                  + Adicionar Jogador à Comparação
                </option>
                {unselectedPlayers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#141416] text-[#e5e2e3]">
                    {p.name} ({p.position} - {p.club} {p.league ? `(${p.league})` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClearAll}
            className="text-xs text-[#e4bebc] hover:text-[#ff535b] font-bold px-3 py-2 rounded-xl hover:bg-[#1C1C1F] transition-colors cursor-pointer"
          >
            Limpar Todos
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#1C1C1F] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white border border-[#353436] flex items-center justify-center transition-all cursor-pointer shadow"
            title="Fechar Comparação"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* 2. COMPARISON MAIN SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-6 scrollbar-thin">
        {selectedPlayers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
            <span className="material-symbols-outlined text-4xl text-[#e4bebc]">
              group_off
            </span>
            <p className="text-base text-[#e5e2e3] font-bold">
              Nenhum jogador selecionado para comparação.
            </p>
            <p className="text-xs text-[#e4bebc] max-w-md">
              Seleciona pelo menos 2 jogadores na Tabela ou no Quadro para comparar os seus perfis em tempo real.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 min-w-max pb-8 items-start">
            {selectedPlayers.map((player) => (
              <div
                key={player.id}
                className="w-[320px] flex-shrink-0 bg-[#141416] border border-[#26262B] hover:border-[#ff535b]/60 rounded-2xl p-5 flex flex-col shadow-2xl transition-all relative group"
              >
                {/* 1. COLUMN REMOVE BUTTON */}
                <div className="h-8 flex justify-between items-center border-b border-[#26262B] pb-2 mb-3">
                  <span className="text-[10px] font-mono-data uppercase font-bold text-[#e4bebc] tracking-wider">
                    Perfil #{player.id}
                  </span>
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#e4bebc] hover:text-[#ff535b] bg-[#1C1C1F] hover:bg-[#ff535b]/10 px-2.5 py-1 rounded-lg border border-[#26262B] hover:border-[#ff535b]/40 transition-colors cursor-pointer"
                    title="Remover este jogador"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    <span>Remover</span>
                  </button>
                </div>

                {/* 2. CABEÇALHO (Fotografia, Nome, Posição e Clube Atual) */}
                <div className="h-[170px] flex flex-col justify-center items-center text-center p-3 bg-[#0e0e0f] rounded-xl border border-[#26262B] mb-4 relative overflow-hidden">
                  <div className="relative mb-2">
                    <Avatar
                      name={player.name}
                      className="w-16 h-16 text-sm border-2 border-[#ff535b] shadow-md shrink-0"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm bg-[#141416] p-0.5 rounded border border-[#26262B]">
                      {player.flag}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#e5e2e3] leading-tight line-clamp-1">
                    {player.name}
                  </h3>
                  <div className="flex flex-col items-center justify-center gap-0.5 mt-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40">
                        {player.position}
                      </span>
                      <span className="text-xs text-[#e5e2e3] font-semibold truncate max-w-[140px]">
                        {player.club}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#e4bebc]/70 font-normal truncate max-w-[180px]">
                      ({player.league || 'Liga Portugal'})
                    </span>
                    <div className="mt-1 bg-[#1c1b1c] px-2 py-0.5 rounded-lg border border-[#353436]">
                      <StarRating value={player.rating} size="xs" />
                    </div>
                  </div>
                </div>

                {/* 3. BLOCOS RÁPIDOS (Idade, Altura, Pé Preferencial) */}
                <div className="h-[80px] grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#1C1C1F] border border-[#26262B] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-[#e4bebc] tracking-wider mb-0.5">
                      Idade
                    </span>
                    <span className="font-mono-data text-xs font-bold text-[#e5e2e3]">
                      {getPlayerAge(player)} anos
                    </span>
                  </div>

                  <div className="bg-[#1C1C1F] border border-[#26262B] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-[#e4bebc] tracking-wider mb-0.5">
                      Altura
                    </span>
                    <span className="font-mono-data text-xs font-bold text-[#e5e2e3]">
                      {player.heightCm} cm
                    </span>
                  </div>

                  <div className="bg-[#1C1C1F] border border-[#26262B] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-bold text-[#e4bebc] tracking-wider mb-0.5">
                      Pé
                    </span>
                    <div className="mt-0.5">
                      <FootIndicator foot={player.dominantFoot} showLabel />
                    </div>
                  </div>
                </div>

                {/* 4. BLOCO CONTRATUAL & AGENTE (Fim de Contrato e Agente) */}
                <div className="h-[80px] grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#1C1C1F] border border-[#26262B] rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-[#e4bebc] tracking-wider mb-0.5">
                      Fim de Contrato
                    </span>
                    <span
                      className={`font-mono-data text-xs font-bold ${
                        player.isContractExpiringSoon ? 'text-[#ff535b]' : 'text-[#e5e2e3]'
                      }`}
                    >
                      {player.contractEnd}
                    </span>
                  </div>

                  <div className="bg-[#1C1C1F] border border-[#26262B] rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-[#e4bebc] tracking-wider mb-0.5">
                      Agente
                    </span>
                    <span className="font-mono-data text-xs font-bold text-[#e5e2e3] truncate" title={player.agent}>
                      {player.agent || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* 5. INDICADOR CHAVE ('Adequação Tática') */}
                <div className="h-[88px] bg-[#131314] border border-[#353436] rounded-xl p-3 flex flex-col justify-center gap-2 mb-4 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#e5e2e3]">
                      Adequação Tática
                    </span>
                    <span className="font-mono-data font-extrabold text-sm text-[#ffb3b1]">
                      {player.tacticalFitPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1C1C1F] h-3 rounded-full overflow-hidden border border-[#26262B]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b] shadow-[0_0_8px_rgba(255,83,91,0.5)]"
                      style={{ width: `${player.tacticalFitPercent}%` }}
                    />
                  </div>
                </div>

                {/* 6. NOTAS DE OBSERVAÇÃO TÁTICAS & TÉCNICAS */}
                <div className="bg-[#0e0e0f] border border-[#26262B] rounded-xl p-3.5 flex flex-col gap-2.5 mb-4">
                  <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#ffb3b1]">
                    Notas de Observação Tática
                  </span>
                  <p className="text-xs text-[#e4bebc] leading-relaxed line-clamp-3 italic">
                    "{player.notes.tatica}"
                  </p>
                  <div className="border-t border-[#26262B] pt-2 mt-1 flex flex-col gap-1 text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-[#8abfe4]">
                      Técnica: <span className="font-normal text-[#e4bebc]">{player.notes.tecnica}</span>
                    </span>
                  </div>
                </div>

                {/* 7. BOTÃO DE AÇÃO */}
                <button
                  onClick={() => onPlayerClick(player)}
                  className="mt-auto w-full bg-[#1C1C1F] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white border border-[#26262B] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Ver Perfil Completo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="p-4 bg-[#0e0e0f] border-t border-[#26262B] flex justify-between items-center shrink-0">
        <span className="text-xs text-[#e4bebc] font-medium">
          Dica: Podes adicionar ou remover jogadores da comparação a qualquer momento.
        </span>
        <button
          onClick={onClose}
          className="bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
        >
          Fechar Comparação
        </button>
      </div>
    </div>
  );
};
