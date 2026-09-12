import React, { useState } from 'react';
import { Player, PlayerStatus, PositionCode, RatingSystem } from '../types';
import { NATIONALITY_OPTIONS, getFlagForNationality } from '../data/nationalities';
import { ReportPdfSection } from './ReportPdfSection';

interface ScoutWizardProps {
  onCancel: () => void;
  onSavePlayer: (player: Player) => void;
  ratingSystem?: RatingSystem;
}

export const ScoutWizard: React.FC<ScoutWizardProps> = ({
  onCancel,
  onSavePlayer,
  ratingSystem = '20' as RatingSystem,
}) => {
  // Form Fields - Personal & General
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [position, setPosition] = useState<PositionCode>('PL');
  const [birthDate, setBirthDate] = useState('2002-05-14');
  const [heightCm, setHeightCm] = useState<number | ''>(182);
  const [nationality, setNationality] = useState('Portugal');
  const [flag, setFlag] = useState('🇵🇹');
  const [dominantFoot, setDominantFoot] = useState<'Direito' | 'Esquerdo' | 'Ambidestro'>('Direito');

  // Sporting & Contractual
  const [club, setClub] = useState('');
  const [league, setLeague] = useState('Liga Portugal');
  const [contractEnd, setContractEnd] = useState('Jun 2026');
  const [agent, setAgent] = useState('');
  const [status, setStatus] = useState<PlayerStatus>('pending');
  const [pipelineStage, setPipelineStage] = useState<'Sinalizado' | 'Em Análise' | 'Analisado'>('Sinalizado');

  // Tactical Fit & Rating with 'Pendente (-)' checkboxes
  const [tacticalFitPercent, setTacticalFitPercent] = useState<number | null>(null);
  const [isTacticalUnevaluated, setIsTacticalUnevaluated] = useState<boolean>(true);

  const [rating, setRating] = useState<number | null>(null);
  const [isRatingUnevaluated, setIsRatingUnevaluated] = useState<boolean>(true);

  // Relatório de Observação (PDF)
  const [reportPdfUrl, setReportPdfUrl] = useState<string | undefined>(undefined);
  const [reportPdfName, setReportPdfName] = useState<string | undefined>(undefined);
  const [generalNotes, setGeneralNotes] = useState('');

  // Video & Analysis Platform Links
  const [transfermarktUrl, setTransfermarktUrl] = useState('');
  const [zerozeroUrl, setZerozeroUrl] = useState('');
  const [wyscoutUrl, setWyscoutUrl] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, introduza o nome do jogador.');
      return;
    }

    const calculatedAge = calculateAge(birthDate);

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim() || (name.split(' ').pop() || name).trim(),
      birthDate,
      age: calculatedAge,
      heightCm: Number(heightCm) || 180,
      nationality,
      flag,
      club: club.trim() || 'Sem Clube / Livre',
      league: league.trim() || 'Liga Portugal',
      contractEnd: contractEnd.trim() || 'Jun 2026',
      agent: agent.trim() || 'Sem Agente Registado',
      dominantFoot,
      position,
      status,
      pipelineStage,
      rating: isRatingUnevaluated ? null : (rating ?? 3),
      tacticalFitPercent: isTacticalUnevaluated ? null : (tacticalFitPercent ?? 75),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      reportPdfUrl,
      reportPdfName,
      generalNotes: generalNotes.trim() || undefined,
      timeline: [
        {
          id: `t_${Date.now()}`,
          date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          title: 'Registo de Novo Alvo na Base de Dados',
          scout: 'Director / Scout Senior',
          rating: isRatingUnevaluated ? undefined : (rating ?? undefined),
        },
      ],
      wyscoutUrl: wyscoutUrl.trim() || undefined,
      transfermarktUrl: transfermarktUrl.trim() || undefined,
      zerozeroUrl: zerozeroUrl.trim() || undefined,
      isContractExpiringSoon: contractEnd.includes('2024') || contractEnd.includes('2025'),
    };

    onSavePlayer(newPlayer);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-3 sm:px-6 animate-fade-in">
      {/* Container matching EditPlayerModal design */}
      <div className="bg-[#1c1b1c] border border-[#353436] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353436] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center text-[#ff535b]">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#e5e2e3]">Registar Novo Alvo</h2>
              <p className="text-xs text-[#e4bebc]/70">Criar ficha completa de atleta na base de dados de prospeção</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-[#26262B] text-[#e4bebc] hover:text-[#e5e2e3] transition-colors cursor-pointer"
            title="Cancelar e voltar à lista"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-6">
          {/* Section 1: Dados Pessoais & Gerais */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              DADOS PESSOAIS & GERAIS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Nome Completo <span className="text-[#ff535b]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Diogo Costa"
                  required
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Nome Curto / Abreviado
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Ex: D. Costa"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Posição Principal
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as PositionCode)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] cursor-pointer"
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

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ex: 185"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Pé Dominante
                </label>
                <select
                  value={dominantFoot}
                  onChange={(e) => setDominantFoot(e.target.value as 'Direito' | 'Esquerdo' | 'Ambidestro')}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] cursor-pointer"
                >
                  <option value="Direito">Direito</option>
                  <option value="Esquerdo">Esquerdo</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
                    className="flex-1 bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] cursor-pointer"
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
            </div>
          </div>

          {/* Section 2: Dados Desportivos & Contratuais */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              DADOS DESPORTIVOS & CONTRATUAIS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Clube Atual
                </label>
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Ex: FC Porto, Sporting CP..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Liga / Competição
                </label>
                <input
                  type="text"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="Ex: Liga Portugal"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Fim de Contrato
                </label>
                <input
                  type="text"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                  placeholder="Ex: Jun 2026"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Agente / Agência
                </label>
                <input
                  type="text"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder="Ex: Gestifute / Próprio"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Recomendação
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] cursor-pointer"
                >
                  <option value="pending">Por definir</option>
                  <option value="hire">Contratar (Prioridade Alta)</option>
                  <option value="track">Continuar a Acompanhar</option>
                  <option value="squad">Opção de Plantel / Plantel Principal</option>
                  <option value="discard">Descartar</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Fase do Funil
                </label>
                <select
                  value={pipelineStage}
                  onChange={(e) => setPipelineStage(e.target.value as any)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] cursor-pointer"
                >
                  <option value="Sinalizado">Sinalizado</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Analisado">Analisado</option>
                </select>
              </div>

              {/* Adequação Tática (%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase">
                    Adequação Tática (%)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTacticalUnevaluated}
                      onChange={(e) => {
                        setIsTacticalUnevaluated(e.target.checked);
                        if (!e.target.checked && (tacticalFitPercent == null || tacticalFitPercent === 0)) {
                          setTacticalFitPercent(75);
                        }
                      }}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-[#e4bebc] font-bold">Pendente (-)</span>
                  </label>
                </div>

                {isTacticalUnevaluated ? (
                  <div className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e4bebc]/60 text-xs font-mono-data rounded-xl px-3 py-2 text-center font-bold">
                    Pendente de Avaliação (-)
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={tacticalFitPercent ?? 75}
                      onChange={(e) => setTacticalFitPercent(Number(e.target.value))}
                      className="flex-1 accent-[#ff535b] cursor-pointer h-1.5 rounded-lg bg-[#0e0e0f]"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={tacticalFitPercent ?? 75}
                      onChange={(e) => setTacticalFitPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-14 bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs text-center font-mono-data rounded-xl py-1.5 outline-none focus:border-[#ff535b]"
                    />
                  </div>
                )}
              </div>

              {/* Rating Geral (1-20) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#e4bebc] uppercase">
                    Rating Geral (1 - 20)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRatingUnevaluated}
                      onChange={(e) => {
                        setIsRatingUnevaluated(e.target.checked);
                        if (!e.target.checked && (rating == null || rating === 0)) {
                          setRating(3);
                        }
                      }}
                      className="accent-[#ff535b] rounded cursor-pointer"
                    />
                    <span className="text-[10px] text-[#e4bebc] font-bold">Pendente (-)</span>
                  </label>
                </div>

                {isRatingUnevaluated ? (
                  <div className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e4bebc]/60 text-xs font-mono-data rounded-xl px-3 py-2 text-center font-bold">
                    Pendente de Avaliação (-)
                  </div>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rating ?? 3}
                    onChange={(e) => setRating(Math.min(20, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs font-mono-data rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Relatório de Observação (PDF ou Link Cloud) */}
          <ReportPdfSection
            pdfUrl={reportPdfUrl}
            pdfName={reportPdfName}
            onChange={(url, name) => {
              setReportPdfUrl(url);
              setReportPdfName(name);
            }}
          />

          {/* Section 3.5: Apontamentos Gerais */}
          <div className="flex flex-col gap-2 bg-[#131314] p-4 rounded-xl border border-[#26262B]">
            <div className="flex items-center gap-2 border-b border-[#26262B] pb-2">
              <span className="material-symbols-outlined text-[#ff535b] text-[18px]">edit_note</span>
              <label className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider">
                Apontamentos Gerais
              </label>
            </div>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Escreva aqui apontamentos livres, notas de reuniões, contexto contratual ou observações gerais..."
              className="w-full bg-[#0A0A0B] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] text-xs p-3 rounded-xl outline-none transition-colors leading-relaxed resize-y placeholder:text-[#e4bebc]/40"
            />
          </div>

          {/* Section 4: Links Externos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              LINKS DE ANÁLISE DE VÍDEO & PLATAFORMAS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Transfermarkt URL
                </label>
                <input
                  type="url"
                  value={transfermarktUrl}
                  onChange={(e) => setTransfermarktUrl(e.target.value)}
                  placeholder="https://www.transfermarkt.pt/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  zerozero URL
                </label>
                <input
                  type="url"
                  value={zerozeroUrl}
                  onChange={(e) => setZerozeroUrl(e.target.value)}
                  placeholder="https://www.zerozero.pt/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">
                  Wyscout URL
                </label>
                <input
                  type="url"
                  value={wyscoutUrl}
                  onChange={(e) => setWyscoutUrl(e.target.value)}
                  placeholder="https://wyscout.com/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions: Cancelar & Registar Alvo */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#353436]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-[#26262B] hover:bg-[#353436] text-[#e4bebc] hover:text-[#e5e2e3] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Registar Alvo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
