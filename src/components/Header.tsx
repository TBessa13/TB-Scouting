import React from 'react';
import { MainView, Player, Contact, MatchReport } from '../types';
import { GlobalSearch } from './GlobalSearch';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentView?: MainView;
  onNavigate: (view: MainView) => void;
  globalPlayers?: Player[];
  squadPlayers?: Player[];
  contacts?: Contact[];
  matches?: MatchReport[];
  onPlayerClick?: (player: Player) => void;
  onContactClick?: (contact: Contact) => void;
  onMatchClick?: (match: MatchReport) => void;
  onTriggerToast?: (msg: string) => void;
  targetCount?: number;
  squadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  globalPlayers = [],
  squadPlayers = [],
  contacts = [],
  matches = [],
  onPlayerClick = () => {},
  onContactClick = () => {},
  onMatchClick = () => {},
  onTriggerToast = () => {},
}) => {
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 w-full z-50 bg-[#0e0e0f] border-b border-[#5b403f]/40 justify-between items-center px-6 h-12">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onNavigate('overview')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff535b] via-[#c92a32] to-[#7f1319] border border-[#ffb3b1]/40 flex items-center justify-center shadow-[0_0_12px_rgba(255,83,91,0.35)] shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[20px]">
              shield
            </span>
          </div>
          <h1 className="font-extrabold tracking-tighter text-[#e5e2e3] text-xl font-sans group-hover:text-white transition-colors">TB Scouting</h1>
        </div>

        {/* CENTERED GLOBAL SEARCH BAR (COMMAND PALETTE) */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch
            globalPlayers={globalPlayers}
            squadPlayers={squadPlayers}
            contacts={contacts}
            matches={matches}
            onNavigate={onNavigate}
            onPlayerClick={onPlayerClick}
            onContactClick={onContactClick}
            onMatchClick={onMatchClick}
            onTriggerToast={onTriggerToast}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#e5e2e3] hidden lg:block">Tiago Bessa</span>
          <Avatar name="Tiago Bessa" className="w-8 h-8 text-xs shrink-0 border border-[#5b403f]" />
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="flex md:hidden fixed top-0 w-full z-50 bg-[#0e0e0f] border-b border-[#26262B] items-center justify-between px-3 h-14 gap-2">
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => onNavigate('overview')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff535b] via-[#c92a32] to-[#7f1319] border border-[#ffb3b1]/40 flex items-center justify-center shadow-[0_0_10px_rgba(255,83,91,0.35)] shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">
              shield
            </span>
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        <div className="flex-1 min-w-0">
          <GlobalSearch
            globalPlayers={globalPlayers}
            squadPlayers={squadPlayers}
            contacts={contacts}
            matches={matches}
            onNavigate={onNavigate}
            onPlayerClick={onPlayerClick}
            onContactClick={onContactClick}
            onMatchClick={onMatchClick}
            onTriggerToast={onTriggerToast}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Avatar name="Tiago Bessa" className="w-8 h-8 text-xs shrink-0 border border-[#26262B]" />
        </div>
      </header>
    </>
  );
};
