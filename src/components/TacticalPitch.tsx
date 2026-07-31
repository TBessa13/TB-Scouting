import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Player, FormationName, TacticalSlot, RatingSystem, getDisplayRating, getPlayerAge } from '../types';
import { FORMATION_SLOTS } from '../data/formationSlots';
import { StarRating } from './StarRating';
import { FootIndicator } from './FootIndicator';

export interface PitchFieldsConfig {
  showAge: boolean;
  showHeight: boolean;
  showFoot: boolean;
  showContract: boolean;
  showRating: boolean;
  showAgent: boolean;
}

export type PitchViewMode = 'compact' | 'depth';

interface TacticalPitchProps {
  players: Player[];
  squadPlayers?: Player[];
  onPlayerClick: (player: Player) => void;
  defaultFormation?: FormationName;
  onFormationChange?: (formation: FormationName) => void;
  onAssignPlayerToSlot?: (slotId: string, playerId: string) => void;
  ratingSystem?: RatingSystem;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  players,
  squadPlayers = [],
  onPlayerClick,
  defaultFormation = '4-2-3-1',
  onFormationChange,
  ratingSystem = '20' as RatingSystem,
}) => {
  const [formation, setFormation] = useState<FormationName>(defaultFormation);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [viewMode, setViewMode] = useState<PitchViewMode>('compact');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [collapsedPlayerIds, setCollapsedPlayerIds] = useState<Record<string, boolean>>({});
  const [isPdfExportingCollapsedOverride, setIsPdfExportingCollapsedOverride] = useState(false);

  const pitchRef = useRef<HTMLDivElement>(null);
  const annexRef = useRef<HTMLDivElement>(null);

  const togglePlayerCollapse = (playerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Field display configuration (Toggles)
  const [fieldsConfig, setFieldsConfig] = useState<PitchFieldsConfig>({
    showAge: true,
    showHeight: true,
    showFoot: true,
    showContract: true,
    showRating: true,
    showAgent: true,
  });

  // Position depth chart order state: slotId -> array of playerIds in priority order
  const [slotPlayerLists, setSlotPlayerLists] = useState<Record<string, string[]>>({});

  // Currently open position slot depth chart modal/popover
  const [activeDepthSlot, setActiveDepthSlot] = useState<TacticalSlot | null>(null);

  // Modal for assigning an additional player to a slot
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  useEffect(() => {
    if (defaultFormation) {
      setFormation(defaultFormation);
    }
  }, [defaultFormation]);

  // Sync slot player lists when formation or player pool changes
  useEffect(() => {
    const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-2-3-1'];
    const allAvailableMap = new Map<string, Player>();
    [...players, ...squadPlayers].forEach((p) => allAvailableMap.set(p.id, p));
    const allAvailable = Array.from(allAvailableMap.values());

    setSlotPlayerLists((prev) => {
      const nextLists: Record<string, string[]> = { ...prev };

      slots.forEach((slot) => {
        // Find all players matching slot position code
        const matchingPlayers = allAvailable.filter(
          (p) => p.position === slot.positionCode || p.secondaryPositions?.includes(slot.positionCode)
        );

        const existingOrder = nextLists[slot.slotId] || [];
        // Keep valid existing IDs
        const validExisting = existingOrder.filter((id) => allAvailable.some((p) => p.id === id));

        // Add any missing matching player IDs sorted by rating descending
        const newMatchingIds = matchingPlayers
          .map((p) => p.id)
          .filter((id) => !validExisting.includes(id))
          .sort((a, b) => {
            const pA = allAvailable.find((p) => p.id === a);
            const pB = allAvailable.find((p) => p.id === b);
            return (pB?.rating || 0) - (pA?.rating || 0);
          });

        nextLists[slot.slotId] = [...validExisting, ...newMatchingIds];
      });

      return nextLists;
    });
  }, [formation, players, squadPlayers]);

  const handleSelectFormation = (newForm: FormationName) => {
    setFormation(newForm);
    if (onFormationChange) {
      onFormationChange(newForm);
    }
  };

  const toggleFieldConfig = (key: keyof PitchFieldsConfig) => {
    setFieldsConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllFields = (val: boolean) => {
    setFieldsConfig({
      showAge: val,
      showHeight: val,
      showFoot: val,
      showContract: val,
      showRating: val,
      showAgent: val,
    });
  };

  // Move player priority up or down in slot
  const handleReorderSlotPlayer = (slotId: string, fromIndex: number, toIndex: number) => {
    setSlotPlayerLists((prev) => {
      const currentList = [...(prev[slotId] || [])];
      if (fromIndex < 0 || fromIndex >= currentList.length) return prev;
      if (toIndex < 0 || toIndex >= currentList.length) return prev;

      const item = currentList.splice(fromIndex, 1)[0];
      currentList.splice(toIndex, 0, item);

      return { ...prev, [slotId]: currentList };
    });
  };

  // Remove player from slot
  const handleRemoveFromSlot = (slotId: string, playerId: string) => {
    setSlotPlayerLists((prev) => ({
      ...prev,
      [slotId]: (prev[slotId] || []).filter((id) => id !== playerId),
    }));
  };

  // Add player to slot
  const handleAddPlayerToSlot = (slotId: string, playerId: string) => {
    setSlotPlayerLists((prev) => {
      const current = prev[slotId] || [];
      if (current.includes(playerId)) return prev;
      return { ...prev, [slotId]: [...current, playerId] };
    });
    setIsAddPlayerModalOpen(false);
  };

  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-2-3-1'];
  const allAvailablePlayers = [...players, ...squadPlayers];
  const rows = [1, 2, 3, 4, 5];

  // Calculate overflow players for the Annex page
  const visibleLimitOnPitch = viewMode === 'depth' ? 3 : 1;
  const overflowBySlot = slots.map((slot) => {
    const playerIds = slotPlayerLists[slot.slotId] || [];
    const overflowIds = playerIds.slice(visibleLimitOnPitch);
    const overflowPlayers = overflowIds
      .map((id) => allAvailablePlayers.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);

    return {
      slot,
      overflowPlayers,
      startIndex: visibleLimitOnPitch + 1,
    };
  }).filter((item) => item.overflowPlayers.length > 0);

  const hasOverflow = overflowBySlot.length > 0;

  // Export to PDF
  const handleExportPdf = async () => {
    if (!pitchRef.current) return;
    setIsExportingPdf(true);
    setIsPdfExportingCollapsedOverride(true);

    try {
      // Pause to allow React to re-render pitch cards into collapsed mode for PDF
      await new Promise((r) => setTimeout(r, 200));

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Render Pitch Canvas
      const pitchCanvas = await html2canvas(pitchRef.current, {
        scale: 2,
        backgroundColor: '#0c1410',
        useCORS: true,
        logging: false,
      });

      // PDF Page 1 Header
      pdf.setFillColor(28, 27, 28);
      pdf.rect(0, 0, pdfWidth, 18, 'F');
      pdf.setTextColor(229, 226, 227);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Campo Tático & Matriz de Sucessão (${formation})`, 10, 11);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(228, 190, 188);
      pdf.text(
        `Modo: ${viewMode === 'depth' ? 'Profundidade (Listas)' : 'Compacta'} | Data: ${new Date().toLocaleDateString('pt-PT')}`,
        pdfWidth - 10,
        11,
        { align: 'right' }
      );

      // Pitch Image Placement
      const imgData1 = pitchCanvas.toDataURL('image/png');
      const marginTop = 22;
      const maxImgHeight = pdfHeight - marginTop - 8;
      const maxImgWidth = pdfWidth - 20;

      let renderWidth = maxImgWidth;
      let renderHeight = (pitchCanvas.height * renderWidth) / pitchCanvas.width;

      if (renderHeight > maxImgHeight) {
        renderHeight = maxImgHeight;
        renderWidth = (pitchCanvas.width * renderHeight) / pitchCanvas.height;
      }

      const xPos = (pdfWidth - renderWidth) / 2;
      pdf.addImage(imgData1, 'PNG', xPos, marginTop, renderWidth, renderHeight);

      // Annex Page 2 (if overflow players exist)
      if (hasOverflow && annexRef.current) {
        const annexCanvas = await html2canvas(annexRef.current, {
          scale: 2,
          backgroundColor: '#1c1b1c',
          useCORS: true,
          logging: false,
        });

        pdf.addPage('a4', 'landscape');

        // Annex Header
        pdf.setFillColor(28, 27, 28);
        pdf.rect(0, 0, pdfWidth, 18, 'F');
        pdf.setTextColor(255, 83, 91);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`ANEXO: Atletas Excedentes / Profundidade Adicional`, 10, 11);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(228, 190, 188);
        pdf.text(`Página 2 de 2`, pdfWidth - 10, 11, { align: 'right' });

        const imgData2 = annexCanvas.toDataURL('image/png');
        let renderWidth2 = pdfWidth - 20;
        let renderHeight2 = (annexCanvas.height * renderWidth2) / annexCanvas.width;

        if (renderHeight2 > maxImgHeight) {
          renderHeight2 = maxImgHeight;
          renderWidth2 = (annexCanvas.width * renderHeight2) / annexCanvas.height;
        }

        const xPos2 = (pdfWidth - renderWidth2) / 2;
        pdf.addImage(imgData2, 'PNG', xPos2, marginTop, renderWidth2, renderHeight2);
      }

      pdf.save(`campo_tatico_shadow_xi_${formation.toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setIsPdfExportingCollapsedOverride(false);
      setIsExportingPdf(false);
    }
  };

  // Helper renderer for individual player analytical card
  const renderPlayerCardContent = (player: Player, isTop: boolean, rank: number) => {
    const isCollapsed = isPdfExportingCollapsedOverride || !!collapsedPlayerIds[player.id];

    // Minimalist Collapsed Rectangle State
    if (isCollapsed) {
      return (
        <div
          key={player.id}
          onClick={(e) => {
            e.stopPropagation();
            onPlayerClick(player);
          }}
          className={`p-1.5 px-2 rounded-lg bg-[#131314]/95 border transition-all cursor-pointer hover:border-[#ff535b] ${
            isTop
              ? 'border-[#ff535b]/60 bg-[#1c1b1c] shadow-md'
              : 'border-[#26262B] hover:bg-[#1a191a]'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            {/* Rank + Name */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className={`font-mono-data text-[9px] font-black px-1 py-0.2 rounded shrink-0 ${
                  isTop ? 'bg-[#ff535b] text-white' : 'bg-[#26262B] text-[#e4bebc]'
                }`}
              >
                #{rank}
              </span>
              <span className="font-extrabold text-xs text-[#e5e2e3] truncate hover:text-[#ff535b]">
                {player.shortName || player.name}
              </span>
            </div>

            {/* Rating Star Badge + Chevron pointing down */}
            <div className="flex items-center gap-1 shrink-0">
              <StarRating value={player.rating} size="xs" />
              <button
                type="button"
                onClick={(e) => togglePlayerCollapse(player.id, e)}
                className="text-[#e4bebc] hover:text-[#ff535b] p-0.5 rounded hover:bg-[#26262B] transition-colors"
                title="Expandir cartão"
              >
                <span className="material-symbols-outlined text-[16px] block">expand_more</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Expanded State
    return (
      <div
        key={player.id}
        onClick={(e) => {
          e.stopPropagation();
          onPlayerClick(player);
        }}
        className={`p-2 rounded-lg bg-[#131314]/95 border transition-all cursor-pointer hover:border-[#ff535b] ${
          isTop
            ? 'border-[#ff535b]/60 bg-[#1c1b1c] shadow-md'
            : 'border-[#26262B] hover:bg-[#1a191a]'
        }`}
      >
        {/* Card Header: Rank + Short Name + Chevron pointing up */}
        <div className="flex items-center justify-between gap-1 border-b border-[#26262B] pb-1 mb-1">
          <div
            onClick={(e) => togglePlayerCollapse(player.id, e)}
            className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
          >
            <span
              className={`font-mono-data text-[9px] font-black px-1 py-0.2 rounded shrink-0 ${
                isTop ? 'bg-[#ff535b] text-white' : 'bg-[#26262B] text-[#e4bebc]'
              }`}
            >
              #{rank}
            </span>
            <span className="font-extrabold text-xs text-[#e5e2e3] truncate hover:text-[#ff535b]">
              {player.shortName || player.name}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => togglePlayerCollapse(player.id, e)}
            className="text-[#e4bebc] hover:text-[#ff535b] p-0.5 rounded hover:bg-[#26262B] transition-colors shrink-0"
            title="Encolher cartão"
          >
            <span className="material-symbols-outlined text-[16px] block">expand_less</span>
          </button>
        </div>

        {/* Dynamic Analytical Details */}
        <div className="flex flex-col gap-1 text-[10px]">
          {fieldsConfig.showRating && (
            <div className="flex items-center justify-between bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-[#26262B]">
              <span className="text-[#e4bebc] font-bold text-[10px]">Rating</span>
              <StarRating value={player.rating} size="xs" />
            </div>
          )}

          {(fieldsConfig.showAge || fieldsConfig.showHeight) && (
            <div className="flex justify-between items-center text-[#e4bebc]">
              {fieldsConfig.showAge && (
                <span>
                  Idade: <strong className="text-[#e5e2e3] font-mono-data">{getPlayerAge(player)}a</strong>
                </span>
              )}
              {fieldsConfig.showHeight && (
                <span>
                  Alt: <strong className="text-[#e5e2e3] font-mono-data">{player.heightCm}cm</strong>
                </span>
              )}
            </div>
          )}

          {fieldsConfig.showFoot && (
            <div className="text-[#e4bebc] flex items-center gap-1 truncate">
              <span>Pé:</span>
              <FootIndicator foot={player.dominantFoot} size="xs" />
            </div>
          )}

          {fieldsConfig.showContract && player.contractEnd && (
            <div className="text-[#e4bebc] flex justify-between items-center truncate">
              <span>Contrato:</span>
              <strong
                className={`font-mono-data ${
                  player.isContractExpiringSoon ? 'text-[#ff535b]' : 'text-[#e5e2e3]'
                }`}
              >
                {player.contractEnd}
              </strong>
            </div>
          )}

          {fieldsConfig.showAgent && (
            <div className="text-[#e4bebc] truncate">
              Agente: <strong className="text-[#e5e2e3]">{player.agent}</strong>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top Tactical Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-3.5 bg-[#1c1b1c] rounded-lg border border-[#353436] gap-3 z-20">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#ff535b] text-[22px]">strategy</span>
          <div>
            <div className="font-bold text-sm text-[#e5e2e3]">Campo Tático & Matriz de Sucessão</div>
            <div className="text-[11px] text-[#e4bebc]">
              Nodos de posição dinâmica com listas de profundidade
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 bg-[#26262B] text-[#e5e2e3] border border-[#353436] hover:bg-[#ff535b] hover:border-[#ff535b] hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Exportar Campo Tático e Anexo para PDF"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isExportingPdf ? 'sync' : 'picture_as_pdf'}
            </span>
            <span>{isExportingPdf ? 'A Gerar PDF...' : 'Exportar PDF'}</span>
          </button>

          {/* View Mode Toggle (Compact vs Depth) */}
          <div className="flex bg-[#0A0A0B] p-0.5 rounded border border-[#353436]">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-[#ff535b] text-white shadow-xs'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
              title="Mostrar apenas titular #1 por posição"
            >
              <span className="material-symbols-outlined text-[14px]">grid_view</span>
              <span>Vista Compacta</span>
            </button>
            <button
              onClick={() => setViewMode('depth')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'depth'
                  ? 'bg-[#ff535b] text-white shadow-xs'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
              title="Expandir listas de até 3 jogadores por posição"
            >
              <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
              <span>Vista de Profundidade</span>
            </button>
          </div>

          {/* Formation Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#e4bebc]">
              Formação:
            </label>
            <select
              value={formation}
              onChange={(e) => handleSelectFormation(e.target.value as FormationName)}
              className="bg-[#0A0A0B] border border-[#353436] text-[#e5e2e3] font-mono-data text-xs py-1.5 px-3 rounded cursor-pointer focus:outline-none focus:border-[#ff535b]"
            >
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="4-3-3">4-3-3</option>
              <option value="3-4-3">3-4-3</option>
              <option value="4-4-2">4-4-2 (Clássico)</option>
              <option value="4-1-4-1">4-1-4-1</option>
              <option value="4-4-1-1">4-4-1-1</option>
              <option value="4-2-2-2">4-2-2-2 (Quadrado)</option>
              <option value="4-3-1-2">4-3-1-2 (Losango)</option>
              <option value="3-5-2">3-5-2</option>
              <option value="3-4-2-1">3-4-2-1</option>
              <option value="5-3-2">5-3-2</option>
              <option value="5-4-1">5-4-1</option>
            </select>
          </div>

          {/* View Settings Dropdown Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setIsConfigOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isConfigOpen
                  ? 'bg-[#ff535b] text-white border-[#ff535b]'
                  : 'bg-[#0A0A0B] text-[#e5e2e3] border-[#353436] hover:border-[#ff535b]'
              }`}
              title="Configurar Campos Visíveis"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Configurar Vista</span>
              <span className="material-symbols-outlined text-[14px]">
                {isConfigOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* View Config Dropdown Popover */}
            {isConfigOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1c1b1c] border border-[#353436] rounded-xl shadow-2xl p-4 z-50 animate-fade-in flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-[#26262B] pb-2">
                  <span className="text-xs font-bold text-[#e5e2e3] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#ff535b] text-[16px]">visibility</span>
                    Mostrar no Relvado
                  </span>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <button
                      onClick={() => handleSelectAllFields(true)}
                      className="text-[#98cdf2] hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-[#353436]">|</span>
                    <button
                      onClick={() => handleSelectAllFields(false)}
                      className="text-[#ff535b] hover:underline"
                    >
                      Nenhum
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showRating}
                      onChange={() => toggleFieldConfig('showRating')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Rating (Estrela)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showAge}
                      onChange={() => toggleFieldConfig('showAge')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Idade</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showHeight}
                      onChange={() => toggleFieldConfig('showHeight')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Altura</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showFoot}
                      onChange={() => toggleFieldConfig('showFoot')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Pé Preferencial</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showContract}
                      onChange={() => toggleFieldConfig('showContract')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Fim de Contrato</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#e5e2e3] cursor-pointer hover:text-[#ff535b]">
                    <input
                      type="checkbox"
                      checked={fieldsConfig.showAgent}
                      onChange={() => toggleFieldConfig('showAgent')}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span>Agente</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-[#26262B] text-right">
                  <button
                    onClick={() => setIsConfigOpen(false)}
                    className="px-3 py-1 bg-[#ff535b] text-white text-xs font-bold rounded hover:brightness-110"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tactical Pitch Container (Responsive Dynamic Spacing to avoid overlaps) */}
      <div
        ref={pitchRef}
        className={`flex-1 bg-[#0c1410] rounded-xl border border-[#353436]/40 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-8 transition-all shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] ${
          viewMode === 'depth' ? 'min-h-[850px] py-8' : 'min-h-[620px]'
        }`}
      >
        {/* Pitch Visual Overlay Grid */}
        <div className="absolute inset-0 pitch-grid opacity-20 pointer-events-none" />

        {/* Pitch Markings */}
        <div className="absolute inset-x-6 inset-y-6 pitch-lines opacity-20 rounded-md pointer-events-none">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 pitch-circle" />
          <div className="absolute top-0 left-1/2 w-[60%] h-[20%] border-b-2 border-x-2 border-white/20 -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-[60%] h-[20%] border-t-2 border-x-2 border-white/20 -translate-x-1/2" />
        </div>

        {/* Tactical Slots Rows */}
        <div className={`relative z-10 flex flex-col justify-around h-full max-w-[1020px] mx-auto w-full ${
          viewMode === 'depth' ? 'gap-8 sm:gap-10' : 'gap-5'
        }`}>
          {rows.map((rowNum) => {
            const rowSlots = slots.filter((s) => s.row === rowNum);
            if (rowSlots.length === 0) return null;

            return (
              <div
                key={rowNum}
                className="flex justify-around items-start w-full px-2 gap-2 sm:gap-4 flex-wrap sm:flex-nowrap"
              >
                {rowSlots.map((slot) => {
                  const playerIds = slotPlayerLists[slot.slotId] || [];
                  const slotPlayers = playerIds
                    .map((id) => allAvailablePlayers.find((p) => p.id === id))
                    .filter((p): p is Player => p !== undefined);

                  // COMPACT VIEW
                  if (viewMode === 'compact') {
                    const priorityPlayer = slotPlayers[0];
                    const extraCount = Math.max(0, slotPlayers.length - 1);

                    if (priorityPlayer) {
                      return (
                        <div
                          key={slot.slotId}
                          onClick={() => setActiveDepthSlot(slot)}
                          className="w-32 sm:w-38 min-h-[95px] bg-[#131314]/95 border border-[#353436] rounded-lg flex flex-col p-2.5 relative shadow-2xl cursor-pointer hover:border-[#ff535b] hover:shadow-[0_0_15px_rgba(255,83,91,0.25)] transition-all group active:scale-95"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-[#ff535b] rounded-t-lg" />

                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono-data text-[10px] font-extrabold text-[#ff535b] uppercase tracking-wider bg-[#ff535b]/10 border border-[#ff535b]/30 px-1.5 py-0.5 rounded">
                              {slot.positionCode}
                            </span>

                            {extraCount > 0 && (
                              <span
                                className="bg-[#ff535b] text-white font-mono-data text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md flex items-center gap-0.5"
                                title={`Mais ${extraCount} jogador(es) referenciado(s)`}
                              >
                                +{extraCount}
                              </span>
                            )}
                          </div>

                          <div className="font-extrabold text-xs text-[#e5e2e3] truncate w-full text-center py-1 border-b border-[#26262B] group-hover:text-[#ff535b] transition-colors">
                            {priorityPlayer.shortName || priorityPlayer.name}
                          </div>

                          <div className="flex flex-col gap-1 mt-1.5 text-[10px]">
                            {fieldsConfig.showRating && (
                              <div className="flex items-center justify-between bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-[#26262B]">
                                <span className="text-[#e4bebc] font-bold">Rating</span>
                                <StarRating value={priorityPlayer.rating} size="xs" />
                              </div>
                            )}

                            {(fieldsConfig.showAge || fieldsConfig.showHeight) && (
                              <div className="flex justify-between items-center text-[#e4bebc]">
                                {fieldsConfig.showAge && (
                                  <span>
                                    Idade: <strong className="text-[#e5e2e3] font-mono-data">{getPlayerAge(priorityPlayer)}a</strong>
                                  </span>
                                )}
                                {fieldsConfig.showHeight && (
                                  <span>
                                    Alt: <strong className="text-[#e5e2e3] font-mono-data">{priorityPlayer.heightCm}cm</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {fieldsConfig.showFoot && (
                              <div className="text-[#e4bebc] flex items-center gap-1 truncate">
                                <span>Pé:</span>
                                <FootIndicator foot={priorityPlayer.dominantFoot} size="xs" />
                              </div>
                            )}

                            {fieldsConfig.showContract && (
                              <div className="text-[#e4bebc] flex justify-between">
                                <span>Contrato:</span>
                                <strong
                                  className={`font-mono-data ${
                                    priorityPlayer.isContractExpiringSoon ? 'text-[#ff535b]' : 'text-[#e5e2e3]'
                                  }`}
                                >
                                  {priorityPlayer.contractEnd}
                                </strong>
                              </div>
                            )}

                            {fieldsConfig.showAgent && (
                              <div className="text-[#e4bebc] truncate">
                                Agente: <strong className="text-[#e5e2e3]">{priorityPlayer.agent}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slot.slotId}
                        onClick={() => setActiveDepthSlot(slot)}
                        className="w-28 sm:w-34 min-h-[90px] bg-[#0e0e0f]/80 backdrop-blur-xs border border-dashed border-[#5b403f] rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-[#353436]/60 transition-all group active:scale-95"
                      >
                        <div className="w-8 h-8 rounded-full border border-dashed border-[#5b403f] flex items-center justify-center text-[#e4bebc] group-hover:text-[#ffb3b1] group-hover:border-[#ff535b] transition-colors mb-1">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </div>
                        <span className="font-bold text-xs text-[#e4bebc] group-hover:text-[#e5e2e3]">
                          {slot.positionCode}
                        </span>
                        <span className="text-[9px] text-[#e4bebc]/70 font-mono-data mt-0.5">Sem Alvo</span>
                      </div>
                    );
                  }

                  // VISTA DE PROFUNDIDADE (EXPANDED LIST UP TO 3 PLAYERS)
                  const top3Players = slotPlayers.slice(0, 3);
                  const overflowCount = Math.max(0, slotPlayers.length - 3);

                  return (
                    <div
                      key={slot.slotId}
                      className="w-34 sm:w-44 flex flex-col gap-1.5 p-2 bg-[#0e0e0f]/90 border border-[#353436] rounded-xl shadow-2xl relative"
                    >
                      {/* Slot Position Header */}
                      <div
                        onClick={() => setActiveDepthSlot(slot)}
                        className="flex justify-between items-center pb-1 border-b border-[#26262B] cursor-pointer hover:text-[#ff535b]"
                      >
                        <span className="font-mono-data text-[10px] font-black text-[#ff535b] uppercase tracking-wider bg-[#ff535b]/10 border border-[#ff535b]/30 px-1.5 py-0.2 rounded">
                          {slot.positionCode}
                        </span>
                        <span className="text-[10px] text-[#e4bebc] font-bold">
                          {slotPlayers.length} Atleta(s)
                        </span>
                      </div>

                      {/* Stack of Cards (Max 3) */}
                      {top3Players.length === 0 ? (
                        <div
                          onClick={() => setActiveDepthSlot(slot)}
                          className="py-4 border border-dashed border-[#5b403f] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#26262B]"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#e4bebc]">add</span>
                          <span className="text-[10px] text-[#e4bebc]">Sem Atletas</span>
                        </div>
                      ) : (
                        top3Players.map((p, idx) =>
                          renderPlayerCardContent(p, idx === 0, idx + 1)
                        )
                      )}

                      {/* Hidden Overflow Badge (+X Jogadores) */}
                      {overflowCount > 0 && (
                        <div
                          onClick={() => setActiveDepthSlot(slot)}
                          className="mt-0.5 py-1 px-2 bg-[#ff535b]/20 border border-[#ff535b]/40 rounded-lg text-center cursor-pointer hover:bg-[#ff535b]/30 transition-all"
                        >
                          <span className="font-mono-data text-[10px] font-extrabold text-[#ff535b] flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">group</span>
                            <span>+{overflowCount} Jogadores</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* HIDDEN ANNEX CONTAINER FOR PDF EXPORT */}
      {hasOverflow && (
        <div className="hidden">
          <div
            ref={annexRef}
            className="p-8 bg-[#1c1b1c] text-[#e5e2e3] flex flex-col gap-6 w-[1100px]"
          >
            <div className="border-b border-[#353436] pb-3 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-[#ff535b] flex items-center gap-2">
                  <span className="material-symbols-outlined">dataset</span>
                  ANEXO: ATLETAS EXCEDENTES / PROFUNDIDADE ALÉM DO LIMITE
                </h2>
                <p className="text-xs text-[#e4bebc]">
                  Lista completa de jogadores referenciados por posição além dos visíveis no relvado
                </p>
              </div>
              <div className="text-right font-mono-data text-xs text-[#e4bebc]">
                Formação: {formation}
              </div>
            </div>

            {/* Table of Overflow Players */}
            <div className="flex flex-col gap-4">
              {overflowBySlot.map(({ slot, overflowPlayers, startIndex }) => (
                <div key={slot.slotId} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ff535b] bg-[#221819] p-2 rounded border border-[#ff535b]/30">
                    <span className="font-mono-data px-1.5 py-0.5 bg-[#ff535b] text-white rounded text-[10px]">
                      {slot.positionCode}
                    </span>
                    <span>{slot.positionName}</span>
                    <span className="text-[#e4bebc] font-normal ml-auto">
                      {overflowPlayers.length} atleta(s) suplente(s)
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse bg-[#141416] rounded border border-[#26262B]">
                    <thead>
                      <tr className="border-b border-[#26262B] text-[#e4bebc] font-bold text-[10px] uppercase bg-[#1a191a]">
                        <th className="p-2 w-10">#</th>
                        <th className="p-2">Nome / Atleta</th>
                        <th className="p-2">Clube</th>
                        {fieldsConfig.showRating && <th className="p-2">Rating</th>}
                        {fieldsConfig.showAge && <th className="p-2">Idade</th>}
                        {fieldsConfig.showHeight && <th className="p-2">Altura</th>}
                        {fieldsConfig.showFoot && <th className="p-2">Pé</th>}
                        {fieldsConfig.showContract && <th className="p-2">Contrato</th>}
                        {fieldsConfig.showMarketValue && <th className="p-2">Valor</th>}
                        {fieldsConfig.showAgent && <th className="p-2">Agente</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {overflowPlayers.map((p, idx) => (
                        <tr key={p.id} className="border-b border-[#26262B]/50 hover:bg-[#1c1b1c]">
                          <td className="p-2 font-mono-data text-[#e4bebc] font-bold">
                            #{startIndex + idx}
                          </td>
                          <td className="p-2 font-bold text-[#e5e2e3]">{p.name}</td>
                          <td className="p-2 text-[#e4bebc]">{p.club}</td>
                          {fieldsConfig.showRating && (
                            <td className="p-2 font-bold text-[#e5e2e3]">
                              <StarRating value={p.rating} size="xs" />
                            </td>
                          )}
                          {fieldsConfig.showAge && (
                            <td className="p-2 font-mono-data text-[#e5e2e3]">{p.age}a</td>
                          )}
                          {fieldsConfig.showHeight && (
                            <td className="p-2 font-mono-data text-[#e5e2e3]">{p.heightCm}cm</td>
                          )}
                          {fieldsConfig.showFoot && (
                            <td className="p-2 text-[#e5e2e3]">
                              <FootIndicator foot={p.dominantFoot} size="xs" />
                            </td>
                          )}
                          {fieldsConfig.showContract && (
                            <td className="p-2 font-mono-data text-[#e5e2e3]">{p.contractEnd}</td>
                          )}
                          {fieldsConfig.showMarketValue && (
                            <td className="p-2 font-mono-data text-[#98cdf2] font-bold">
                              {p.marketValueFormatted}
                            </td>
                          )}
                          {fieldsConfig.showAgent && (
                            <td className="p-2 text-[#e5e2e3]">{p.agent}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POSITION DEPTH CHART MODAL (NO PHOTOS, REORDERABLE PRIORITIES) */}
      {activeDepthSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-[#1c1b1c] border border-[#353436] rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#26262B] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono-data text-xs font-extrabold text-[#ff535b] bg-[#ff535b]/10 border border-[#ff535b]/30 px-2 py-0.5 rounded">
                  {activeDepthSlot.positionCode}
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#e5e2e3]">
                    Matriz de Sucessão & Profundidade ({activeDepthSlot.positionName})
                  </h3>
                  <p className="text-xs text-[#e4bebc]">
                    Ajuste a ordem de prioridade (#1 é o titular visível no relvado)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDepthSlot(null)}
                className="text-[#e4bebc] hover:text-[#e5e2e3] p-1 rounded-full hover:bg-[#26262B]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Depth Player List (OMITTING ALL PHOTOS) */}
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {(() => {
                const playerIds = slotPlayerLists[activeDepthSlot.slotId] || [];
                const slotPlayers = playerIds
                  .map((id) => allAvailablePlayers.find((p) => p.id === id))
                  .filter((p): p is Player => p !== undefined);

                if (slotPlayers.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-[#e4bebc] bg-[#141416] rounded-lg border border-[#26262B]">
                      Nenhum jogador associado a esta posição.
                    </div>
                  );
                }

                return slotPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      idx === 0
                        ? 'bg-[#221819] border-[#ff535b]/50 shadow-md'
                        : 'bg-[#141416] border-[#26262B] hover:border-[#353436]'
                    }`}
                  >
                    {/* Left Rank & Details (NO PHOTO) */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono-data text-xs font-black px-2 py-1 rounded shrink-0 ${
                          idx === 0
                            ? 'bg-[#ff535b] text-white'
                            : 'bg-[#26262B] text-[#e4bebc]'
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              setActiveDepthSlot(null);
                              onPlayerClick(p);
                            }}
                            className="font-bold text-sm text-[#e5e2e3] hover:text-[#ff535b] cursor-pointer truncate"
                          >
                            {p.name}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold text-[#ff535b] bg-[#ff535b]/10 px-1.5 py-0.2 rounded border border-[#ff535b]/30">
                              ALVO #1
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#e4bebc] truncate flex items-center gap-2">
                          <span>{p.club}</span>
                          <span>•</span>
                          <span>{p.age}a</span>
                          <span>•</span>
                          <FootIndicator foot={p.dominantFoot} size="xs" />
                          <span>•</span>
                          <span className="font-mono-data text-[#98cdf2] font-bold">
                            {p.marketValueFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Controls: Star Rating Badge + Reorder Buttons + Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      <StarRating value={p.rating} size="xs" />

                      <div className="flex flex-col gap-0.5 ml-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleReorderSlotPlayer(activeDepthSlot.slotId, idx, idx - 1)}
                          className="p-0.5 rounded bg-[#26262B] hover:bg-[#ff535b] text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
                          title="Subir Prioridade"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </button>
                        <button
                          disabled={idx === slotPlayers.length - 1}
                          onClick={() => handleReorderSlotPlayer(activeDepthSlot.slotId, idx, idx + 1)}
                          className="p-0.5 rounded bg-[#26262B] hover:bg-[#ff535b] text-white disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
                          title="Descer Prioridade"
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromSlot(activeDepthSlot.slotId, p.id)}
                        className="p-1 rounded text-[#e4bebc] hover:text-[#ff535b] hover:bg-[#26262B] transition-colors ml-1 cursor-pointer"
                        title="Remover desta posição"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-[#26262B]">
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="px-3 py-1.5 bg-[#26262B] hover:bg-[#353436] text-[#e5e2e3] text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Adicionar Atleta a esta Posição</span>
              </button>

              <button
                onClick={() => setActiveDepthSlot(null)}
                className="px-4 py-1.5 bg-[#ff535b] text-white text-xs font-bold rounded hover:brightness-110 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Player to Active Slot */}
      {isAddPlayerModalOpen && activeDepthSlot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
          <div className="bg-[#1c1b1c] border border-[#353436] rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#26262B] pb-3">
              <h4 className="font-bold text-sm text-[#e5e2e3]">
                Vincular Atleta a {activeDepthSlot.positionCode}
              </h4>
              <button
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="text-[#e4bebc] hover:text-[#e5e2e3]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {allAvailablePlayers.map((p) => {
                const currentSlotList = slotPlayerLists[activeDepthSlot.slotId] || [];
                const isAlreadyInSlot = currentSlotList.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isAlreadyInSlot) {
                        handleAddPlayerToSlot(activeDepthSlot.slotId, p.id);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isAlreadyInSlot
                        ? 'bg-[#141416] border-[#26262B] opacity-50 cursor-not-allowed'
                        : 'bg-[#141416] border-[#26262B] hover:border-[#ff535b] hover:bg-[#221819] cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#e5e2e3]">{p.name}</span>
                      <span className="text-[11px] text-[#e4bebc]">
                        {p.club} • {p.position} • {p.marketValueFormatted}
                      </span>
                    </div>
                    <div>
                      {isAlreadyInSlot ? (
                        <span className="text-[10px] text-[#e4bebc]">Adicionado</span>
                      ) : (
                        <span className="material-symbols-outlined text-[#ff535b] text-[18px]">
                          add_circle
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#26262B]">
              <button
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="px-3 py-1.5 bg-[#26262B] text-[#e5e2e3] text-xs font-bold rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

