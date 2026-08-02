import React, { useState, useEffect } from 'react';
import { MainView, DashboardSubView, Player, PlayerStatus, PositionCode, ShadowTeam, FormationName, RatingSystem, Contact, MatchReport, MatchNoteEntry, PriorityRank } from './types';
import {
  fetchPlayersFromDb,
  updatePlayerStatusInDb,
  saveNewPlayerToDb,
  updatePlayerInDb,
  fetchShadowTeamsFromDb,
  addPlayerToShadowTeamInDb,
  removePlayerFromShadowTeamInDb,
  createShadowTeamInDb,
  fetchMatchesFromDb,
  saveMatchToDb,
  fetchContactsFromDb,
} from './lib/supabase';
import { Header } from './components/Header';
import { SideNav } from './components/SideNav';
import { MobileNav } from './components/MobileNav';
import { TacticalPitch } from './components/TacticalPitch';
import { ScoutWizard } from './components/ScoutWizard';
import { PlayerSlideOver } from './components/PlayerSlideOver';
import { MatchesView } from './components/MatchesView';
import { StadiumModeView } from './components/StadiumModeView';
import { ShortlistsView } from './components/ShortlistsView';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { ContactsView } from './components/ContactsView';
import { ContactModal } from './components/ContactModal';
import { MatchReportModal } from './components/MatchReportModal';
import { NotificationToast } from './components/NotificationToast';
import { AssistantScoutModal } from './components/AssistantScoutModal';
import { FloatingCompareBar } from './components/FloatingCompareBar';
import { PlayerComparisonModal } from './components/PlayerComparisonModal';
import { ShadowTeamSelector } from './components/ShadowTeamSelector';
import { CreateShadowTeamModal } from './components/CreateShadowTeamModal';
import { GlobalPlayersView } from './components/GlobalPlayersView';
import { CurrentSquadView } from './components/CurrentSquadView';
import { TeamAuditView } from './components/TeamAuditView';
import { OverviewView } from './components/OverviewView';

export default function App() {
  const [mainView, setMainView] = useState<MainView>('overview');
  const [subView, setSubView] = useState<DashboardSubView>('list');
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);

  // Plantel Atual (Squad) State
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);

  // Global Players Database State
  const [allGlobalPlayers, setAllGlobalPlayers] = useState<Player[]>([]);

  // Filter States for Shadow Teams Subview
  const [posFilter, setPosFilter] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [heightFilter, setHeightFilter] = useState<string>('');

  // Shadow Teams State (isolated player containers)
  const [teams, setTeams] = useState<ShadowTeam[]>([
    {
      id: 'team-primary',
      name: 'Shadow Team Principal',
      players: [],
    },
  ]);
  const [activeTeamId, setActiveTeamId] = useState<string>('team-primary');

  // Matches & Contacts State
  const [matchesList, setMatchesList] = useState<MatchReport[]>([]);
  const [contactsList, setContactsList] = useState<Contact[]>([]);

  // Load live data from Supabase on mount
  useEffect(() => {
    async function loadDbData() {
      try {
        setIsLoadingDb(true);
        const { globalPlayers: dbGlobals, squadPlayers: dbSquad } = await fetchPlayersFromDb();
        setAllGlobalPlayers(dbGlobals);
        setSquadPlayers(dbSquad);

        const dbTeams = await fetchShadowTeamsFromDb();
        if (dbTeams.length > 0) {
          setTeams(dbTeams);
        } else {
          setTeams([
            {
              id: 'team-primary',
              name: 'Shadow Team Principal',
              players: dbGlobals,
            },
          ]);
        }

        const dbMatches = await fetchMatchesFromDb();
        setMatchesList(dbMatches);

        const dbContacts = await fetchContactsFromDb();
        setContactsList(dbContacts);
      } catch (err) {
        console.error('Error loading Supabase data:', err);
      } finally {
        setIsLoadingDb(false);
      }
    }

    loadDbData();
  }, []);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState<boolean>(false);

  // Active Team & Players
  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const players = activeTeam ? activeTeam.players : [];

  // Selected Overlays State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchReport | null>(null);

  // Stadium Mode
  const [stadiumModeMatch, setStadiumModeMatch] = useState<MatchReport | null>(null);

  const handleUpdateMatchNotes = (
    matchId: string,
    updatedNotes: MatchNoteEntry[],
    elapsedSeconds: number
  ) => {
    const targetMatch = matchesList.find((m) => m.id === matchId);
    if (targetMatch) {
      saveMatchToDb({ ...targetMatch, timelineNotes: updatedNotes, elapsedSeconds });
    }

    setMatchesList((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, timelineNotes: updatedNotes, elapsedSeconds }
          : m
      )
    );
    if (stadiumModeMatch && stadiumModeMatch.id === matchId) {
      setStadiumModeMatch((prev) =>
        prev ? { ...prev, timelineNotes: updatedNotes, elapsedSeconds } : null
      );
    }
  };

  const handleUpdateMatchStatus = (matchId: string, status: MatchReport['status']) => {
    const targetMatch = matchesList.find((m) => m.id === matchId);
    if (targetMatch) {
      saveMatchToDb({ ...targetMatch, status });
    }

    setMatchesList((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status } : m))
    );
    if (stadiumModeMatch && stadiumModeMatch.id === matchId) {
      setStadiumModeMatch((prev) => (prev ? { ...prev, status } : null));
    }
  };

  // Department & Tactical Formation States
  const [currentClub, setCurrentClub] = useState<string>('GD Chaves');
  const [defaultFormation, setDefaultFormation] = useState<FormationName>('4-2-3-1');
  const [secondaryFormation, setSecondaryFormation] = useState<FormationName>('4-4-2');

  // Rating System State ('20' for 1-20 Traditional, '5' for 1-5 Stars)
  const [ratingSystem, setRatingSystem] = useState<RatingSystem>('20');

  // Player Comparison State
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    setComparePlayerIds([]); // clear comparison context on team switch
    const selected = teams.find((t) => t.id === teamId);
    if (selected) {
      setToastMessage(`Alternado para "${selected.name}".`);
    }
  };

  const handleCreateNewTeam = (teamName: string) => {
    const newTeamId = `team-${Date.now()}`;
    const newTeam: ShadowTeam = {
      id: newTeamId,
      name: teamName,
      players: [],
    };
    createShadowTeamInDb(newTeamId, teamName);
    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
    setComparePlayerIds([]);
    setToastMessage(`Nova Shadow Team "${teamName}" criada com sucesso! (Gravada no Supabase)`);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (teams.length <= 1) return;
    const targetTeam = teams.find((t) => t.id === teamId);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (activeTeamId === teamId) {
      const remaining = teams.filter((t) => t.id !== teamId);
      if (remaining.length > 0) {
        setActiveTeamId(remaining[0].id);
      }
    }
    setComparePlayerIds([]);
    if (targetTeam) {
      setToastMessage(`Shadow Team "${targetTeam.name}" foi eliminada.`);
    }
  };

  const handleRenameTeam = (teamId: string, newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t))
    );
    setToastMessage(`Nome da Shadow Team alterado para "${newName}".`);
  };

  const handleAddPlayerToTeam = (player: Player, teamId: string) => {
    addPlayerToShadowTeamInDb(teamId, player.id);
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          if (t.players.some((p) => p.id === player.id)) return t;
          return { ...t, players: [player, ...t.players] };
        }
        return t;
      })
    );
  };

  const handleRemovePlayerFromTeam = (player: Player, teamId: string) => {
    removePlayerFromShadowTeamInDb(teamId, player.id);
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return { ...t, players: t.players.filter((p) => p.id !== player.id) };
        }
        return t;
      })
    );
  };

  const handleUpdatePlayerPriority = (playerId: string, priorityRank: PriorityRank) => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.map((p) =>
          p.id === playerId ? { ...p, priorityRank } : p
        ),
      }))
    );
    setAllGlobalPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, priorityRank } : p))
    );
  };

  const handleCreateTeamWithPlayer = (teamName: string, player: Player) => {
    const newTeam: ShadowTeam = {
      id: `team-${Date.now()}`,
      name: teamName,
      players: [player],
    };
    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
  };

  const handleToggleComparePlayer = (playerId: string) => {
    setComparePlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleClearCompareSelection = () => {
    setComparePlayerIds([]);
  };

  const handleRemoveComparePlayer = (playerId: string) => {
    setComparePlayerIds(prev => prev.filter(id => id !== playerId));
  };

  const handleAddComparePlayer = (player: Player) => {
    if (!comparePlayerIds.includes(player.id)) {
      setComparePlayerIds(prev => [...prev, player.id]);
    }
  };

  const handleUpdateStatus = (playerId: string, newStatus: PlayerStatus) => {
    // Persist immediately to Supabase
    updatePlayerStatusInDb(playerId, newStatus);

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              players: t.players.map((p) =>
                p.id === playerId ? { ...p, status: newStatus } : p
              ),
            }
          : t
      )
    );
    // Also update in global database
    setAllGlobalPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, status: newStatus } : p))
    );

    if (selectedPlayer && selectedPlayer.id === playerId) {
      setSelectedPlayer(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    const statusLabels: Record<PlayerStatus, string> = {
      pending: 'Por definir',
      hire: 'Contratar (Alta Prioridade)',
      track: 'Continuar a Acompanhar',
      squad: 'Opção de Plantel',
      discard: 'Descartar'
    };

    const targetPlayer = allGlobalPlayers.find(p => p.id === playerId);
    if (targetPlayer) {
      setToastMessage(`${targetPlayer.name} movido para "${statusLabels[newStatus]}" (Salvo no Supabase).`);
    }
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    // Persist edits to Supabase
    updatePlayerInDb(updatedPlayer);

    setAllGlobalPlayers((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
    setSquadPlayers((prev) =>
      prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
      }))
    );
    if (selectedPlayer && selectedPlayer.id === updatedPlayer.id) {
      setSelectedPlayer(updatedPlayer);
    }
  };

  const handleSaveNewPlayerFromWizard = (newPlayer: Player) => {
    // Save to Supabase
    saveNewPlayerToDb(newPlayer, false);

    setAllGlobalPlayers((prev) => [newPlayer, ...prev]);
    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              players: [newPlayer, ...t.players],
            }
          : t
      )
    );
    setMainView('dashboard');
    setToastMessage(`Novo perfil de ${newPlayer.name} adicionado e salvo no Supabase com sucesso!`);
  };

  const handleAddPlayerToSquad = (player: Player) => {
    saveNewPlayerToDb(player, true);

    setSquadPlayers((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [player, ...prev];
    });
    setAllGlobalPlayers((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [player, ...prev];
    });
    setToastMessage(`Atleta ${player.name} adicionado ao Plantel Atual e salvo no Supabase!`);
  };

  const handleRemovePlayerFromSquad = (playerId: string) => {
    const target = squadPlayers.find((p) => p.id === playerId);
    setSquadPlayers((prev) => prev.filter((p) => p.id !== playerId));
    if (target) {
      setToastMessage(`Atleta ${target.name} removido do Plantel Atual (mantido na Base de Dados Global).`);
    }
  };

  // Filter Logic
  const filteredPlayers = players.filter(p => {
    if (posFilter && p.position !== posFilter) return false;

    if (ageFilter) {
      if (ageFilter === 'U21' && p.age > 21) return false;
      if (ageFilter === '22-25' && (p.age < 22 || p.age > 25)) return false;
      if (ageFilter === '26+' && p.age < 26) return false;
    }

    if (heightFilter) {
      if (heightFilter === '<180' && p.heightCm >= 180) return false;
      if (heightFilter === '180-185' && (p.heightCm < 180 || p.heightCm > 185)) return false;
      if (heightFilter === '>185' && p.heightCm <= 185) return false;
    }

    return true;
  });

  const totalTargets = players.length;
  const expiringContractsCount = players.filter(p => p.isContractExpiringSoon).length;

  // ZEN MODE / STADIUM MODE FULLSCREEN VIEW OVERRIDE
  if (stadiumModeMatch) {
    const currentMatch =
      matchesList.find((m) => m.id === stadiumModeMatch.id) || stadiumModeMatch;
    const targetPlayers = allGlobalPlayers.filter((p) =>
      currentMatch.targetPlayerIds.includes(p.id)
    );

    return (
      <>
        <StadiumModeView
          match={currentMatch}
          targetPlayers={targetPlayers}
          onClose={() => setStadiumModeMatch(null)}
          onUpdateMatchNotes={handleUpdateMatchNotes}
          onUpdateMatchStatus={handleUpdateMatchStatus}
          onTriggerToast={setToastMessage}
        />
        <NotificationToast
          message={toastMessage}
          onClear={() => setToastMessage(null)}
        />
      </>
    );
  }

  return (
    <div className="bg-[#0A0A0B] min-h-screen text-[#e5e2e3] font-sans flex flex-col antialiased selection:bg-[#ff535b] selection:text-white overflow-x-hidden">
      {/* Top App Header */}
      <Header
        currentView={mainView}
        onNavigate={setMainView}
        targetCount={allGlobalPlayers.length}
        squadCount={squadPlayers.length}
        globalPlayers={allGlobalPlayers}
        squadPlayers={squadPlayers}
        contacts={contactsList}
        matches={matchesList}
        onPlayerClick={setSelectedPlayer}
        onContactClick={setSelectedContact}
        onMatchClick={setSelectedMatch}
        onTriggerToast={setToastMessage}
      />

      {/* Main Layout Wrapper (Sidebar + Main Content) */}
      <div className="flex flex-1 w-full min-w-0">
        {/* Desktop Left Sidebar */}
        <SideNav
          currentView={mainView}
          onNavigate={setMainView}
          targetCount={allGlobalPlayers.length}
          squadCount={squadPlayers.length}
          shadowTeamCount={teams.length}
        />

        {/* Main Content View Container */}
        <main className="flex-1 min-w-0 mt-14 md:mt-12 mb-16 lg:mb-0 lg:ml-[260px] p-4 md:p-6 flex flex-col">
        
        {/* VIEW 0: VISÃO GERAL (LANDING DASHBOARD) */}
        {mainView === 'overview' && (
          <OverviewView
            squadPlayers={squadPlayers}
            globalPlayers={allGlobalPlayers}
            matches={matchesList}
            onNavigate={setMainView}
            onPlayerClick={setSelectedPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onTriggerToast={setToastMessage}
          />
        )}

        {/* VIEW 1: PLANTEL ATUAL (EQUIPA PRINCIPAL) */}
        {mainView === 'squad' && (
          <CurrentSquadView
            squadPlayers={squadPlayers}
            allGlobalPlayers={allGlobalPlayers}
            onPlayerClick={setSelectedPlayer}
            defaultFormation={defaultFormation}
            onFormationChange={setDefaultFormation}
            ratingSystem={ratingSystem}
            onTriggerToast={setToastMessage}
            onAddPlayerToSquad={handleAddPlayerToSquad}
            onRemovePlayerFromSquad={handleRemovePlayerFromSquad}
          />
        )}

        {/* VIEW 1: JOGADORES (BASE DE DADOS GLOBAL) */}
        {mainView === 'dashboard' && (
          <GlobalPlayersView
            allPlayers={allGlobalPlayers}
            teams={teams}
            onPlayerClick={setSelectedPlayer}
            onAddPlayerToTeam={handleAddPlayerToTeam}
            onCreateNewTeamWithPlayer={handleCreateTeamWithPlayer}
            onAddNewTarget={() => setMainView('wizard')}
            selectedPlayerIdsForCompare={comparePlayerIds}
            onToggleSelectForCompare={handleToggleComparePlayer}
            onTriggerToast={setToastMessage}
            ratingSystem={ratingSystem}
            onUpdatePlayerPriority={handleUpdatePlayerPriority}
          />
        )}

        {/* VIEW 2: SHADOW TEAMS (GESTÃO DE PLANTÉIS) */}
        {mainView === 'shadowTeams' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            {/* Header & Main Actions */}
            <div className="mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Dynamic Title Selector for Shadow Teams */}
              <ShadowTeamSelector
                teams={teams}
                activeTeamId={activeTeamId}
                onSelectTeam={handleSelectTeam}
                onRequestCreateTeam={() => setIsCreateTeamModalOpen(true)}
                onDeleteTeam={handleDeleteTeam}
                onRenameTeam={handleRenameTeam}
              />

              {/* View Toggle, Stats & Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                {/* View Toggle Button */}
                <div className="flex bg-[#1c1b1c] border border-[#353436] rounded-full p-1">
                  <button
                    onClick={() => setSubView('list')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      subView === 'list'
                        ? 'bg-[#ff535b] text-white shadow'
                        : 'text-[#e4bebc] hover:text-[#e5e2e3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                    <span>LISTA DE ATLETAS</span>
                  </button>

                  <button
                    onClick={() => setSubView('tactical')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      subView === 'tactical'
                        ? 'bg-[#ff535b] text-white shadow'
                        : 'text-[#e4bebc] hover:text-[#e5e2e3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">strategy</span>
                    <span>CAMPO TÁTICO</span>
                  </button>
                </div>

                {/* Stat 1: Total Targets in active team */}
                <div className="data-chip rounded-lg px-3 py-1.5 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#ffb3b1] text-[20px]">groups</span>
                  <div>
                    <div className="text-[9px] font-bold text-[#e4bebc] uppercase tracking-wider">Atletas na Equipa</div>
                    <div className="font-mono-data text-xs font-bold text-[#e5e2e3]">{totalTargets}</div>
                  </div>
                </div>

                {/* Stat 2: Expiring Contracts */}
                <div className="data-chip rounded-lg px-3 py-1.5 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#ff535b] text-[20px]">hourglass_empty</span>
                  <div>
                    <div className="text-[9px] font-bold text-[#e4bebc] uppercase tracking-wider">Contratos a Expirar</div>
                    <div className="font-mono-data text-xs font-bold text-[#ff535b]">{expiringContractsCount}</div>
                  </div>
                </div>

                {/* Primary Action Button: + NOVO ALVO */}
                <button
                  onClick={() => setMainView('wizard')}
                  className="bg-[#ff535b] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 ml-auto sm:ml-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Novo Alvo</span>
                </button>
              </div>
            </div>

            {/* Sub-view: Lista de Atletas vs Tactical Pitch */}
            {subView === 'tactical' ? (
              <TacticalPitch
                players={players}
                squadPlayers={squadPlayers}
                onPlayerClick={setSelectedPlayer}
                defaultFormation={defaultFormation}
                onFormationChange={setDefaultFormation}
                ratingSystem={ratingSystem}
              />
            ) : (
              <GlobalPlayersView
                allPlayers={players}
                teams={teams}
                onPlayerClick={setSelectedPlayer}
                onAddPlayerToTeam={handleAddPlayerToTeam}
                onRemovePlayerFromTeam={handleRemovePlayerFromTeam}
                onCreateNewTeamWithPlayer={handleCreateTeamWithPlayer}
                onAddNewTarget={() => setMainView('wizard')}
                selectedPlayerIdsForCompare={comparePlayerIds}
                onToggleSelectForCompare={handleToggleComparePlayer}
                onTriggerToast={setToastMessage}
                ratingSystem={ratingSystem}
                showHeader={false}
                allowKanban={false}
                onUpdatePlayerPriority={handleUpdatePlayerPriority}
              />
            )}
          </div>
        )}

        {/* AUDITORIA DA EQUIPA VIEW */}
        {mainView === 'teamAudit' && (
          <TeamAuditView
            squadPlayers={squadPlayers}
            onPlayerClick={setSelectedPlayer}
            onTriggerToast={setToastMessage}
            defaultFormation={defaultFormation}
            onFormationChange={setDefaultFormation}
          />
        )}

        {/* SHORTLISTS VIEW */}
        {mainView === 'shortlists' && (
          <ShortlistsView
            players={players}
            onPlayerClick={setSelectedPlayer}
            onTriggerToast={setToastMessage}
            selectedPlayerIdsForCompare={comparePlayerIds}
            onToggleSelectForCompare={handleToggleComparePlayer}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onSetSelectedForCompare={setComparePlayerIds}
            ratingSystem={ratingSystem}
          />
        )}

        {/* VIEW 2: SCOUT WIZARD (NOVO PERFIL -> AVALIAÇÃO -> SUCESSO) */}
        {mainView === 'wizard' && (
          <ScoutWizard
            onCancel={() => setMainView('dashboard')}
            onSavePlayer={handleSaveNewPlayerFromWizard}
            ratingSystem={ratingSystem}
          />
        )}

        {/* VIEW 3: MATCHES / SCOUTING OBS */}
        {mainView === 'matches' && (
          <MatchesView
            matches={matchesList}
            players={players}
            onPlayerClick={setSelectedPlayer}
            onTriggerToast={setToastMessage}
            onOpenStadiumMode={(match) => setStadiumModeMatch(match)}
          />
        )}

        {/* CALENDAR VIEW */}
        {mainView === 'calendar' && (
          <CalendarView
            allPlayers={allGlobalPlayers}
            onPlayerClick={setSelectedPlayer}
            onTriggerToast={setToastMessage}
          />
        )}

        {/* UNIFIED CONTACTS / NETWORK VIEW */}
        {(mainView === 'contacts' || mainView === 'agents') && (
          <ContactsView
            players={players}
            onPlayerClick={setSelectedPlayer}
            onTriggerToast={setToastMessage}
          />
        )}

        {/* VIEW 5: SETTINGS */}
        {mainView === 'settings' && (
          <SettingsView
            players={players}
            currentClub={currentClub}
            onCurrentClubChange={setCurrentClub}
            defaultFormation={defaultFormation}
            onDefaultFormationChange={setDefaultFormation}
            secondaryFormation={secondaryFormation}
            onSecondaryFormationChange={setSecondaryFormation}
            ratingSystem={ratingSystem}
            onRatingSystemChange={setRatingSystem}
            onTriggerToast={setToastMessage}
          />
        )}
      </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentView={mainView}
        onNavigate={setMainView}
      />

      {/* Slide-out Player Detail Modal */}
      <PlayerSlideOver
        player={selectedPlayer}
        squadPlayers={squadPlayers}
        allPlayers={allGlobalPlayers}
        onClose={() => setSelectedPlayer(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePlayer={handleUpdatePlayer}
        onSelectPlayer={setSelectedPlayer}
        onTriggerToast={setToastMessage}
        ratingSystem={ratingSystem}
      />

      {/* Centered Contact Detail Modal */}
      <ContactModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        players={allGlobalPlayers}
        onPlayerClick={setSelectedPlayer}
        onTriggerToast={setToastMessage}
      />

      {/* Centered Match Report Detail Modal */}
      <MatchReportModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        players={allGlobalPlayers}
        onPlayerClick={setSelectedPlayer}
        onTriggerToast={setToastMessage}
        onUpdateMatchStatus={handleUpdateMatchStatus}
        onOpenStadiumMode={(match) => setStadiumModeMatch(match)}
      />

      {/* Floating AI Assistant Scout Modal */}
      <AssistantScoutModal
        squadPlayers={squadPlayers}
        globalPlayers={allGlobalPlayers}
        players={players}
        matches={matchesList}
        currentClub={currentClub}
        defaultFormation={defaultFormation}
        onPlayerClick={setSelectedPlayer}
        onTriggerToast={setToastMessage}
        onNavigateView={setMainView}
        onComparePlayers={(ids) => {
          setComparePlayerIds(ids);
          setIsCompareModalOpen(true);
        }}
      />

      {/* Toast Notification Banner */}
      <NotificationToast
        message={toastMessage}
        onClear={() => setToastMessage(null)}
      />

      {/* Floating Action Bar when 2 or more players selected */}
      <FloatingCompareBar
        selectedCount={comparePlayerIds.length}
        onCompareClick={() => setIsCompareModalOpen(true)}
        onClearClick={handleClearCompareSelection}
      />

      {/* Multi Player Comparison Fullscreen Modal */}
      <PlayerComparisonModal
        isOpen={isCompareModalOpen}
        selectedPlayers={players.filter((p) => comparePlayerIds.includes(p.id))}
        allPlayers={players}
        onClose={() => setIsCompareModalOpen(false)}
        onRemovePlayer={handleRemoveComparePlayer}
        onAddPlayer={handleAddComparePlayer}
        onPlayerClick={(player) => {
          setSelectedPlayer(player);
        }}
        onClearAll={handleClearCompareSelection}
      />

      {/* Create New Shadow Team Modal */}
      <CreateShadowTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreateTeam={handleCreateNewTeam}
      />
    </div>
  );
}
