import React, { useState, useMemo } from 'react';
import { Player, PlayerStatus, PositionCode, ShadowTeam, RatingSystem, PriorityRank, getDisplayRating, getPlayerAge } from '../types';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';

interface GlobalPlayersViewProps {
  allPlayers: Player[];
  teams: ShadowTeam[];
  onPlayerClick: (player: Player) => void;
  onAddPlayerToTeam: (player: Player, teamId: string) => void;
  onRemovePlayerFromTeam?: (player: Player, teamId: string) => void;
  onCreateNewTeamWithPlayer?: (teamName: string, player: Player) => void;
  onAddNewTarget: () => void;
  selectedPlayerIdsForCompare: string[];
  onToggleSelectForCompare: (playerId: string) => void;
  onTriggerToast: (msg: string) => void;
  ratingSystem?: RatingSystem;
  showHeader?: boolean;
  allowKanban?: boolean;
  onUpdatePlayerPriority?: (playerId: string, priorityRank: PriorityRank) => void;
}

export const GlobalPlayersView: React.FC<GlobalPlayersViewProps> = ({
  allPlayers,
  teams,
  onPlayerClick,
  onAddPlayerToTeam,
  onRemovePlayerFromTeam,
  onCreateNewTeamWithPlayer,
  onAddNewTarget,
  selectedPlayerIdsForCompare,
  onToggleSelectForCompare,
  onTriggerToast,
  ratingSystem = '20' as RatingSystem,
  showHeader = true,
  allowKanban = true,
  onUpdatePlayerPriority,
}) => {
  // View mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Pipeline stage state for Kanban board
  const [playerPipelineStages, setPlayerPipelineStages] = useState<Record<string, 'Sinalizado' | 'Em Análise' | 'Analisado'>>({});
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const handleMovePlayerToStage = (playerId: string, newStage: 'Sinalizado' | 'Em Análise' | 'Analisado') => {
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) return;

    setPlayerPipelineStages((prev) => ({ ...prev, [playerId]: newStage }));
    onTriggerToast(`"${player.name}" movido para "${newStage}"`);
  };

  // Modal and dropdown for Shadow Team action
  const [openTeamDropdownPlayerId, setOpenTeamDropdownPlayerId] = useState<string | null>(null);
  const [selectedPlayerForTeamModal, setSelectedPlayerForTeamModal] = useState<Player | null>(null);
  const [showCreateTeamInput, setShowCreateTeamInput] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<PositionCode | 'all'>('all');
  const [footFilter, setFootFilter] = useState<'Direito' | 'Esquerdo' | 'Ambidestro' | 'all'>('all');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [minAge, setMinAge] = useState<number>(16);
  const [maxAge, setMaxAge] = useState<number>(40);
  const [minHeight, setMinHeight] = useState<number>(160);
  const [maxHeight, setMaxHeight] = useState<number>(205);
  const [contractEndFilter, setContractEndFilter] = useState<'all' | 'expiring_soon' | '2024' | '2025' | '2026'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [minTacticalFit, setMinTacticalFit] = useState<number>(0);

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Status Labels in Portuguese
  const statusLabels: Record<PlayerStatus, { label: string; badgeClass: string }> = {
    hire: { label: 'Contratar', badgeClass: 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]/40' },
    track: { label: 'Acompanhar', badgeClass: 'bg-[#0b4e6e]/40 text-[#8abfe4] border-[#0b4e6e]' },
    squad: { label: 'Opção Plantel', badgeClass: 'bg-[#26262B] text-[#e4bebc] border-[#353436]' },
    discard: { label: 'Descartar', badgeClass: 'bg-red-950/40 text-red-400 border-red-900/40' },
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPositionFilter('all');
    setFootFilter('all');
    setNationalityFilter('');
    setMinAge(16);
    setMaxAge(40);
    setMinHeight(160);
    setMaxHeight(205);
    setContractEndFilter('all');
    setMinRating(0);
    setMinTacticalFit(0);
  };

  // Filter Logic
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      // Free text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(term);
        const matchesClub = player.club.toLowerCase().includes(term);
        const matchesNation = player.nationality.toLowerCase().includes(term);
        const matchesAgent = player.agent.toLowerCase().includes(term);
        if (!matchesName && !matchesClub && !matchesNation && !matchesAgent) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && player.status !== statusFilter) {
        return false;
      }

      // Position
      if (positionFilter !== 'all' && player.position !== positionFilter) {
        return false;
      }

      // Dominant Foot
      if (footFilter !== 'all' && player.dominantFoot !== footFilter) {
        return false;
      }

      // Nationality
      if (
        nationalityFilter.trim() &&
        !player.nationality.toLowerCase().includes(nationalityFilter.toLowerCase())
      ) {
        return false;
      }

      // Age Range
      const playerAge = getPlayerAge(player);
      if (playerAge < minAge || playerAge > maxAge) {
        return false;
      }

      // Height Range
      if (player.heightCm < minHeight || player.heightCm > maxHeight) {
        return false;
      }

      // Contract End
      if (contractEndFilter === 'expiring_soon' && !player.isContractExpiringSoon) {
        return false;
      }
      if (contractEndFilter === '2024' && !player.contractEnd.includes('2024')) {
        return false;
      }
      if (contractEndFilter === '2025' && !player.contractEnd.includes('2025')) {
        return false;
      }
      if (contractEndFilter === '2026' && !player.contractEnd.includes('2026')) {
        return false;
      }

      // Rating (1-5 stars)
      if (player.rating < minRating) {
        return false;
      }

      // Tactical Fit
      if (player.tacticalFitPercent < minTacticalFit) {
        return false;
      }

      return true;
    });
  }, [
    allPlayers,
    searchTerm,
    statusFilter,
    positionFilter,
    footFilter,
    nationalityFilter,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    contractEndFilter,
    minRating,
    minTacticalFit,
    ratingSystem,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (positionFilter !== 'all') count++;
    if (footFilter !== 'all') count++;
    if (nationalityFilter) count++;
    if (minAge > 16 || maxAge < 40) count++;
    if (minHeight > 160 || maxHeight < 205) count++;
    if (minRating > 0) count++;
    if (minTacticalFit > 0) count++;
    return count;
  }, [
    searchTerm,
    statusFilter,
    positionFilter,
    footFilter,
    nationalityFilter,
    minAge,
    maxAge,
    minHeight,
    maxHeight,
    contractEndFilter,
    minRating,
    minTacticalFit,
  ]);

  // Succession Hierarchy Ordering: Position first, then Priority Rank
  const POSITION_ORDER: Record<string, number> = {
    GR: 1,
    DC: 2,
    DD: 3,
    DE: 4,
    LDO: 5,
    LEO: 6,
    MDC: 7,
    MC: 8,
    MO: 9,
    EE: 10,
    ED: 11,
    PL: 12,
  };

  const PRIORITY_ORDER: Record<string, number> = {
    'Alvo Prioritário': 1,
    'Alvo Secundário': 2,
    'Oportunidade de Mercado': 3,
  };

  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      // 1. Sort by Position
      const posA = POSITION_ORDER[a.position] ?? 99;
      const posB = POSITION_ORDER[b.position] ?? 99;
      if (posA !== posB) {
        return posA - posB;
      }
      // 2. Sort by Priority Rank (Prioritário > Secundário > Oportunidade de Mercado)
      const prioA = PRIORITY_ORDER[a.priorityRank || 'Alvo Prioritário'] ?? 99;
      const prioB = PRIORITY_ORDER[b.priorityRank || 'Alvo Prioritário'] ?? 99;
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      // 3. Fallback: Rating
      return b.rating - a.rating;
    });
  }, [filteredPlayers]);

  const PIPELINE_COLUMNS: Array<{
    id: 'Sinalizado' | 'Em Análise';
    title: string;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    headerIcon: string;
  }> = [
    {
      id: 'Sinalizado',
      title: 'Sinalizados',
      badgeBg: 'bg-[#0b4e6e]/40',
      badgeText: 'text-[#8abfe4] border-[#0b4e6e]',
      borderColor: 'border-t-[#8abfe4]',
      headerIcon: 'bookmark',
    },
    {
      id: 'Em Análise',
      title: 'Em Análise',
      badgeBg: 'bg-[#ff535b]/20',
      badgeText: 'text-[#ffb3b1] border-[#ff535b]/40',
      borderColor: 'border-t-[#ff535b]',
      headerIcon: 'analytics',
    },
  ];

  const playersByStage = useMemo(() => {
    const map: Record<'Sinalizado' | 'Em Análise', Player[]> = {
      'Sinalizado': [],
      'Em Análise': [],
    };
    sortedPlayers.forEach((p) => {
      const st = playerPipelineStages[p.id] || p.pipelineStage || 'Sinalizado';
      if (st === 'Sinalizado' || st === 'Em Análise') {
        map[st].push(p);
      }
    });
    return map;
  }, [sortedPlayers, playerPipelineStages]);

  // Helper to count how many teams a player belongs to
  const getPlayerTeamCount = (playerId: string) => {
    return teams.filter((t) => t.players.some((p) => p.id === playerId)).length;
  };

  // Create new team handler inside modal
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamNameInput.trim() || !selectedPlayerForTeamModal) return;
    if (onCreateNewTeamWithPlayer) {
      onCreateNewTeamWithPlayer(newTeamNameInput.trim(), selectedPlayerForTeamModal);
    }
    onTriggerToast(`Shadow Team "${newTeamNameInput.trim()}" criada com ${selectedPlayerForTeamModal.name}!`);
    setNewTeamNameInput('');
    setShowCreateTeamInput(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. TOP HEADER & METRICS */}
      {showHeader && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-[#141416] p-6 rounded-2xl border border-[#26262B] shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shadow-[0_0_15px_rgba(255,83,91,0.25)]">
                <span className="material-symbols-outlined text-[#ff535b] text-[24px]">
                  badge
                </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#e5e2e3]">
                  Base de Dados Global
                </h1>
                <p className="text-xs text-[#e4bebc] mt-0.5">
                  Diretório de todos os atletas analisados e monitorizados pelo Departamento de Scouting
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="bg-[#1C1C1F] border border-[#26262B] px-3.5 py-2 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-mono-data uppercase text-[#e4bebc]">Total Atletas:</span>
              <span className="font-mono-data font-bold text-sm text-[#ffb3b1]">{allPlayers.length}</span>
            </div>

            <button
              onClick={onAddNewTarget}
              className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ml-auto lg:ml-0"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Registar Novo Alvo</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ADVANCED FILTER BAR */}
      <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-5 shadow-xl space-y-4">
        {/* Main Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Free Text Search */}
          <div className="md:col-span-5 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e4bebc] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por Nome, Clube, Liga ou Agente..."
              className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e5e2e3] outline-none transition-all placeholder:text-[#353436]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e4bebc] hover:text-[#ff535b]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Position Filter */}
          <div className="md:col-span-3">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as PositionCode | 'all')}
              className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] rounded-xl px-3 py-2.5 text-xs text-[#e5e2e3] font-bold outline-none cursor-pointer"
            >
              <option value="all">Todas as Posições</option>
              <option value="GR">Guarda-Redes (GR)</option>
              <option value="DC">Defesa Central (DC)</option>
              <option value="DD">Defesa Direito (DD)</option>
              <option value="DE">Defesa Esquerdo (DE)</option>
              <option value="MDC">Médio Defensivo (MDC)</option>
              <option value="MC">Médio Centro (MC)</option>
              <option value="MO">Médio Ofensivo (MO)</option>
              <option value="EE">Extremo Esquerdo (EE)</option>
              <option value="ED">Extremo Direito (ED)</option>
              <option value="PL">Avançado Centro (PL)</option>
            </select>
          </div>

          {/* Quick Status / Recommendation Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PlayerStatus | 'all')}
              className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] rounded-xl px-3 py-2.5 text-xs text-[#e5e2e3] font-bold outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="hire">Contratar (Alvo Prioritário)</option>
              <option value="track">Acompanhar (Em Observação)</option>
              <option value="squad">Opção Plantel (Interno)</option>
              <option value="discard">Descartar</option>
            </select>
          </div>

          {/* Toggle Advanced Filters Button & Reset */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setIsAdvancedFiltersOpen((prev) => !prev)}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAdvancedFiltersOpen || activeFilterCount > 0
                  ? 'bg-[#1C1C1F] border-[#ff535b] text-[#ffb3b1]'
                  : 'bg-[#0e0e0f] border-[#353436] text-[#e4bebc] hover:border-[#ff535b]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#ff535b] text-white text-[10px] font-mono-data flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="p-2.5 rounded-xl bg-[#0e0e0f] hover:bg-[#ff535b]/20 text-[#e4bebc] hover:text-[#ff535b] border border-[#353436] hover:border-[#ff535b] transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              </button>
            )}
          </div>
        </div>

        {/* Extended Advanced Filters Panel */}
        {isAdvancedFiltersOpen && (
          <div className="pt-4 border-t border-[#26262B] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fade-in">
            {/* 1. PERFIL FÍSICO (Altura & Pé) */}
            <div className="bg-[#0e0e0f] p-3 rounded-xl border border-[#26262B] space-y-2">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#ffb3b1] block">
                Perfil Físico
              </span>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Pé Preferencial
                </label>
                <select
                  value={footFilter}
                  onChange={(e) => setFootFilter(e.target.value as any)}
                  className="w-full bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#ff535b]"
                >
                  <option value="all">Qualquer Pé</option>
                  <option value="Direito">Direito</option>
                  <option value="Esquerdo">Esquerdo</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Altura: {minHeight}cm - {maxHeight}cm
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minHeight}
                    onChange={(e) => setMinHeight(Number(e.target.value))}
                    placeholder="Min"
                    className="w-1/2 bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded px-2 py-1 text-center outline-none focus:border-[#ff535b]"
                  />
                  <input
                    type="number"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(Number(e.target.value))}
                    placeholder="Máx"
                    className="w-1/2 bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded px-2 py-1 text-center outline-none focus:border-[#ff535b]"
                  />
                </div>
              </div>
            </div>

            {/* 2. DADOS BIOGRÁFICOS (Nacionalidade & Idade) */}
            <div className="bg-[#0e0e0f] p-3 rounded-xl border border-[#26262B] space-y-2">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#ffb3b1] block">
                Dados Biográficos
              </span>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Nacionalidade
                </label>
                <input
                  type="text"
                  value={nationalityFilter}
                  onChange={(e) => setNationalityFilter(e.target.value)}
                  placeholder="ex: Portugal, Brasil..."
                  className="w-full bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#ff535b]"
                />
              </div>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Idade: {minAge} - {maxAge} anos
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-1/2 bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded px-2 py-1 text-center outline-none focus:border-[#ff535b]"
                  />
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-1/2 bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded px-2 py-1 text-center outline-none focus:border-[#ff535b]"
                  />
                </div>
              </div>
            </div>

            {/* 3. TÉCNICO & TÁTICO (Adequação Tática, Avaliação Mínima em Inteiros) */}
            <div className="bg-[#0e0e0f] p-3 rounded-xl border border-[#26262B] space-y-2">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#ffb3b1] block">
                Técnico & Tático
              </span>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Adequação Tática Mínima: <strong className="text-[#ffb3b1]">{minTacticalFit}%</strong>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minTacticalFit}
                  onChange={(e) => setMinTacticalFit(Number(e.target.value))}
                  className="w-full accent-[#ff535b] cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[#e4bebc] text-[11px] block mb-1">
                  Avaliação Mínima (Estrelas)
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#ff535b] text-xs"
                >
                  <option value={0}>Todas</option>
                  <option value={1}>★ 1+</option>
                  <option value={2}>★ 2+</option>
                  <option value={3}>★ 3+</option>
                  <option value={4}>★ 4+</option>
                  <option value={5}>★ 5</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. TABLE / GRID VIEW CONTROLS & COUNTER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#e4bebc] font-medium">
            A apresentar <strong className="text-[#e5e2e3]">{filteredPlayers.length}</strong> de{' '}
            <strong className="text-[#e5e2e3]">{allPlayers.length}</strong> atletas
          </span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] bg-[#ff535b]/20 text-[#ffb3b1] px-2 py-0.5 rounded-full font-mono-data font-bold border border-[#ff535b]/40">
              Filtros Ativos ({activeFilterCount})
            </span>
          )}
        </div>

        {/* View Switcher */}
        {allowKanban && (
          <div className="flex items-center bg-[#141416] border border-[#26262B] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] shadow-sm'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
              <span>Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] shadow-sm'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              <span>Quadro</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN PLAYERS CONTENT */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-12 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#e4bebc]">
            search_off
          </span>
          <h3 className="text-lg font-bold text-[#e5e2e3]">Nenhum jogador encontrado</h3>
          <p className="text-xs text-[#e4bebc] max-w-md mx-auto">
            Não existem atletas na base de dados que correspondam aos filtros selecionados.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 inline-flex items-center gap-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#ffb3b1] px-4 py-2 rounded-xl text-xs font-bold border border-[#353436] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Limpar Filtros</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0e0e0f] border-b border-[#26262B] text-[11px] font-bold text-[#ffb3b1] uppercase tracking-wider">
                  <th className="p-4 w-10 text-center">Comp.</th>
                  <th className="p-4 px-5">Jogador</th>
                  <th className="p-4">Posição</th>
                  <th className="p-4">Idade</th>
                  <th className="p-4">Altura</th>
                  <th className="p-4 pl-3 pr-2">Pé</th>
                  <th className="py-4 px-2 text-center w-16">Rating</th>
                  <th className="p-4 pl-4 px-5">Agente</th>
                  <th className="p-4">Adequação Tática</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262B]/60 text-xs">
                {sortedPlayers.map((player) => {
                  const isSelectedForCompare = selectedPlayerIdsForCompare.includes(player.id);

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#1C1C1F]/80 transition-colors ${
                        isSelectedForCompare ? 'bg-[#ff535b]/10' : ''
                      }`}
                    >
                      {/* Comparison Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => onToggleSelectForCompare(player.id)}
                          className="w-4 h-4 rounded border-[#353436] bg-[#0A0A0B] accent-[#ff535b] cursor-pointer"
                          title="Selecionar para comparação"
                        />
                      </td>

                      {/* Jogador */}
                      <td className="p-4 px-5">
                        <div
                          onClick={() => onPlayerClick(player)}
                          className="flex items-center gap-3 cursor-pointer group min-w-[170px]"
                        >
                          <Avatar
                            name={player.name}
                            className="w-10 h-10 text-xs border border-[#26262B] group-hover:border-[#ff535b] transition-colors shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors text-sm">
                              {player.name}
                            </span>
                            <span className="text-[11px] text-[#e4bebc] flex flex-col gap-0.5 mt-0.5">
                              <div className="flex items-center gap-1">
                                <span>{player.flag}</span>
                                <span className="font-semibold text-[#e5e2e3]">{player.club}</span>
                              </div>
                              <span className="text-[#e4bebc]/70 text-[10px] font-normal">
                                ({player.league || 'Liga Portugal'})
                              </span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Posição */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40">
                            {player.position}
                          </span>
                          {player.secondaryPositions &&
                            player.secondaryPositions.map((sec) => (
                              <span
                                key={sec}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono-data bg-[#2a2a2b] text-[#e4bebc]"
                              >
                                {sec}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Idade */}
                      <td className="p-4 whitespace-nowrap text-xs text-[#e5e2e3] font-mono-data font-semibold">
                        {getPlayerAge(player)} anos
                      </td>

                      {/* Altura */}
                      <td className="p-4 whitespace-nowrap text-xs text-[#e4bebc] font-mono-data">
                        {player.heightCm} cm
                      </td>

                      {/* Pé */}
                      <td className="p-4 pl-3 pr-2 whitespace-nowrap text-xs text-[#e4bebc] font-mono-data">
                        <FootIndicator foot={player.dominantFoot} />
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-2 text-center whitespace-nowrap w-16">
                        <div className="inline-flex items-center justify-center bg-[#18181A] px-2 py-0.5 rounded-md border border-[#26262B]">
                          <StarRating value={player.rating} size="xs" variant="single" />
                        </div>
                      </td>

                      {/* Agente */}
                      <td className="p-3.5 pl-4 px-5 whitespace-nowrap text-xs text-[#e4bebc] font-medium max-w-[160px] truncate" title={player.agent}>
                        {player.agent || 'N/A'}
                      </td>

                      {/* Adequação Tática */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-[#e4bebc]">Fit Tático</span>
                            <span className="font-mono-data font-bold text-[#ffb3b1]">
                              {player.tacticalFitPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-[#26262B]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b]"
                              style={{ width: `${player.tacticalFitPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right pr-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Transfermarkt */}
                          <a
                            href={
                              player.transfermarktUrl ||
                              `https://www.transfermarkt.pt/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Abrir no Transfermarkt"
                            className="px-2.5 py-1 rounded-lg bg-[#1C1C1F] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#ff535b] border border-[#26262B] hover:border-[#ff535b]/60 transition-all font-mono-data text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>TM</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </a>

                          {/* Shadow Team Dropdown Button */}
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() =>
                                setOpenTeamDropdownPlayerId((prev) =>
                                  prev === player.id ? null : player.id
                                )
                              }
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-[#0b4e6e] hover:bg-[#0f6087] text-[#8abfe4] border border-[#ff535b]/30 shadow-sm"
                              title="Adicionar a Shadow Team"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                group_add
                              </span>
                              <span>Shadow Team</span>
                              <span className="material-symbols-outlined text-[14px]">
                                expand_more
                              </span>
                            </button>

                            {openTeamDropdownPlayerId === player.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenTeamDropdownPlayerId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-56 bg-[#141416] border border-[#353436] rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#e4bebc] border-b border-[#26262B]">
                                    Shadow Teams
                                  </div>

                                  {teams.length === 0 ? (
                                    <div className="px-2.5 py-2 text-xs text-[#e4bebc]">
                                      Nenhuma Shadow Team criada.
                                    </div>
                                  ) : (
                                    teams.map((team) => {
                                      const isInThisTeam = team.players.some(
                                        (p) => p.id === player.id
                                      );

                                      return (
                                        <button
                                          key={team.id}
                                          onClick={() => {
                                            if (isInThisTeam) {
                                              if (onRemovePlayerFromTeam) {
                                                onRemovePlayerFromTeam(player, team.id);
                                                onTriggerToast(
                                                  `${player.name} removido de "${team.name}".`
                                                );
                                              }
                                            } else {
                                              onAddPlayerToTeam(player, team.id);
                                              onTriggerToast(
                                                `${player.name} adicionado à "${team.name}".`
                                              );
                                            }
                                            setOpenTeamDropdownPlayerId(null);
                                          }}
                                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                            isInThisTeam
                                              ? 'bg-[#0b4e6e]/30 text-[#8abfe4] hover:bg-[#0b4e6e]/50'
                                              : 'text-[#e5e2e3] hover:bg-[#26262B]'
                                          }`}
                                        >
                                          <span className="truncate">{team.name}</span>
                                          {isInThisTeam && (
                                            <span className="material-symbols-outlined text-[14px] text-[#8abfe4]">
                                              check
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })
                                  )}

                                  <div className="pt-1 border-t border-[#26262B]">
                                    <button
                                      onClick={() => {
                                        setOpenTeamDropdownPlayerId(null);
                                        setSelectedPlayerForTeamModal(player);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#ffb3b1] hover:bg-[#26262B] transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">
                                        add_circle
                                      </span>
                                      <span>+ Criar Nova Shadow Team</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' && allowKanban ? (
        /* KANBAN PIPELINE VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PIPELINE_COLUMNS.map((col) => {
            const colPlayers = playersByStage[col.id] || [];
            const isDragOver = draggedOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (draggedOverColumn !== col.id) setDraggedOverColumn(col.id);
                }}
                onDragLeave={() => setDraggedOverColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const playerId = e.dataTransfer.getData('text/plain') || draggedPlayerId;
                  if (playerId) {
                    handleMovePlayerToStage(playerId, col.id);
                  }
                  setDraggedOverColumn(null);
                  setDraggedPlayerId(null);
                }}
                className={`bg-[#141416] border border-[#26262B] border-t-4 ${col.borderColor} rounded-2xl p-4 flex flex-col transition-all min-h-[500px] ${
                  isDragOver ? 'bg-[#1C1C1F] border-[#ff535b]/80 shadow-[0_0_20px_rgba(255,83,91,0.15)] ring-1 ring-[#ff535b]/50' : ''
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#26262B]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#e4bebc]">
                      {col.headerIcon}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#e5e2e3] tracking-tight">{col.title}</h3>
                  </div>
                  {/* Badge with count */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono-data border ${col.badgeBg} ${col.badgeText}`}
                  >
                    {colPlayers.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                  {colPlayers.length === 0 ? (
                    <div className="h-40 border-2 border-dashed border-[#26262B] rounded-xl flex flex-col items-center justify-center text-center p-4 text-[#e4bebc]/50 text-xs">
                      <span className="material-symbols-outlined text-2xl mb-1 text-[#e4bebc]/30">
                        move_item
                      </span>
                      <span>Nenhum atleta nesta fase</span>
                      <span className="text-[10px] text-[#e4bebc]/40 mt-1">Arraste um atleta para aqui</span>
                    </div>
                  ) : (
                    colPlayers.map((player) => {
                      const isBeingDragged = draggedPlayerId === player.id;

                      return (
                        <div
                          key={player.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', player.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedPlayerId(player.id);
                          }}
                          onDragEnd={() => setDraggedPlayerId(null)}
                          onClick={() => onPlayerClick(player)}
                          className={`bg-[#0e0e0f] border border-[#26262B] hover:border-[#ff535b]/70 rounded-xl p-3.5 shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group relative ${
                            isBeingDragged ? 'opacity-40 scale-95 border-dashed border-[#ff535b]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar with Automatic Initials */}
                            <Avatar
                              name={player.name}
                              className="w-10 h-10 text-xs border border-[#353436] group-hover:border-[#ff535b] transition-colors shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              {/* Player Name */}
                              <h4 className="font-extrabold text-sm text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors truncate">
                                {player.name}
                              </h4>

                              {/* Position Tags */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-data font-bold bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30 shrink-0">
                                  {player.position}
                                </span>
                                {player.secondaryPositions && player.secondaryPositions.length > 0 && (
                                  <span className="text-[10px] font-mono-data text-[#e4bebc]/60 truncate">
                                    ({player.secondaryPositions.join(', ')})
                                  </span>
                                )}
                              </div>

                              {/* Club Logo / Name */}
                              <div className="flex items-center gap-1 mt-1 text-xs text-[#e4bebc] truncate">
                                <span>{player.flag}</span>
                                <span className="font-semibold text-[#e5e2e3] truncate">{player.club}</span>
                              </div>

                              {/* Rating Stars */}
                              <div className="mt-2.5 pt-2 border-t border-[#1C1C1F] flex items-center justify-between gap-2">
                                <StarRating value={player.rating} size="xs" />
                                <span className="text-[10px] font-mono-data text-[#e4bebc]/70">
                                  {getPlayerAge(player)}a
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stage Dropdown Selector for quick move */}
                          <div className="mt-2 pt-2 border-t border-[#1C1C1F] flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-[#e4bebc]/50 font-mono-data text-[9px] uppercase">Mover:</span>
                            <select
                              value={col.id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleMovePlayerToStage(player.id, e.target.value as any);
                              }}
                              className="bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] rounded px-1.5 py-0.5 text-[10px] outline-none font-bold cursor-pointer hover:border-[#ff535b]"
                            >
                              <option value="Sinalizado">Sinalizados</option>
                              <option value="Em Análise">Em Análise</option>
                              <option value="Analisado">Analisado</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 5. ADD TO SHADOW TEAM SELECTION MODAL */}
      {selectedPlayerForTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-[#353436] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-extrabold text-[#e5e2e3]">
                  Adicionar Atleta a Shadow Team
                </h3>
                <p className="text-xs text-[#e4bebc] mt-1">
                  Selecione em qual das equipas quer incluir este jogador
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPlayerForTeamModal(null);
                  setShowCreateTeamInput(false);
                  setNewTeamNameInput('');
                }}
                className="p-1 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#26262B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Target Player Card Preview */}
            <div className="flex items-center gap-3 bg-[#0e0e0f] p-3 rounded-xl border border-[#26262B]">
              <Avatar
                name={selectedPlayerForTeamModal.name}
                className="w-12 h-12 text-sm border border-[#ff535b]/60 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-[#e5e2e3] block truncate text-sm">
                  {selectedPlayerForTeamModal.name}
                </span>
                <span className="text-xs text-[#e4bebc] truncate block">
                  {selectedPlayerForTeamModal.club} <span className="text-[#e4bebc]/70">({selectedPlayerForTeamModal.league || 'Liga Portugal'})</span> • {selectedPlayerForTeamModal.nationality}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-data font-bold bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30">
                {selectedPlayerForTeamModal.position}
              </span>
            </div>

            {/* Teams List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {teams.map((team) => {
                const isInThisTeam = team.players.some(
                  (p) => p.id === selectedPlayerForTeamModal.id
                );

                return (
                  <div
                    key={team.id}
                    className="flex justify-between items-center bg-[#1C1C1F] border border-[#26262B] hover:border-[#353436] p-3 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0b4e6e]/40 border border-[#0b4e6e] flex items-center justify-center text-[#8abfe4]">
                        <span className="material-symbols-outlined text-[18px]">groups</span>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#e5e2e3] block">
                          {team.name}
                        </span>
                        <span className="text-[10px] font-mono-data text-[#e4bebc]">
                          {team.players.length} atletas no plantel
                        </span>
                      </div>
                    </div>

                    {isInThisTeam ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-[#0b4e6e]/40 text-[#8abfe4] border border-[#0b4e6e] px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Incluído</span>
                        </span>
                        {onRemovePlayerFromTeam && (
                          <button
                            onClick={() => {
                              onRemovePlayerFromTeam(selectedPlayerForTeamModal, team.id);
                              onTriggerToast(
                                `${selectedPlayerForTeamModal.name} removido de "${team.name}".`
                              );
                            }}
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/50 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Remover atleta desta equipa"
                          >
                            <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onAddPlayerToTeam(selectedPlayerForTeamModal, team.id);
                          onTriggerToast(
                            `${selectedPlayerForTeamModal.name} adicionado à "${team.name}".`
                          );
                        }}
                        className="bg-[#ff535b] hover:brightness-110 text-white px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional Create New Team toggle */}
            {!showCreateTeamInput ? (
              <button
                onClick={() => setShowCreateTeamInput(true)}
                className="w-full py-2.5 bg-[#0e0e0f] hover:bg-[#1C1C1F] border border-dashed border-[#353436] hover:border-[#ff535b] text-[#ffb3b1] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Criar Nova Shadow Team para este atleta</span>
              </button>
            ) : (
              <form onSubmit={handleCreateTeamSubmit} className="space-y-2 bg-[#0e0e0f] p-3 rounded-xl border border-[#ff535b]/40">
                <label className="text-[11px] font-bold text-[#ffb3b1] block">
                  Nome da Nova Shadow Team:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTeamNameInput}
                    onChange={(e) => setNewTeamNameInput(e.target.value)}
                    placeholder="ex: Plantel Futuro 2025/26"
                    className="flex-1 bg-[#1C1C1F] border border-[#353436] focus:border-[#ff535b] text-xs text-[#e5e2e3] rounded-lg px-3 py-1.5 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newTeamNameInput.trim()}
                    className="bg-[#ff535b] text-white px-3 py-1.5 text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Criar & Adicionar
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#26262B] flex justify-end">
              <button
                onClick={() => {
                  setSelectedPlayerForTeamModal(null);
                  setShowCreateTeamInput(false);
                  setNewTeamNameInput('');
                }}
                className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] text-xs font-bold rounded-xl border border-[#353436] transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
