import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, Contact, MatchReport, MainView } from '../types';
import { Avatar } from './Avatar';

interface GlobalSearchProps {
  globalPlayers: Player[];
  squadPlayers: Player[];
  contacts: Contact[];
  matches: MatchReport[];
  onNavigate: (view: MainView) => void;
  onPlayerClick: (player: Player) => void;
  onContactClick?: (contact: Contact) => void;
  onMatchClick?: (match: MatchReport) => void;
  onTriggerToast: (msg: string) => void;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  globalPlayers = [],
  squadPlayers = [],
  contacts = [],
  matches = [],
  onNavigate,
  onPlayerClick,
  onContactClick,
  onMatchClick,
  onTriggerToast,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine and deduplicate players
  const allPlayers = useMemo(() => {
    const map = new Map<string, Player>();
    [...squadPlayers, ...globalPlayers].forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [squadPlayers, globalPlayers]);

  // Global Keyboard listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items in real-time across the three databases
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        players: [],
        contacts: [],
        matches: [],
        total: 0,
      };
    }

    // 1. Players
    const matchedPlayers = allPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        p.position.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        (p.league && p.league.toLowerCase().includes(q))
    );

    // 2. Contacts
    const matchedContacts = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.contactType.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );

    // 3. Matches / Reports
    const matchedMatches = matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.competition.toLowerCase().includes(q) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        (m.assignedScout && m.assignedScout.toLowerCase().includes(q)) ||
        m.status.toLowerCase().includes(q) ||
        m.date.toLowerCase().includes(q)
    );

    return {
      players: matchedPlayers,
      contacts: matchedContacts,
      matches: matchedMatches,
      total: matchedPlayers.length + matchedContacts.length + matchedMatches.length,
    };
  }, [query, allPlayers, contacts, matches]);

  // Flattened list for keyboard selection
  const flattenedList = useMemo(() => {
    const list: { type: 'player' | 'contact' | 'match'; data: any }[] = [];
    filteredResults.players.forEach((p) => list.push({ type: 'player', data: p }));
    filteredResults.contacts.forEach((c) => list.push({ type: 'contact', data: c }));
    filteredResults.matches.forEach((m) => list.push({ type: 'match', data: m }));
    return list;
  }, [filteredResults]);

  // Handle keyboard navigation inside search list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flattenedList.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedList.length) % Math.max(1, flattenedList.length));
    } else if (e.key === 'Enter' && flattenedList.length > 0) {
      e.preventDefault();
      const item = flattenedList[selectedIndex];
      if (item) {
        if (item.type === 'player') handleSelectPlayer(item.data);
        else if (item.type === 'contact') handleSelectContact(item.data);
        else if (item.type === 'match') handleSelectMatch(item.data);
      }
    }
  };

  const handleSelectPlayer = (player: Player) => {
    onPlayerClick(player);
    onTriggerToast(`Perfil do atleta ${player.name} aberto.`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectContact = (contact: Contact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      onNavigate('contacts');
    }
    onTriggerToast(`Detalhes do contacto ${contact.name} (${contact.organization}) abertos em modal.`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectMatch = (match: MatchReport) => {
    if (onMatchClick) {
      onMatchClick(match);
    } else {
      onNavigate('matches');
    }
    onTriggerToast(`Relatório do jogo ${match.homeTeam} vs ${match.awayTeam} aberto em modal.`);
    setIsOpen(false);
    setQuery('');
  };

  const getMatchStatusBadge = (status: MatchReport['status']) => {
    switch (status) {
      case 'concluido':
        return { label: 'Concluído', bg: 'bg-[#1b4332]', text: 'text-[#74c69d]' };
      case 'em_analise':
        return { label: 'Em Análise', bg: 'bg-[#0b4e6e]/40', text: 'text-[#8abfe4]' };
      default:
        return { label: 'Agendado', bg: 'bg-[#353436]', text: 'text-[#e5e2e3]' };
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-md ${className}`}>
      {/* SEARCH BAR INPUT HEADER */}
      <div className="relative flex items-center w-full">
        <span className="material-symbols-outlined absolute left-3 text-[#e4bebc]/70 text-[18px] pointer-events-none">
          search
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Pesquisa rápida de jogadores, contactos ou jogos..."
          className="w-full bg-[#141416] hover:bg-[#1C1C1F] focus:bg-[#1C1C1F] border border-[#26262B] focus:border-[#ff535b] text-[#e5e2e3] text-xs pl-9 pr-8 py-1.5 rounded-xl outline-none transition-all"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-1 text-[#e4bebc] hover:text-white transition-colors cursor-pointer"
            title="Limpar pesquisa"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* DROPDOWN COMMAND PALETTE OVERLAY */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#141416] border border-[#26262B] rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[480px] animate-fade-in">
          {/* SEARCH METRICS / QUICK SUGGESTIONS HEADER */}
          <div className="p-2.5 bg-[#0e0e0f] border-b border-[#26262B] flex items-center justify-between text-[11px] text-[#e4bebc]">
            {query.trim() ? (
              <span className="font-mono-data font-bold text-[#8abfe4]">
                {filteredResults.total} resultados para "{query}"
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-[#ffb3b1]">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span>Pesquisa Multibanco em Tempo Real</span>
              </span>
            )}
            <span className="text-[9px] text-[#e4bebc]/60 font-mono-data hidden sm:inline">
              Navegar com ↑↓ • Selecionar com Enter
            </span>
          </div>

          {/* RESULTS CONTENT BODY */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
            {/* 1. EMPTY QUERY QUICK PROMPTS */}
            {!query.trim() && (
              <div className="flex flex-col gap-2 p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc]/70 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-[#ff535b]">travel_explore</span>
                  <span>Pesquisas Frequentes do Clube:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Lateral Direito', 'Fim de Contrato', 'Liga Portugal', 'Defesa Central', 'Sub-23'].map(
                    (suggest, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(suggest);
                          setSelectedIndex(0);
                        }}
                        className="bg-[#1C1C1F] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#e5e2e3] border border-[#26262B] text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px] text-[#ff535b]">search</span>
                        <span>{suggest}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 2. NO RESULTS FOUND STATE */}
            {query.trim() && filteredResults.total === 0 && (
              <div className="p-6 text-center flex flex-col items-center gap-2 text-[#e4bebc]">
                <span className="material-symbols-outlined text-[32px] text-[#ff535b]/60">search_off</span>
                <span className="font-bold text-xs text-[#e5e2e3]">Nenhum resultado encontrado para "{query}"</span>
                <span className="text-[11px] text-[#e4bebc]/70">
                  Tenta pesquisar por nome de jogador, clube, agente ou equipas adversárias.
                </span>
              </div>
            )}

            {/* 3. CATEGORY A: JOGADORES */}
            {filteredResults.players.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffb3b1] border-b border-[#26262B]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#ff535b]">sports_soccer</span>
                    <span>Jogadores ({filteredResults.players.length})</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {filteredResults.players.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#ff535b]/50 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={player.name}
                          className="w-8 h-8 text-xs border border-[#26262B] group-hover:border-[#ff535b] shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate">
                              {player.name}
                            </span>
                            <span className="text-[9px] font-mono-data font-bold px-1.5 py-0.2 rounded uppercase bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30">
                              {player.position}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#e4bebc]/70 truncate">
                            {player.club} | {player.nationality}
                          </span>
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-[16px] text-[#ff535b] group-hover:translate-x-1 transition-transform shrink-0">
                        arrow_forward
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CATEGORY B: CONTACTOS */}
            {filteredResults.contacts.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8abfe4] border-b border-[#26262B]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#8abfe4]">badge</span>
                    <span>Contactos ({filteredResults.contacts.length})</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {filteredResults.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="p-2 rounded-xl bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#8abfe4]/50 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={contact.name}
                          className="w-8 h-8 text-xs shrink-0"
                          variant="subtle"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#8abfe4] truncate">
                              {contact.name}
                            </span>
                            <span className="text-[9px] font-mono-data font-bold px-1.5 py-0.2 rounded uppercase bg-[#0b4e6e]/40 text-[#8abfe4] border border-[#0b4e6e]">
                              {contact.contactType}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#e4bebc]/70 truncate">
                            {contact.role} — <span className="text-[#e5e2e3] font-medium">{contact.organization}</span>
                          </span>
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-[16px] text-[#8abfe4] group-hover:translate-x-1 transition-transform shrink-0">
                        arrow_forward
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CATEGORY C: JOGOS & RELATÓRIOS */}
            {filteredResults.matches.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e5e2e3] border-b border-[#26262B]">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#ff535b]">sports_soccer</span>
                    <span>Jogos & Relatórios ({filteredResults.matches.length})</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {filteredResults.matches.map((match) => {
                    const statusBadge = getMatchStatusBadge(match.status);

                    return (
                      <div
                        key={match.id}
                        onClick={() => handleSelectMatch(match)}
                        className="p-2.5 rounded-xl bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-[#26262B] hover:border-[#ff535b]/50 flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#353436] border border-[#5b403f] flex items-center justify-center text-[#ffb3b1] shrink-0">
                            <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#ffb3b1] truncate">
                                {match.homeTeam} vs {match.awayTeam}
                              </span>
                              {match.score && (
                                <span className="font-mono-data font-bold text-xs text-[#ffb3b1]">
                                  ({match.score})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#e4bebc]/70 truncate">
                              {match.competition} | {match.date} | Scout: {match.assignedScout || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono-data font-bold px-2 py-0.5 rounded uppercase ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-[#ff535b] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
