import React, { useState } from 'react';
import { Player, PositionCode, RatingSystem, getPlayerAge } from '../types';
import { NATIONALITY_OPTIONS, getFlagForNationality } from '../data/nationalities';
import { StarRating } from './StarRating';
import { Avatar } from './Avatar';

interface AddSquadPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGlobalPlayers: Player[];
  squadPlayers: Player[];
  onAddExistingPlayer: (player: Player) => void;
  onCreateNewPlayer: (newPlayer: Player) => void;
  ratingSystem?: RatingSystem;
}

export const AddSquadPlayerModal: React.FC<AddSquadPlayerModalProps> = ({
  isOpen,
  onClose,
  allGlobalPlayers,
  squadPlayers,
  onAddExistingPlayer,
  onCreateNewPlayer,
  ratingSystem = '20',
}) => {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating a new player
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [position, setPosition] = useState<PositionCode>('MC');
  const [birthDate, setBirthDate] = useState('2001-08-20');
  const [nationality, setNationality] = useState('Portugal');
  const [flag, setFlag] = useState('🇵🇹');
  const [club, setClub] = useState('Plantel Principal');
  const [contractEnd, setContractEnd] = useState('Jun 2026');
  const [dominantFoot, setDominantFoot] = useState<'Direito' | 'Esquerdo' | 'Ambidestro'>('Direito');
  const [agent, setAgent] = useState('Livre / Próprio');
  const [rating, setRating] = useState<number>(4);

  if (!isOpen) return null;

  const calculateAge = (dob: string): number => {
    if (!dob) return 23;
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? years : 23;
  };

  // Filter global players not in squad
  const squadPlayerIds = new Set(squadPlayers.map((p) => p.id));
  const availableGlobalPlayers = allGlobalPlayers.filter((p) => !squadPlayerIds.has(p.id));

  const filteredGlobalPlayers = availableGlobalPlayers.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.shortName && p.shortName.toLowerCase().includes(q)) ||
      p.club.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: `sq_created_${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim() || name.trim().split(' ')[0],
      birthDate: birthDate || '2001-08-20',
      age: calculateAge(birthDate),
      heightCm: 182,
      nationality: nationality || 'Portugal',
      flag: flag || '🇵🇹',
      club: club || 'Plantel Principal',
      league: 'Liga Portugal',
      contractEnd: contractEnd || 'Jun 2026',
      agent: agent || 'Livre',
      dominantFoot: dominantFoot,
      position: position,
      status: 'squad',
      rating: Number(rating) || 4,
      tacticalFitPercent: 85,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      notes: {
        tecnica: 'Integrado recentemente no plantel principal.',
        tatica: 'Adaptável aos padrões da equipa.',
        fisica: 'Perfil atlético equilibrado.',
        psicologica: 'Boa atitude de trabalho.',
      },
      timeline: [],
      isContractExpiringSoon: contractEnd.toLowerCase().includes('2024'),
      seasonStats: {
        matchesPlayed: 0,
        starts: 0,
        minutesPlayed: 0,
      },
    };

    onCreateNewPlayer(newPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c1b1c] border border-[#353436] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353436] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b]">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#e5e2e3]">Adicionar Jogador ao Plantel Atual</h2>
              <p className="text-xs text-[#e4bebc]">
                Integre um atleta da base de dados global ou registe um novo jogador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#26262B] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#353436] bg-[#0e0e0f] p-1.5 gap-1">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'search'
                ? 'bg-[#ff535b] text-white shadow'
                : 'text-[#e4bebc] hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Pesquisar na Base de Dados Global ({availableGlobalPlayers.length})</span>
          </button>

          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'create'
                ? 'bg-[#ff535b] text-white shadow'
                : 'text-[#e4bebc] hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Registar Novo Atleta</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {tab === 'search' ? (
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e4bebc] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, clube ou posição..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] placeholder-[#e4bebc]/50 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#ff535b]"
                />
              </div>

              {/* List of Global Players */}
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredGlobalPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-[#141416] border border-[#353436] hover:border-[#ff535b]/60 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={player.name}
                        className="w-10 h-10 text-xs border border-[#353436] shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#e5e2e3] truncate">
                            {player.name}
                          </span>
                          <span className="bg-[#0e0e0f] text-[#ffb3b1] border border-[#ff535b]/30 text-[10px] font-mono-data font-bold px-1.5 py-0.2 rounded">
                            {player.position}
                          </span>
                        </div>
                        <div className="text-xs text-[#e4bebc] truncate mt-0.5">
                          {player.club} • {getPlayerAge(player)} anos • Contrato até {player.contractEnd}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddExistingPlayer(player);
                        onClose();
                      }}
                      className="bg-[#26262B] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Adicionar</span>
                    </button>
                  </div>
                ))}

                {filteredGlobalPlayers.length === 0 && (
                  <div className="py-12 text-center text-[#e4bebc] flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-[#353436]">
                      group_off
                    </span>
                    <p className="text-xs">
                      {availableGlobalPlayers.length === 0
                        ? 'Todos os jogadores da base de dados global já pertencem ao Plantel Atual.'
                        : 'Nenhum jogador encontrado para a pesquisa.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Evanilson"
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Nome Abreviado
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="Ex: Evanilson"
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Posição Principal *
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PositionCode)}
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                  >
                    <option value="GR">GR - Guarda-Redes</option>
                    <option value="DC">DC - Defesa Central</option>
                    <option value="DD">DD - Lateral Direito</option>
                    <option value="DE">DE - Lateral Esquerdo</option>
                    <option value="MDC">MDC - Médio Defensivo</option>
                    <option value="MC">MC - Médio Centro</option>
                    <option value="MO">MO - Médio Ofensivo</option>
                    <option value="EE">EE - Extremo Esquerdo</option>
                    <option value="ED">ED - Extremo Direito</option>
                    <option value="PL">PL - Ponta de Lança</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Nacionalidade / Bandeira
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={nationality}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNationality(val);
                        setFlag(getFlagForNationality(val));
                      }}
                      className="flex-1 bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                    >
                      {NATIONALITY_OPTIONS.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.flag} {n.name}
                        </option>
                      ))}
                    </select>
                    <span className="w-14 text-center bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-sm rounded-xl py-2 flex items-center justify-center">
                      {flag}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Pé Dominante
                  </label>
                  <select
                    value={dominantFoot}
                    onChange={(e) => setDominantFoot(e.target.value as any)}
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                  >
                    <option value="Direito">Direito</option>
                    <option value="Esquerdo">Esquerdo</option>
                    <option value="Ambidestro">Ambidestro</option>
                  </select>
                </div>



                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Fim de Contrato
                  </label>
                  <input
                    type="text"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                    placeholder="Jun 2026"
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                    Avaliação Inicial (Estrelas)
                  </label>
                  <div className="bg-[#0e0e0f] border border-[#353436] rounded-xl px-3 py-1.5 flex items-center h-[38px]">
                    <StarRating value={rating} onChange={setRating} size="sm" variant="stars" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#353436]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#26262B] text-[#e4bebc] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Criar e Adicionar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
