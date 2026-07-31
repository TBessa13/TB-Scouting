import React from 'react';
import { MainView } from '../types';

interface SideNavProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
  targetCount?: number;
  squadCount?: number;
  shadowTeamCount?: number;
}

export const SideNav: React.FC<SideNavProps> = ({
  currentView,
  onNavigate,
}) => {
  return (
    <nav className="hidden lg:flex flex-col py-4 fixed left-0 top-0 h-[calc(100vh-3rem)] w-[260px] bg-[#1c1b1c] border-r border-[#5b403f]/40 transition-all duration-200 mt-12 z-40 overflow-y-auto">
      <div className="px-4 mb-6">
        <h2 className="text-[12px] font-bold tracking-wider text-[#ffb3b1] uppercase">MENU PRINCIPAL</h2>
      </div>

      <ul className="flex flex-col gap-1 px-2">
        {/* 0. Visão Geral */}
        <li>
          <button
            onClick={() => onNavigate('overview')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'overview'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">grid_view</span>
            <span className="font-semibold text-base text-left flex-1">Visão Geral</span>
          </button>
        </li>

        {/* 1. Plantel Atual */}
        <li>
          <button
            onClick={() => onNavigate('squad')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'squad'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">stadium</span>
            <span className="font-semibold text-base text-left flex-1">Plantel Atual</span>
          </button>
        </li>

        {/* 2. Jogadores (Base de Dados) */}
        <li>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'dashboard' || currentView === 'wizard'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">badge</span>
            <span className="font-semibold text-base text-left flex-1">Jogadores</span>
          </button>
        </li>

        {/* 3. Shortlists */}
        <li>
          <button
            onClick={() => onNavigate('shortlists')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'shortlists'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">format_list_bulleted</span>
            <span className="font-semibold text-base text-left flex-1">Shortlists</span>
          </button>
        </li>

        {/* 4. Shadow Teams */}
        <li>
          <button
            onClick={() => onNavigate('shadowTeams')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'shadowTeams'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">groups</span>
            <span className="font-semibold text-base text-left flex-1">Shadow Teams</span>
          </button>
        </li>

        {/* 5. Auditoria da Equipa */}
        <li>
          <button
            onClick={() => onNavigate('teamAudit')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'teamAudit'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">fact_check</span>
            <span className="font-semibold text-base text-left flex-1">Auditoria da Equipa</span>
          </button>
        </li>

        {/* 6. Jogos */}
        <li>
          <button
            onClick={() => onNavigate('matches')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'matches'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">sports_soccer</span>
            <span className="font-semibold text-base text-left flex-1">Jogos</span>
          </button>
        </li>

        {/* 7. Calendário */}
        <li>
          <button
            onClick={() => onNavigate('calendar')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'calendar'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="font-semibold text-base text-left flex-1">Calendário</span>
          </button>
        </li>

        {/* 8. Contactos */}
        <li>
          <button
            onClick={() => onNavigate('contacts')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'contacts'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">contacts</span>
            <span className="font-semibold text-base text-left flex-1">Contactos</span>
          </button>
        </li>

        {/* 9. Definições */}
        <li>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full cursor-pointer flex items-center p-3 gap-3 border-l-4 transition-colors rounded-r ${
              currentView === 'settings'
                ? 'bg-[#0b4e6e] text-[#8abfe4] border-[#ff535b]'
                : 'text-[#e4bebc] hover:bg-[#353436] border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-semibold text-base text-left flex-1">Definições</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
