import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Player, PlayerStatus, PositionCode, RatingSystem, getDisplayRating, getPlayerAge } from '../types';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';
import { FootIndicator } from './FootIndicator';

interface ShortlistsViewProps {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  selectedPlayerIdsForCompare?: string[];
  onToggleSelectForCompare?: (playerId: string) => void;
  onOpenCompareModal?: () => void;
  onSetSelectedForCompare?: (ids: string[]) => void;
  ratingSystem?: RatingSystem;
}

interface CustomTab {
  id: string;
  name: string;
  positionFilter?: PositionCode;
  status?: PlayerStatus;
  minAge?: number;
  maxAge?: number;
}

const statusLabels: Record<PlayerStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Por definir', badgeClass: 'bg-[#71717a]/20 text-[#a1a1aa] border-[#71717a]/40' },
  hire: { label: 'Contratar', badgeClass: 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]/40' },
  track: { label: 'Acompanhar', badgeClass: 'bg-[#0b4e6e]/40 text-[#8abfe4] border-[#0b4e6e]' },
  squad: { label: 'Opção Plantel', badgeClass: 'bg-[#26262B] text-[#e4bebc] border-[#353436]' },
  discard: { label: 'Descartar', badgeClass: 'bg-red-950/40 text-red-400 border-red-900/40' },
};

export const ShortlistsView: React.FC<ShortlistsViewProps> = ({
  players,
  onPlayerClick,
  onTriggerToast,
  selectedPlayerIdsForCompare,
  onToggleSelectForCompare,
  onOpenCompareModal,
  onSetSelectedForCompare,
  ratingSystem = '20' as RatingSystem,
}) => {
  // Built-in named shortlists + custom tabs
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);

  // Selected player IDs for batch actions (falls back to local if props not passed)
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);

  const activeSelectedIds = selectedPlayerIdsForCompare ?? localSelectedIds;

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
  const [isShortlistDropdownOpen, setIsShortlistDropdownOpen] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (positionFilter !== 'all') count++;
    if (footFilter !== 'all') count++;
    if (nationalityFilter) count++;
    if (minAge > 16 || maxAge < 40) count++;
    if (minHeight > 160 || maxHeight < 205) count++;
    if (contractEndFilter !== 'all') count++;
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

  const handleToggleSelectPlayer = (id: string) => {
    if (onToggleSelectForCompare) {
      onToggleSelectForCompare(id);
    } else {
      setLocalSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = currentTabPlayers.map((p) => p.id);
      if (onSetSelectedForCompare) {
        onSetSelectedForCompare(Array.from(new Set([...activeSelectedIds, ...allIds])));
      } else {
        setLocalSelectedIds(allIds);
      }
    } else {
      if (onSetSelectedForCompare) {
        onSetSelectedForCompare([]);
      } else {
        setLocalSelectedIds([]);
      }
    }
  };

  const handleClearSelection = () => {
    if (onSetSelectedForCompare) {
      onSetSelectedForCompare([]);
    } else {
      setLocalSelectedIds([]);
    }
  };

  // Modal states
  const [isNewShortlistModalOpen, setIsNewShortlistModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Removed players per shortlist tab (local state)
  const [removedByTab, setRemovedByTab] = useState<Record<string, string[]>>({});

  // Filter logic based on activeTabId and filter criteria
  const getPlayersForTab = (tabId: string) => {
    const removed = removedByTab[tabId] || [];
    let list = players.filter((p) => !removed.includes(p.id));

    if (tabId === 'cb_priority') {
      list = list.filter((p) => ['DC', 'DD', 'DE', 'GR'].includes(p.position));
    } else if (tabId === 'u23_talents') {
      list = list.filter((p) => getPlayerAge(p) <= 23);
    } else if (tabId === 'contract_opps') {
      list = list.filter(
        (p) =>
          p.isContractExpiringSoon ||
          p.contractEnd.includes('2024') ||
          p.contractEnd.includes('2025')
      );
    }

    return list.filter((player) => {
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

      // Quick Status
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
  };

  const currentTabPlayers = getPlayersForTab(activeTabId);

  const isAllSelected =
    currentTabPlayers.length > 0 &&
    currentTabPlayers.every((p) => activeSelectedIds.includes(p.id));

  // Actions
  const handleRemoveFromList = (player: Player) => {
    setRemovedByTab((prev) => ({
      ...prev,
      [activeTabId]: [...(prev[activeTabId] || []), player.id],
    }));
    handleToggleSelectPlayer(player.id);
    onTriggerToast(`${player.name} foi removido da shortlist atual.`);
  };

  const handleCreateNewShortlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newTab: CustomTab = { id: newId, name: newTabName.trim() };

    setCustomTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setNewTabName('');
    setIsNewShortlistModalOpen(false);
    onTriggerToast(`Nova Shortlist "${newTab.name}" criada com sucesso!`);
  };

  const handleOpenWyscout = (player: Player) => {
    if (player.wyscoutUrl) {
      window.open(player.wyscoutUrl, '_blank');
    } else {
      onTriggerToast(`A abrir perfil do Wyscout para ${player.name}...`);
    }
  };

  const handleOpenHudl = (player: Player) => {
    if (player.hudlUrl) {
      window.open(player.hudlUrl, '_blank');
    } else {
      onTriggerToast(`A abrir perfil no Hudl para ${player.name}...`);
    }
  };

  const handleOpenTransfermarkt = (player: Player) => {
    if (player.transfermarktUrl) {
      window.open(player.transfermarktUrl, '_blank', 'noopener,noreferrer');
      onTriggerToast(`A abrir perfil no Transfermarkt de ${player.name}...`);
    } else {
      onTriggerToast(`Sem link do Transfermarkt registado para ${player.name}.`);
    }
  };

  const handleExportPDF = () => {
    onTriggerToast(
      `Relatório em PDF com ${activeSelectedIds.length > 0 ? activeSelectedIds.length : currentTabPlayers.length} alvos exportado com sucesso.`
    );
  };

  // Compare Modal Selected Players
  const selectedPlayersForCompare = players.filter((p) =>
    activeSelectedIds.includes(p.id)
  );

  const activeTab = customTabs.find((t) => t.id === activeTabId) || customTabs[0];

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 pb-10">
      {/* 1. SECTION HEADER WITH DYNAMIC TITLE DROPDOWN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsShortlistDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#e5e2e3] hover:text-white tracking-tight cursor-pointer group text-left transition-colors"
              >
                <span>{activeTab?.name || 'Gestão de Shortlists'}</span>
                <ChevronDown
                  className={`w-7 h-7 sm:w-8 sm:h-8 text-[#ff535b] transition-transform duration-200 shrink-0 ${
                    isShortlistDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Shortlists Dropdown Floating Menu */}
              {isShortlistDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsShortlistDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#141416] border border-[#353436] rounded-2xl shadow-2xl z-50 p-2.5 animate-fade-in flex flex-col gap-1.5">
                    <div className="px-3 py-1.5 text-[10px] font-mono-data font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] flex items-center justify-between">
                      <span>As Tuas Shortlists ({customTabs.length})</span>
                      <span className="material-symbols-outlined text-[14px] text-[#ff535b]">bookmark</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
                      {customTabs.map((tab) => {
                        const tabCount = getPlayersForTab(tab.id).length;
                        const isActive = activeTabId === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTabId(tab.id);
                              handleClearSelection();
                              setIsShortlistDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40 shadow-sm'
                                : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1C1C1F] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`material-symbols-outlined text-[18px] ${
                                  isActive ? 'text-[#ff535b]' : 'text-[#e4bebc]'
                                }`}
                              >
                                bookmark
                              </span>
                              <span className="truncate">{tab.name}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono-data font-bold shrink-0 ${
                                isActive
                                  ? 'bg-[#ff535b] text-white'
                                  : 'bg-[#26262B] text-[#e4bebc]'
                              }`}
                            >
                              {tabCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-[#26262B]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsShortlistDropdownOpen(false);
                          setIsNewShortlistModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#1C1C1F] hover:bg-[#26262B] text-[#ff535b] text-xs font-bold transition-all cursor-pointer border border-[#353436]"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Criar Nova Shortlist</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40 text-xs font-mono-data font-bold px-2.5 py-0.5 rounded-full shrink-0">
              {currentTabPlayers.length} {currentTabPlayers.length === 1 ? 'Atleta' : 'Atletas'}
            </span>
          </div>
          <p className="text-sm text-[#e4bebc] mt-1">
            Análise comparativa, priorização e exportação de alvos de mercado
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewShortlistModalOpen(true)}
          className="bg-[#ff535b] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Nova Shortlist</span>
        </button>
      </div>

      {/* ADVANCED FILTER BAR */}
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
              <option value="all">Todas as Recomendações</option>
              <option value="pending">Por definir</option>
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
            {/* 1. PERFIL FÍSICO */}
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

            {/* 2. DADOS BIOGRÁFICOS */}
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

            {/* 3. TÉCNICO & TÁTICO */}
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
                  Avaliação Global Mínima
                </label>
                {ratingSystem === '20' ? (
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#ff535b]"
                  >
                    <option value={0}>Todas as Avaliações</option>
                    <option value={10}>Nota 10+ (Tradicional)</option>
                    <option value={12}>Nota 12+ (Razoável)</option>
                    <option value={14}>Nota 14+ (Bom)</option>
                    <option value={16}>Nota 16+ (Muito Bom)</option>
                    <option value={18}>Nota 18+ (Elite)</option>
                  </select>
                ) : (
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full bg-[#1C1C1F] border border-[#353436] text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#ff535b]"
                  >
                    <option value={0}>Todas</option>
                    <option value={1}>★ 1+</option>
                    <option value={2}>★ 2+</option>
                    <option value={3}>★ 3+</option>
                    <option value={4}>★ 4+</option>
                    <option value={5}>★ 5</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BATCH ACTIONS BAR (Appears if items are checked) */}
      {activeSelectedIds.length > 0 && (
        <div className="bg-[#1C1C1F] border border-[#ff535b]/80 p-3.5 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ffb3b1] text-[20px]">
              check_box
            </span>
            <span className="text-xs font-bold text-[#e5e2e3]">
              <span className="font-mono-data text-[#ffb3b1] text-sm">
                {activeSelectedIds.length}
              </span>{' '}
              {activeSelectedIds.length === 1
                ? 'Jogador Selecionado'
                : 'Jogadores Selecionados'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (onOpenCompareModal) {
                  onOpenCompareModal();
                } else {
                  setIsCompareModalOpen(true);
                }
              }}
              className="bg-[#ff535b] hover:brightness-110 text-white border border-[#ff535b]/50 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">
                compare_arrows
              </span>
              <span>Comparar Jogadores Selecionados</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="bg-[#141416] hover:bg-[#252528] text-[#e5e2e3] border border-[#26262B] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                picture_as_pdf
              </span>
              <span>Exportar Relatório (PDF)</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="text-[#e4bebc] hover:text-[#ff535b] text-xs font-bold px-2 py-1 transition-colors cursor-pointer"
            >
              Desmarcar Seleção
            </button>
          </div>
        </div>
      )}

      {/* 4. COMPARATIVE DATA TABLE */}
      <div className="bg-[#141416] border border-[#26262B] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0E0E0F] border-b border-[#26262B] text-[11px] font-bold text-[#ffb3b1] uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#353436] bg-[#0A0A0B] accent-[#ff535b] cursor-pointer"
                  />
                </th>
                <th className="p-4 px-5">Jogador</th>
                <th className="p-4">Posição</th>
                <th className="p-4">Recomendação</th>
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
              {currentTabPlayers.length > 0 ? (
                currentTabPlayers.map((player) => {
                  const isSelected = activeSelectedIds.includes(player.id);

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-[#1C1C1F]/80 transition-colors ${
                        isSelected ? 'bg-[#0b4e6e]/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectPlayer(player.id)}
                          className="w-4 h-4 rounded border-[#353436] bg-[#0A0A0B] accent-[#ff535b] cursor-pointer"
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

                      {/* Recomendação */}
                      <td className="p-4 whitespace-nowrap">
                        {(() => {
                          const info = statusLabels[player.status] || statusLabels.pending;
                          return (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${info.badgeClass}`}>
                              {info.label}
                            </span>
                          );
                        })()}
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
                              {player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? `${player.tacticalFitPercent}%` : '-'}
                            </span>
                          </div>
                          <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-[#26262B]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b]"
                              style={{ width: `${player.tacticalFitPercent != null && player.tacticalFitPercent > 0 ? player.tacticalFitPercent : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right pr-6 whitespace-nowrap">
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

                          {/* zerozero */}
                          <a
                            href={
                              player.zerozeroUrl ||
                              `https://www.zerozero.pt/pesquisa?search_string=${encodeURIComponent(player.name)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Abrir no zerozero"
                            className="px-2.5 py-1 rounded-lg bg-[#1C1C1F] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#ff535b] border border-[#26262B] hover:border-[#ff535b]/60 transition-all font-mono-data text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>ZZ</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </a>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveFromList(player)}
                            title="Remover da Shortlist"
                            className="p-1.5 rounded-lg bg-[#1C1C1F] hover:bg-[#ff535b]/20 text-[#e4bebc] hover:text-[#ff535b] border border-[#26262B] transition-all cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-[#e4bebc]">
                    Nenhum jogador encontrado nesta shortlist.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: NOVA SHORTLIST */}
      {isNewShortlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-[#ff535b]/60 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-[#26262B] pb-3">
              <h3 className="text-lg font-extrabold text-[#e5e2e3]">
                + Nova Shortlist
              </h3>
              <button
                onClick={() => setIsNewShortlistModalOpen(false)}
                className="text-[#e4bebc] hover:text-[#e5e2e3]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateNewShortlist} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase">
                  Nome da Shortlist
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mercado Sul-Americano, Agentes Livres 2026..."
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  className="bg-[#0A0A0B] border border-[#26262B] focus:border-[#ff535b] text-[#e5e2e3] px-3.5 py-2 rounded-lg text-sm outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewShortlistModalOpen(false)}
                  className="px-4 py-2 bg-[#1C1C1F] text-[#e4bebc] text-xs font-bold rounded-lg hover:bg-[#2a2a2b] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ff535b] text-white text-xs font-bold rounded-lg hover:brightness-110 shadow-lg transition-all"
                >
                  Criar Shortlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: COMPARAR JOGADORES SELECIONADOS */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141416] border border-[#ff535b]/80 rounded-2xl p-6 w-full max-w-5xl shadow-2xl flex flex-col gap-6 my-8">
            <div className="flex justify-between items-center border-b border-[#26262B] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#e5e2e3]">
                  Comparação Lado a Lado de Alvos
                </h3>
                <p className="text-xs text-[#e4bebc] mt-0.5">
                  Análise detalhada de atributos, valor e adequação tática
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-[#e4bebc] hover:text-[#e5e2e3] p-1 rounded-lg hover:bg-[#1C1C1F]"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            {selectedPlayersForCompare.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  selectedPlayersForCompare.length === 1
                    ? 'grid-cols-1 max-w-md mx-auto'
                    : selectedPlayersForCompare.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {selectedPlayersForCompare.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#0A0A0B] border border-[#26262B] rounded-xl p-5 flex flex-col gap-4 relative"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={p.name}
                        className="w-14 h-14 text-sm border border-[#ff535b] shrink-0"
                      />
                      <div className="flex flex-col">
                        <h4 className="text-base font-extrabold text-[#e5e2e3]">
                          {p.name}
                        </h4>
                        <div className="flex flex-col text-xs text-[#e4bebc] my-0.5">
                          <div className="flex items-center gap-1">
                            <span>{p.flag}</span>
                            <span className="font-semibold text-[#e5e2e3]">{p.club}</span>
                          </div>
                          <span className="text-[#e4bebc]/70 text-[10px] font-normal">
                            ({p.league || 'Liga Portugal'})
                          </span>
                        </div>
                        <span className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/40 w-fit">
                          {p.position}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#141416] p-3 rounded-lg border border-[#26262B]">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[#e4bebc]">
                          Idade / Altura
                        </span>
                        <span className="font-mono-data font-bold text-[#e5e2e3]">
                          {p.age} anos ({p.heightCm}cm)
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[#e4bebc]">
                          Pé Dominante
                        </span>
                        <div className="mt-0.5">
                          <FootIndicator foot={p.dominantFoot} showLabel />
                        </div>
                      </div>

                      <div className="flex flex-col mt-2">
                        <span className="text-[10px] uppercase font-bold text-[#e4bebc]">
                          Fim do Contrato
                        </span>
                        <span className="font-mono-data font-bold text-[#e5e2e3]">
                          {p.contractEnd}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#e4bebc] font-bold">
                          Adequação Tática
                        </span>
                        <span className="font-mono-data font-bold text-[#ffb3b1]">
                          {p.tacticalFitPercent != null && p.tacticalFitPercent > 0 ? `${p.tacticalFitPercent}%` : '-'}
                        </span>
                      </div>
                      <div className="w-full bg-[#141416] h-2.5 rounded-full overflow-hidden border border-[#26262B]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0b4e6e] via-[#8abfe4] to-[#ff535b]"
                          style={{ width: `${p.tacticalFitPercent != null && p.tacticalFitPercent > 0 ? p.tacticalFitPercent : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs bg-[#141416] p-3 rounded-lg border border-[#26262B]">
                      <span className="text-[10px] uppercase font-bold text-[#ffb3b1]">
                        Notas de Observação
                      </span>
                      <p className="text-[#e4bebc] italic text-[11px] leading-relaxed">
                        "{p.notes.tatica}"
                      </p>
                    </div>

                    <button
                      onClick={() => onPlayerClick(p)}
                      className="mt-auto bg-[#1C1C1F] hover:bg-[#353436] text-[#e5e2e3] border border-[#26262B] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Ver Relatório Completo
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#e4bebc] py-8">
                Nenhum jogador selecionado para comparação.
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-[#26262B]">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-6 py-2 bg-[#ff535b] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:brightness-110 shadow-lg cursor-pointer"
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
