import React, { useState, useRef, useEffect } from 'react';
import { ShadowTeam } from '../types';

interface ShadowTeamSelectorProps {
  teams: ShadowTeam[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onRequestCreateTeam: () => void;
  onDeleteTeam?: (teamId: string) => void;
  onRenameTeam?: (teamId: string, newName: string) => void;
}

export const ShadowTeamSelector: React.FC<ShadowTeamSelectorProps> = ({
  teams,
  activeTeamId,
  onSelectTeam,
  onRequestCreateTeam,
  onDeleteTeam,
  onRenameTeam,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingTeamId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (team: ShadowTeam, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTeamId(team.id);
    setRenameInput(team.name);
  };

  const handleSaveRename = (teamId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameInput.trim() && onRenameTeam) {
      onRenameTeam(teamId, renameInput.trim());
    }
    setEditingTeamId(null);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Dynamic Title Selector Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 md:gap-3 text-left focus:outline-none cursor-pointer py-1 select-none"
        title="Alternar ou Criar Shadow Team"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#e5e2e3] group-hover:text-[#ffb3b1] transition-colors">
              {activeTeam ? activeTeam.name : 'Shadow Team'}
            </h1>
            <div className="w-8 h-8 rounded-xl bg-[#1C1C1F] group-hover:bg-[#ff535b]/20 border border-[#353436] group-hover:border-[#ff535b] flex items-center justify-center transition-all shadow-sm">
              <span
                className={`material-symbols-outlined text-[#ff535b] text-[22px] transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                keyboard_arrow_down
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#e4bebc] flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#ff535b] animate-pulse"></span>
            <span>Clique para alternar equipa</span>
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-80 sm:w-96 bg-[#141416]/98 backdrop-blur-md border border-[#353436] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-3 z-40 animate-fade-in divide-y divide-[#26262B]">
          {/* Header */}
          <div className="pb-2.5 px-2 flex items-center justify-between">
            <span className="text-[11px] font-mono-data font-bold uppercase tracking-wider text-[#e4bebc]">
              As Tuas Shadow Teams ({teams.length})
            </span>
            <span className="text-[10px] text-[#e4bebc] bg-[#1C1C1F] px-2 py-0.5 rounded font-mono-data border border-[#26262B]">
              Ativa: {activeTeam?.players.length || 0} alvos
            </span>
          </div>

          {/* Teams List */}
          <div className="py-2 max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
            {teams.map((team) => {
              const isSelected = team.id === activeTeamId;
              const isEditing = editingTeamId === team.id;

              return (
                <div
                  key={team.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectTeam(team.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`group/item flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1C1F] border border-[#ff535b]/50 shadow-md'
                      : 'hover:bg-[#1C1C1F]/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono-data ${
                        isSelected
                          ? 'bg-[#ff535b] text-white'
                          : 'bg-[#26262B] text-[#e4bebc] group-hover/item:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                      )}
                    </div>

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(team.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          className="w-full bg-[#0e0e0f] border border-[#ff535b] text-xs font-bold text-[#e5e2e3] px-2 py-1 rounded outline-none"
                        />
                        <button
                          type="submit"
                          className="text-xs bg-[#ff535b] text-white px-2 py-1 rounded font-bold"
                        >
                          OK
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#e5e2e3]' : 'text-[#e4bebc] group-hover/item:text-[#e5e2e3]'
                          }`}
                        >
                          {team.name}
                        </span>
                        <span className="text-[10px] text-[#e4bebc] font-mono-data">
                          {team.players.length} {team.players.length === 1 ? 'Jogador' : 'Jogadores'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Rename / Delete) */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-80 group-hover/item:opacity-100">
                      {onRenameTeam && (
                        <button
                          onClick={(e) => handleStartRename(team, e)}
                          className="p-1 rounded text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#26262B] transition-colors"
                          title="Editar Nome"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                      )}
                      {onDeleteTeam && teams.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Tens a certeza que queres eliminar a "${team.name}"? Esta ação eliminará os seus jogadores associados.`
                              )
                            ) {
                              onDeleteTeam(team.id);
                            }
                          }}
                          className="p-1 rounded text-[#e4bebc] hover:text-[#ff535b] hover:bg-[#ff535b]/10 transition-colors"
                          title="Eliminar Shadow Team"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Action: Permanent '+ Criar Nova Shadow Team' option */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onRequestCreateTeam();
              }}
              className="w-full bg-[#1C1C1F] hover:bg-[#ff535b] text-[#ffb3b1] hover:text-white border border-[#26262B] hover:border-[#ff535b] py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Criar Nova Shadow Team</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
