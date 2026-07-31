import React, { useState } from 'react';
import { Player, PlayerStatus, PositionCode, RatingSystem, convertCategoryInputToBase20, getSystemMaxVal } from '../types';
import { NATIONALITY_OPTIONS, getFlagForNationality } from '../data/nationalities';
import { StarRating } from './StarRating';

interface ScoutWizardProps {
  onCancel: () => void;
  onSavePlayer: (player: Player) => void;
  ratingSystem?: RatingSystem;
}

export const ScoutWizard: React.FC<ScoutWizardProps> = ({ onCancel, onSavePlayer, ratingSystem = '20' as RatingSystem }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('2002-05-14');
  const [heightCm, setHeightCm] = useState<number | ''>(182);
  const [nationality, setNationality] = useState('Portugal');
  const [flag, setFlag] = useState('🇵🇹');
  const [club, setClub] = useState('');
  const [league, setLeague] = useState('Liga Portugal');
  const [contractEnd, setContractEnd] = useState('Jun 2025');
  const [agent, setAgent] = useState('');
  const [dominantFoot, setDominantFoot] = useState<'Direito' | 'Esquerdo' | 'Ambidestro'>('Direito');
  const [position, setPosition] = useState<PositionCode>('PL');

  // Step 2 Fields
  const maxScaleVal = getSystemMaxVal(ratingSystem);
  const defaultCategoryRating = ratingSystem === '20' ? 16 : (ratingSystem === '100' ? 80 : (ratingSystem === '10' ? 8 : 4));

  const [tacticalFitPercent, setTacticalFitPercent] = useState(85);
  const [rating, setRating] = useState(() => (ratingSystem === '20' ? 16 : 4));
  const [tecnicaVal, setTecnicaVal] = useState(defaultCategoryRating);
  const [taticaVal, setTaticaVal] = useState(defaultCategoryRating);
  const [fisicaVal, setFisicaVal] = useState(defaultCategoryRating);
  const [psicologicaVal, setPsicologicaVal] = useState(defaultCategoryRating);

  const [tecnicaNote, setTecnicaNote] = useState('Boa receção orientada, passe consistente em apoios curtos.');
  const [taticaNote, setTaticaNote] = useState('Movimentação em apoios frontais e leitura dos espaços na área.');
  const [fisicaNote, setFisicaNote] = useState('Boa velocidade de arranque e resistência física.');
  const [psicologicaNote, setPsicologicaNote] = useState('Focado, atitude competitiva e boa comunicação.');
  const [wyscoutUrl, setWyscoutUrl] = useState('https://wyscout.com');
  const [hudlUrl, setHudlUrl] = useState('https://hudl.com');
  const [transfermarktUrl, setTransfermarktUrl] = useState('https://www.transfermarkt.pt');

  // Step 3 Selected Priority
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus>('hire');

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, introduza o nome do jogador.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleQuickSaveFromStep1 = () => {
    if (!name.trim()) {
      alert('Por favor, introduza o nome do jogador.');
      return;
    }
    const calculatedAge = calculateAge(birthDate);

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: name.trim() || 'Novo Alvo',
      shortName: (name.split(' ').pop() || name).trim(),
      birthDate: birthDate || '2002-05-14',
      age: calculatedAge,
      heightCm: Number(heightCm) || 180,
      nationality: nationality || 'Portugal',
      flag: getFlagForNationality(nationality || 'Portugal'),
      club: club.trim() || 'Sem Clube / Livre',
      league: league.trim() || 'Liga Portugal',
      contractEnd: contractEnd || 'Jun 2025',
      agent: agent.trim() || 'Sem Agente Registado',
      dominantFoot,
      position,
      status: 'track',
      rating: 3,
      tacticalFitPercent: 75,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      notes: {
        tecnica: 'Sinalizado para avaliação posterior.',
        tatica: 'Sinalizado para avaliação posterior.',
        fisica: 'Sinalizado para avaliação posterior.',
        psicologica: 'Sinalizado para avaliação posterior.',
      },
      timeline: [
        {
          id: `t_${Date.now()}`,
          date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          title: 'Sinalizado na Base de Dados (Pendente de Avaliação)',
          scout: 'Director / Scout Senior',
          rating: 6
        }
      ],
      wyscoutUrl,
      hudlUrl,
      transfermarktUrl: transfermarktUrl.trim() || undefined,
      isContractExpiringSoon: contractEnd.includes('2024') || contractEnd.includes('2025')
    };

    onSavePlayer(newPlayer);
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 22;
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? years : 22;
  };

  const handleConfirmStep3 = () => {
    const calculatedAge = calculateAge(birthDate);

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: name.trim() || 'Novo Alvo',
      shortName: (name.split(' ').pop() || name).trim(),
      birthDate: birthDate || '2002-05-14',
      age: calculatedAge,
      heightCm: Number(heightCm) || 180,
      nationality: nationality || 'Portugal',
      flag: getFlagForNationality(nationality || 'Portugal'),
      club: club.trim() || 'Sem Clube / Livre',
      league: league.trim() || 'Liga Portugal',
      contractEnd: contractEnd || 'Jun 2025',
      agent: agent.trim() || 'Sem Agente Registado',
      dominantFoot,
      position,
      status: selectedStatus,
      rating,
      tacticalFitPercent,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      notes: {
        tecnica: tecnicaNote,
        tatica: taticaNote,
        fisica: fisicaNote,
        psicologica: psicologicaNote,
        tecnicaRating: convertCategoryInputToBase20(tecnicaVal, ratingSystem),
        taticaRating: convertCategoryInputToBase20(taticaVal, ratingSystem),
        fisicaRating: convertCategoryInputToBase20(fisicaVal, ratingSystem),
        psicologicaRating: convertCategoryInputToBase20(psicologicaVal, ratingSystem),
      },
      timeline: [
        {
          id: `t_${Date.now()}`,
          date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          title: 'Adicionado à Base de Dados Central via Wizard',
          scout: 'Director / Scout Senior',
          rating: rating * 2
        }
      ],
      wyscoutUrl,
      hudlUrl,
      transfermarktUrl: transfermarktUrl.trim() || undefined,
      isContractExpiringSoon: contractEnd.includes('2024') || contractEnd.includes('2025')
    };

    onSavePlayer(newPlayer);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Back button header (for Step 1 & Step 2) */}
      {step < 3 && (
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-[#e4bebc] hover:text-[#e5e2e3] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>VOLTAR À LISTA</span>
          </button>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs font-mono-data text-[#e4bebc]">
            <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-[#ff535b] text-white font-bold' : 'bg-[#2a2a2b]'}`}>
              Passo 1: Perfil
            </span>
            <span>→</span>
            <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-[#ff535b] text-white font-bold' : 'bg-[#2a2a2b]'}`}>
              Passo 2: Avaliação
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: NOVO PERFIL DE ALVO */}
      {step === 1 && (
        <div className="bg-[#141416] border border-[#26262B] rounded-xl p-5 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#ff535b]" />

          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#e5e2e3] tracking-tight">Novo Perfil de Alvo</h2>
            <p className="text-sm text-[#e4bebc] mt-1">Adicionar Novo Jogador à Base de Dados Shadow Scouting</p>
          </div>

          <form onSubmit={handleNextStep1} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Info Pessoal */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider mb-2 border-b border-[#26262B] pb-1">
                INFORMAÇÃO PESSOAL
              </h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Altura (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="cm"
                  required
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Nacionalidade</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              >
                {NATIONALITY_OPTIONS.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.flag} {n.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section 2: Info Desportiva */}
            <div className="col-span-1 md:col-span-2 mt-2">
              <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider mb-2 border-b border-[#26262B] pb-1">
                DADOS DESPORTIVOS & CONTRATUAIS
              </h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Clube Atual</label>
              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="Ex: SC Braga"
                required
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Liga / Divisão</label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="Ex: Liga Portugal ou HNL (Croácia)"
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Fim de Contrato</label>
              <input
                type="text"
                value={contractEnd}
                onChange={(e) => setContractEnd(e.target.value)}
                placeholder="Ex: Jun 2025"
                required
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Agência / Nome do Agente</label>
              <input
                type="text"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                placeholder="Nome do Agente ou Agência"
                className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
              />
            </div>

            {/* Section 3: Perfil Técnico Base */}
            <div className="col-span-1 md:col-span-2 mt-2">
              <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider mb-2 border-b border-[#26262B] pb-1">
                PERFIL TÉCNICO BASE
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Pé Dominante</label>
                <select
                  value={dominantFoot}
                  onChange={(e) => setDominantFoot(e.target.value as 'Direito' | 'Esquerdo' | 'Ambidestro')}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
                >
                  <option value="Direito">Direito</option>
                  <option value="Esquerdo">Esquerdo</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Posição Principal</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as PositionCode)}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm focus:border-[#98cdf2] focus:outline-none"
                >
                  <option value="PL">Ponta de Lança (PL)</option>
                  <option value="EE">Extremo Esquerdo (EE)</option>
                  <option value="ED">Extremo Direito (ED)</option>
                  <option value="MO">Médio Ofensivo (MO)</option>
                  <option value="MC">Médio Centro (MC)</option>
                  <option value="MDC">Médio Defensivo (MDC)</option>
                  <option value="DD">Defesa Direito (DD)</option>
                  <option value="DE">Defesa Esquerdo (DE)</option>
                  <option value="DC">Defesa Central (DC)</option>
                  <option value="GR">Guarda-Redes (GR)</option>
                </select>
              </div>
            </div>

            {/* Action Submit */}
            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-[#26262B]">
              <button
                type="button"
                onClick={handleQuickSaveFromStep1}
                className="w-full sm:w-auto bg-[#0b4e6e] hover:brightness-110 text-[#8abfe4] border border-[#0b4e6e] px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
                <span>Sinalizar Atleta Já (Guardar sem Avaliar)</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto bg-[#ff535b] text-white px-6 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
              >
                <span>Avançar para Avaliação Tática</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: AVALIAÇÃO E MÉTRICAS */}
      {step === 2 && (
        <div className="bg-[#141416] border border-[#26262B] rounded-xl p-5 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#98cdf2]" />

          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#e5e2e3] tracking-tight">Avaliação & Métricas</h2>
            <p className="text-sm text-[#e4bebc] mt-1">Registe a análise qualitativa e tática de {name}</p>
          </div>

          <form onSubmit={handleNextStep2} className="flex flex-col gap-6">
            {/* Tactical Fit slider & Overall rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#131314] p-4 rounded-lg border border-[#26262B]">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Adequação Tática (%)</label>
                  <span className="font-mono-data text-lg font-bold text-[#98cdf2]">{tacticalFitPercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={tacticalFitPercent}
                  onChange={(e) => setTacticalFitPercent(Number(e.target.value))}
                  className="w-full accent-[#ff535b] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">
                  Avaliação Global (1-5 Estrelas)
                </label>
                <div className="bg-[#0e0e0f] border border-[#26262B] rounded-xl px-4 py-2 flex items-center h-[46px]">
                  <StarRating value={rating <= 5 ? rating : rating / 4} onChange={setRating} size="md" variant="stars" />
                </div>
              </div>
            </div>

            {/* Qualitative Observation Fields & Category Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Técnica */}
              <div className="flex flex-col gap-2 bg-[#131314] p-3 rounded-lg border border-[#26262B]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ffb3b1]" />
                    Análise Técnica
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data text-[#e4bebc]">Nota:</span>
                    <StarRating value={tecnicaVal <= 5 ? tecnicaVal : tecnicaVal / 4} size="xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={maxScaleVal}
                    value={tecnicaVal}
                    onChange={(e) => setTecnicaVal(Number(e.target.value))}
                    className="flex-1 accent-[#ff535b] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxScaleVal}
                    value={tecnicaVal}
                    onChange={(e) => setTecnicaVal(Math.min(maxScaleVal, Math.max(1, Number(e.target.value))))}
                    className="w-14 bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data text-center font-bold text-xs py-1 rounded"
                  />
                </div>
                <textarea
                  value={tecnicaNote}
                  onChange={(e) => setTecnicaNote(e.target.value)}
                  rows={2}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] p-2.5 text-xs focus:border-[#ff535b] focus:outline-none"
                  placeholder="Observações técnicas..."
                />
              </div>

              {/* Tática */}
              <div className="flex flex-col gap-2 bg-[#131314] p-3 rounded-lg border border-[#26262B]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#98cdf2] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#98cdf2]" />
                    Análise Tática
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data text-[#e4bebc]">Nota:</span>
                    <StarRating value={taticaVal <= 5 ? taticaVal : taticaVal / 4} size="xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={maxScaleVal}
                    value={taticaVal}
                    onChange={(e) => setTaticaVal(Number(e.target.value))}
                    className="flex-1 accent-[#ff535b] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxScaleVal}
                    value={taticaVal}
                    onChange={(e) => setTaticaVal(Math.min(maxScaleVal, Math.max(1, Number(e.target.value))))}
                    className="w-14 bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data text-center font-bold text-xs py-1 rounded"
                  />
                </div>
                <textarea
                  value={taticaNote}
                  onChange={(e) => setTaticaNote(e.target.value)}
                  rows={2}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] p-2.5 text-xs focus:border-[#98cdf2] focus:outline-none"
                  placeholder="Observações táticas..."
                />
              </div>

              {/* Física */}
              <div className="flex flex-col gap-2 bg-[#131314] p-3 rounded-lg border border-[#26262B]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#c0c9be] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c0c9be]" />
                    Análise Física
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data text-[#e4bebc]">Nota:</span>
                    <StarRating value={fisicaVal <= 5 ? fisicaVal : fisicaVal / 4} size="xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={maxScaleVal}
                    value={fisicaVal}
                    onChange={(e) => setFisicaVal(Number(e.target.value))}
                    className="flex-1 accent-[#ff535b] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxScaleVal}
                    value={fisicaVal}
                    onChange={(e) => setFisicaVal(Math.min(maxScaleVal, Math.max(1, Number(e.target.value))))}
                    className="w-14 bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data text-center font-bold text-xs py-1 rounded"
                  />
                </div>
                <textarea
                  value={fisicaNote}
                  onChange={(e) => setFisicaNote(e.target.value)}
                  rows={2}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] p-2.5 text-xs focus:border-[#c0c9be] focus:outline-none"
                  placeholder="Observações físicas..."
                />
              </div>

              {/* Psicológica */}
              <div className="flex flex-col gap-2 bg-[#131314] p-3 rounded-lg border border-[#26262B]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8a9389] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#8a9389]" />
                    Atitude & Psicológica
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data text-[#e4bebc]">Nota:</span>
                    <StarRating value={psicologicaVal <= 5 ? psicologicaVal : psicologicaVal / 4} size="xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={maxScaleVal}
                    value={psicologicaVal}
                    onChange={(e) => setPsicologicaVal(Number(e.target.value))}
                    className="flex-1 accent-[#ff535b] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxScaleVal}
                    value={psicologicaVal}
                    onChange={(e) => setPsicologicaVal(Math.min(maxScaleVal, Math.max(1, Number(e.target.value))))}
                    className="w-14 bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] font-mono-data text-center font-bold text-xs py-1 rounded"
                  />
                </div>
                <textarea
                  value={psicologicaNote}
                  onChange={(e) => setPsicologicaNote(e.target.value)}
                  rows={2}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] p-2.5 text-xs focus:border-[#8a9389] focus:outline-none"
                  placeholder="Observações psicológicas..."
                />
              </div>
            </div>

            {/* Platform & External links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Link Transfermarkt</label>
                <input
                  type="url"
                  value={transfermarktUrl}
                  onChange={(e) => setTransfermarktUrl(e.target.value)}
                  placeholder="https://www.transfermarkt.pt/..."
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm font-mono-data focus:border-[#ff535b] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Link Wyscout Video</label>
                <input
                  type="text"
                  value={wyscoutUrl}
                  onChange={(e) => setWyscoutUrl(e.target.value)}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm font-mono-data focus:border-[#98cdf2] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#e4bebc] uppercase tracking-wider">Link Hudl Analysis</label>
                <input
                  type="text"
                  value={hudlUrl}
                  onChange={(e) => setHudlUrl(e.target.value)}
                  className="w-full rounded bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm font-mono-data focus:border-[#98cdf2] outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2a2a2b] text-[#e5e2e3] rounded-xl text-xs font-bold hover:bg-[#353436] uppercase tracking-wider"
              >
                Voltar
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleQuickSaveFromStep1}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#0b4e6e]/40 hover:bg-[#0b4e6e] text-[#8abfe4] border border-[#0b4e6e] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[18px]">skip_next</span>
                  <span>Saltar Avaliação e Guardar</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#ff535b] text-white px-6 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 text-xs uppercase tracking-wider"
                >
                  <span>Submeter Avaliação</span>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: SUCESSO DA SUBMISSÃO & ATRIBUIÇÃO À SHORTLIST */}
      {step === 3 && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-6 animate-fade-in relative z-10">
          {/* Success Indicator Ring */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#1C1C1F] border border-[#26262B] flex items-center justify-center mb-4 success-pulse">
              <span className="material-symbols-outlined text-[52px] text-[#4CAF50] fill-icon">
                check_circle
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#e5e2e3] mb-2 tracking-tight">
              Avaliação do Jogador Submetida com Sucesso
            </h1>
            <p className="text-sm text-[#e4bebc] max-w-md">
              Os dados técnicos e táticos foram registados e sincronizados com a base de dados central.
            </p>
          </div>

          {/* Action Card Assignment */}
          <div className="glass-panel w-full rounded-xl p-6 flex flex-col gap-4 shadow-2xl">
            <h2 className="text-base font-bold text-[#e5e2e3] border-b border-[#353436] pb-2">
              Atribuir jogador a uma lista de acompanhamento:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              {/* Contratar */}
              <button
                type="button"
                onClick={() => setSelectedStatus('hire')}
                className={`flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                  selectedStatus === 'hire'
                    ? 'border-[#ff535b] bg-[#1C1C1F] ring-1 ring-[#ff535b]'
                    : 'border-[#26262B] bg-[#0A0A0B] hover:border-[#ff535b] hover:bg-[#1C1C1F]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-[#E63946]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e5e2e3]">
                    Contratar (Alta Prioridade)
                  </span>
                </div>
                <span className="text-xs text-[#e4bebc]">Avançar para negociações imediatas.</span>
              </button>

              {/* Continuar a Acompanhar */}
              <button
                type="button"
                onClick={() => setSelectedStatus('track')}
                className={`flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                  selectedStatus === 'track'
                    ? 'border-[#98cdf2] bg-[#1C1C1F] ring-1 ring-[#98cdf2]'
                    : 'border-[#26262B] bg-[#0A0A0B] hover:border-[#98cdf2] hover:bg-[#1C1C1F]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-[#457B9D]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e5e2e3]">
                    Continuar a Acompanhar
                  </span>
                </div>
                <span className="text-xs text-[#e4bebc]">Manter debaixo de olho para futura avaliação.</span>
              </button>

              {/* Opção de Plantel / Rotação */}
              <button
                type="button"
                onClick={() => setSelectedStatus('squad')}
                className={`flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                  selectedStatus === 'squad'
                    ? 'border-[#c0c9be] bg-[#1C1C1F] ring-1 ring-[#c0c9be]'
                    : 'border-[#26262B] bg-[#0A0A0B] hover:border-[#c0c9be] hover:bg-[#1C1C1F]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-[#8A9389]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e5e2e3]">
                    Opção de Plantel / Rotação
                  </span>
                </div>
                <span className="text-xs text-[#e4bebc]">Jogador útil para profundidade do plantel.</span>
              </button>

              {/* Descartar */}
              <button
                type="button"
                onClick={() => setSelectedStatus('discard')}
                className={`flex flex-col items-start p-4 rounded-lg border text-left transition-all ${
                  selectedStatus === 'discard'
                    ? 'border-[#353436] bg-[#1C1C1F] ring-1 ring-[#353436]'
                    : 'border-[#26262B] bg-[#0A0A0B] hover:border-[#353436] hover:bg-[#1C1C1F]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-[#353436]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e5e2e3]">
                    Descartar
                  </span>
                </div>
                <span className="text-xs text-[#e4bebc]">Não cumpre os requisitos do clube.</span>
              </button>
            </div>

            {/* Confirm Actions */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleConfirmStep3}
                className="px-6 py-2 bg-[#1C1C1F] text-[#e5e2e3] border border-[#26262B] rounded hover:bg-[#353436] transition-colors font-bold text-xs uppercase tracking-wider"
              >
                Ignorar
              </button>

              <button
                type="button"
                onClick={handleConfirmStep3}
                className="px-6 py-2 bg-[#E63946] text-white rounded hover:brightness-110 transition-all font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
              >
                Confirmar Seleção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
