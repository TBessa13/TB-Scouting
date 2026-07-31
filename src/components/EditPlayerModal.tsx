import React, { useState } from 'react';
import { Player, PlayerStatus, PositionCode } from '../types';
import { NATIONALITY_OPTIONS, getFlagForNationality } from '../data/nationalities';

interface EditPlayerModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSavePlayer: (updatedPlayer: Player) => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  player,
  isOpen,
  onClose,
  onSavePlayer,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(player.name);
  const [shortName, setShortName] = useState(player.shortName || '');
  const [position, setPosition] = useState<PositionCode>(player.position);
  const [birthDate, setBirthDate] = useState(player.birthDate || '2002-05-14');
  const [heightCm, setHeightCm] = useState<number | ''>(player.heightCm || 180);
  const [nationality, setNationality] = useState(player.nationality || 'Portugal');
  const [flag, setFlag] = useState(player.flag || getFlagForNationality(player.nationality));
  const [club, setClub] = useState(player.club || '');
  const [league, setLeague] = useState(player.league || 'Liga Portugal');
  const [contractEnd, setContractEnd] = useState(player.contractEnd || 'Jun 2025');
  const [agent, setAgent] = useState(player.agent || '');
  const [dominantFoot, setDominantFoot] = useState<'Direito' | 'Esquerdo' | 'Ambidestro'>(
    player.dominantFoot || 'Direito'
  );
  const [status, setStatus] = useState<PlayerStatus>(player.status);
  const [pipelineStage, setPipelineStage] = useState<'Sinalizado' | 'Em Análise' | 'Analisado' | undefined>(
    player.pipelineStage
  );

  // Notes
  const [tecnicaNote, setTecnicaNote] = useState(player.notes?.tecnica || '');
  const [taticaNote, setTaticaNote] = useState(player.notes?.tatica || '');
  const [fisicaNote, setFisicaNote] = useState(player.notes?.fisica || '');
  const [psicologicaNote, setPsicologicaNote] = useState(player.notes?.psicologica || '');

  // External Links
  const [wyscoutUrl, setWyscoutUrl] = useState(player.wyscoutUrl || '');
  const [hudlUrl, setHudlUrl] = useState(player.hudlUrl || '');
  const [transfermarktUrl, setTransfermarktUrl] = useState(player.transfermarktUrl || '');

  const calculateAge = (dob: string): number => {
    if (!dob) return player.age || 22;
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? years : player.age || 22;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, introduza o nome do jogador.');
      return;
    }

    const updatedPlayer: Player = {
      ...player,
      name: name.trim(),
      shortName: shortName.trim() || (name.split(' ').pop() || name).trim(),
      birthDate,
      age: calculateAge(birthDate),
      heightCm: Number(heightCm) || 180,
      nationality,
      flag,
      club: club.trim() || 'Sem Clube / Livre',
      league: league.trim() || 'Liga Portugal',
      contractEnd: contractEnd.trim() || 'Jun 2025',
      agent: agent.trim() || 'Sem Agente Registado',
      dominantFoot,
      position,
      status,
      pipelineStage,
      notes: {
        ...player.notes,
        tecnica: tecnicaNote,
        tatica: taticaNote,
        fisica: fisicaNote,
        psicologica: psicologicaNote,
      },
      wyscoutUrl: wyscoutUrl.trim() || undefined,
      hudlUrl: hudlUrl.trim() || undefined,
      transfermarktUrl: transfermarktUrl.trim() || undefined,
    };

    onSavePlayer(updatedPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c1b1c] border border-[#353436] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#353436] flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b4e6e]/40 border border-[#0b4e6e] flex items-center justify-center text-[#8abfe4]">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#e5e2e3]">Editar Ficha do Atleta</h2>
              <p className="text-xs text-[#e4bebc]/70">Atualizar dados gerais, contratuais e notas de prospeção</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#26262B] text-[#e4bebc] hover:text-[#e5e2e3] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-6 scrollbar-thin">
          {/* Section 1: Dados Pessoais */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              DADOS PESSOAIS & GERAIS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Nome Curto / Abreviado</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Posição Principal</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as PositionCode)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
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
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Pé Dominante</label>
                <select
                  value={dominantFoot}
                  onChange={(e) => setDominantFoot(e.target.value as 'Direito' | 'Esquerdo' | 'Ambidestro')}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                >
                  <option value="Direito">Direito</option>
                  <option value="Esquerdo">Esquerdo</option>
                  <option value="Ambidestro">Ambidestro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Nacionalidade / Bandeira</label>
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
            </div>
          </div>

          {/* Section 2: Dados Desportivos & Contratuais */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              DADOS DESPORTIVOS & CONTRATUAIS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Clube Atual</label>
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Ex: FC Porto, Sporting CP..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Liga / Competição</label>
                <input
                  type="text"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="Ex: Liga Portugal"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Fim de Contrato</label>
                <input
                  type="text"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                  placeholder="Ex: Jun 2026"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Agente / Agência</label>
                <input
                  type="text"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder="Ex: Gestifute / Próprio"
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Estado no Quadro</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                >
                  <option value="hire">Contratar (Prioridade Alta)</option>
                  <option value="track">Continuar a Acompanhar</option>
                  <option value="squad">Opção de Plantel / Plantel Principal</option>
                  <option value="discard">Descartar</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Fase do Funil</label>
                <select
                  value={pipelineStage || 'Sinalizado'}
                  onChange={(e) => setPipelineStage(e.target.value as any)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b]"
                >
                  <option value="Sinalizado">Sinalizado</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Analisado">Analisado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Observações & Avaliação */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              OBSERVAÇÕES DE PROSPEÇÃO (NOTAS DO SCOUT)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Análise Técnica</label>
                <textarea
                  value={tecnicaNote}
                  onChange={(e) => setTecnicaNote(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl p-2.5 outline-none focus:border-[#ff535b]"
                  placeholder="Capacidade de passe, primeiro toque, drible..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Análise Tática</label>
                <textarea
                  value={taticaNote}
                  onChange={(e) => setTaticaNote(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl p-2.5 outline-none focus:border-[#ff535b]"
                  placeholder="Posicionamento, leitura de jogo, transições..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Análise Física</label>
                <textarea
                  value={fisicaNote}
                  onChange={(e) => setFisicaNote(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl p-2.5 outline-none focus:border-[#ff535b]"
                  placeholder="Arranque, velocidade máxima, duelos aéreos..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Análise Psicológica</label>
                <textarea
                  value={psicologicaNote}
                  onChange={(e) => setPsicologicaNote(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl p-2.5 outline-none focus:border-[#ff535b]"
                  placeholder="Liderança, foco sob pressão, atitude..."
                />
              </div>
            </div>
          </div>

          {/* Section 4: Links Externos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#ffb3b1] uppercase tracking-wider border-b border-[#26262B] pb-1">
              LINKS DE ANÁLISE DE VÍDEO & PLATAFORMAS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Transfermarkt URL</label>
                <input
                  type="url"
                  value={transfermarktUrl}
                  onChange={(e) => setTransfermarktUrl(e.target.value)}
                  placeholder="https://www.transfermarkt.pt/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Wyscout URL</label>
                <input
                  type="url"
                  value={wyscoutUrl}
                  onChange={(e) => setWyscoutUrl(e.target.value)}
                  placeholder="https://wyscout.com/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#e4bebc] uppercase mb-1">Hudl URL</label>
                <input
                  type="url"
                  value={hudlUrl}
                  onChange={(e) => setHudlUrl(e.target.value)}
                  placeholder="https://hudl.com/..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] text-[#e5e2e3] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#ff535b] font-mono-data"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#353436]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#26262B] text-[#e4bebc] hover:text-[#e5e2e3] text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#ff535b] hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Guardar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
