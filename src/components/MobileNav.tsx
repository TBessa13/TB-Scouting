import React from 'react';
import { MainView } from '../types';

interface MobileNavProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 w-full z-50 bg-[#353436] border-t border-[#5b403f] flex justify-around items-center h-14 px-2 shadow-2xl overflow-x-auto">
      <button
        onClick={() => onNavigate('overview')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-[50px] ${
          currentView === 'overview' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'overview' ? 'fill-icon' : ''}`}>grid_view</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Geral</span>
      </button>

      <button
        onClick={() => onNavigate('squad')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-[50px] ${
          currentView === 'squad' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'squad' ? 'fill-icon' : ''}`}>stadium</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Plantel</span>
      </button>

      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-[50px] ${
          currentView === 'dashboard' || currentView === 'wizard' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'dashboard' ? 'fill-icon' : ''}`}>badge</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Jogadores</span>
      </button>

      <button
        onClick={() => onNavigate('shortlists')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg w-16 transition-colors ${
          currentView === 'shortlists' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'shortlists' ? 'fill-icon' : ''}`}>format_list_bulleted</span>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Lists</span>
      </button>

      <button
        onClick={() => onNavigate('shadowTeams')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
          currentView === 'shadowTeams' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'shadowTeams' ? 'fill-icon' : ''}`}>groups</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Teams</span>
      </button>

      <button
        onClick={() => onNavigate('teamAudit')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
          currentView === 'teamAudit' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'teamAudit' ? 'fill-icon' : ''}`}>fact_check</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Auditoria</span>
      </button>

      <button
        onClick={() => onNavigate('matches')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg w-16 transition-colors ${
          currentView === 'matches' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'matches' ? 'fill-icon' : ''}`}>sports_soccer</span>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Jogos</span>
      </button>

      <button
        onClick={() => onNavigate('calendar')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
          currentView === 'calendar' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'calendar' ? 'fill-icon' : ''}`}>calendar_month</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Agenda</span>
      </button>

      <button
        onClick={() => onNavigate('contacts')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
          currentView === 'contacts' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'contacts' ? 'fill-icon' : ''}`}>contacts</span>
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Rede</span>
      </button>

      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
          currentView === 'settings' ? 'text-[#ffb3b1]' : 'text-[#e4bebc]'
        }`}
      >
        <span className={`material-symbols-outlined ${currentView === 'settings' ? 'fill-icon' : ''}`}>settings</span>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Definições</span>
      </button>
    </nav>
  );
};
