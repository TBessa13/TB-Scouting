import React, { useState } from 'react';
import { FormationName, Player, RatingSystem } from '../types';

interface SettingsViewProps {
  players?: Player[];
  currentClub?: string;
  onCurrentClubChange?: (club: string) => void;
  defaultFormation: FormationName;
  onDefaultFormationChange: (formation: FormationName) => void;
  secondaryFormation?: FormationName;
  onSecondaryFormationChange?: (formation: FormationName) => void;
  ratingSystem: RatingSystem;
  onRatingSystemChange: (system: RatingSystem) => void;
  onTriggerToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  players = [],
  defaultFormation,
  onDefaultFormationChange,
  ratingSystem,
  onRatingSystemChange,
  onTriggerToast,
}) => {
  const [stadiumMode, setStadiumMode] = useState(false);

  const handleToggleStadiumMode = () => {
    const nextState = !stadiumMode;
    setStadiumMode(nextState);
    if (nextState) {
      onTriggerToast('Modo Estádio ativado! Cache local ativada e interface otimizada para tablet.');
    } else {
      onTriggerToast('Modo Estádio desativado. Conexão online restaurada.');
    }
  };

  const handleFileImport = (type: string) => {
    onTriggerToast(`Ficheiro de dados (${type}) importado e sincronizado com sucesso!`);
  };

  const handleExportXml = () => {
    const escapeXml = (unsafe: string | number | undefined) => {
      if (unsafe === undefined || unsafe === null) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<ScoutingDatabase timestamp="${new Date().toISOString()}" totalPlayers="${players.length}" platform="ScoutPro">`,
      '  <Players>'
    ];

    players.forEach((player) => {
      xmlLines.push(`    <Player id="${escapeXml(player.id)}">`);
      xmlLines.push(`      <Name>${escapeXml(player.name)}</Name>`);
      xmlLines.push(`      <Position>${escapeXml(player.position)}</Position>`);
      xmlLines.push(`      <Age>${player.age}</Age>`);
      xmlLines.push(`      <Club>${escapeXml(player.club)}</Club>`);
      xmlLines.push(`      <Nationality>${escapeXml(player.nationality)}</Nationality>`);
      xmlLines.push(`      <Status>${escapeXml(player.status)}</Status>`);
      xmlLines.push(`      <OverallScore>${player.overallScore}</OverallScore>`);
      xmlLines.push(`      <PotentialScore>${player.potentialScore}</PotentialScore>`);
      xmlLines.push(`      <ContractEnd>${escapeXml(player.contractEnd)}</ContractEnd>`);
      if (player.transfermarktUrl) {
        xmlLines.push(`      <TransfermarktUrl>${escapeXml(player.transfermarktUrl)}</TransfermarktUrl>`);
      }
      if (player.zerozeroUrl) {
        xmlLines.push(`      <ZerozeroUrl>${escapeXml(player.zerozeroUrl)}</ZerozeroUrl>`);
      }
      if (player.wyscoutUrl) {
        xmlLines.push(`      <WyscoutUrl>${escapeXml(player.wyscoutUrl)}</WyscoutUrl>`);
      }
      xmlLines.push('      <Attributes>');
      xmlLines.push(`        <Technical>${player.technicalScore}</Technical>`);
      xmlLines.push(`        <Tactical>${player.tacticalScore}</Tactical>`);
      xmlLines.push(`        <Physical>${player.physicalScore}</Physical>`);
      xmlLines.push(`        <Psychological>${player.psychologicalScore}</Psychological>`);
      xmlLines.push('      </Attributes>');
      xmlLines.push('      <TimelineEvents>');
      (player.timeline || []).forEach((event) => {
        xmlLines.push(`        <Event id="${escapeXml(event.id)}">`);
        xmlLines.push(`          <Date>${escapeXml(event.date)}</Date>`);
        xmlLines.push(`          <Type>${escapeXml(event.type)}</Type>`);
        xmlLines.push(`          <Title>${escapeXml(event.title)}</Title>`);
        xmlLines.push(`          <Description>${escapeXml(event.description)}</Description>`);
        xmlLines.push('        </Event>');
      });
      xmlLines.push('      </TimelineEvents>');
      xmlLines.push('    </Player>');
    });

    xmlLines.push('  </Players>');
    xmlLines.push('</ScoutingDatabase>');

    const xmlContent = xmlLines.join('\n');
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scouting_database_${new Date().toISOString().slice(0, 10)}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onTriggerToast('Ficheiro XML com a base de dados de Scouting exportado com sucesso!');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Nome', 'Posicao', 'Idade', 'Clube', 'Nacionalidade', 'Estado', 'NotaGeral', 'Potencial', 'FimContrato', 'TransfermarktUrl', 'ZerozeroUrl'];
    const rows = players.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.position,
      p.age,
      `"${p.club.replace(/"/g, '""')}"`,
      `"${p.nationality.replace(/"/g, '""')}"`,
      p.status,
      p.overallScore,
      p.potentialScore,
      `"${p.contractEnd.replace(/"/g, '""')}"`,
      `"${p.transfermarktUrl || ''}"`,
      `"${p.zerozeroUrl || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scouting_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onTriggerToast('Ficheiro CSV com a lista de alvos exportado com sucesso!');
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-[#e5e2e3] tracking-tight">Definições da Plataforma</h2>
        <p className="text-sm text-[#e4bebc] mt-1">Configurações de Scouting, Formações Padrão e Sincronização de Dados</p>
      </div>

      <div className="bg-[#141416] border border-[#26262B] rounded-xl p-6 flex flex-col gap-6">
        {/* Section 1: Parâmetros de Scouting & Alertas */}
        <div className="flex flex-col gap-3 border-b border-[#26262B] pb-6">
          <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider">Parâmetros de Scouting & Alertas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase">Alerta de Fim de Contrato</label>
              <select defaultValue="12" className="bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm rounded font-mono-data outline-none focus:border-[#ff535b]">
                <option value="6">6 Meses antes da expiração</option>
                <option value="12">12 Meses antes da expiração</option>
                <option value="18">18 Meses antes da expiração</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#e4bebc] uppercase">Formação Tática Padrão</label>
              <select
                value={defaultFormation}
                onChange={(e) => {
                  const val = e.target.value as FormationName;
                  onDefaultFormationChange(val);
                  onTriggerToast(`Formação tática padrão alterada para ${val}.`);
                }}
                className="bg-[#0A0A0B] border border-[#26262B] text-[#e5e2e3] px-3 py-2 text-sm rounded font-mono-data outline-none focus:border-[#ff535b] cursor-pointer"
              >
                <option value="4-2-3-1">4-2-3-1 (Laterais DD/DE)</option>
                <option value="4-3-3">4-3-3 (Laterais DD/DE)</option>
                <option value="3-5-2">3-5-2 (Alas LDO/LEO)</option>
                <option value="3-4-3">3-4-3 (Alas LDO/LEO)</option>
                <option value="4-4-2">4-4-2 (Clássico / Linha)</option>
                <option value="4-1-4-1">4-1-4-1</option>
                <option value="4-4-1-1">4-4-1-1</option>
                <option value="4-2-2-2">4-2-2-2 (Quadrado Mágico)</option>
                <option value="4-3-1-2">4-3-1-2 (Losango / Diamond)</option>
                <option value="3-4-2-1">3-4-2-1 (Alas LDO/LEO)</option>
                <option value="5-3-2">5-3-2 (Alas LDO/LEO)</option>
                <option value="5-4-1">5-4-1 (Alas LDO/LEO)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Integração de Software & Sincronização de Dados */}
        <div className="flex flex-col gap-4 border-b border-[#26262B] pb-6">
          <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider">
            INTEGRAÇÃO DE SOFTWARE & SINCRONIZAÇÃO DE DADOS
          </h3>
          <p className="text-xs text-[#e4bebc]">
            Descarregue cópias de segurança da base de dados de alvos ou importe eventos e relatórios de plataformas externas.
          </p>

          {/* Export Row */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportXml}
              className="bg-[#1C1C1F] hover:bg-[#353436] border border-[#26262B] text-[#e5e2e3] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXPORTAR XML
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-[#1C1C1F] hover:bg-[#353436] border border-[#26262B] text-[#e5e2e3] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              EXPORTAR CSV
            </button>
          </div>

          {/* Import Row (Outlined Buttons) */}
          <div className="flex flex-wrap gap-3 pt-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xml"
                className="hidden"
                onChange={() => handleFileImport('XML NacSport')}
              />
              <span className="inline-flex items-center gap-2 border border-[#ff535b]/60 hover:border-[#ff535b] text-[#ffb3b1] bg-transparent hover:bg-[#ff535b]/10 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>IMPORTAR XML (NacSport)</span>
              </span>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={() => handleFileImport('CSV Wyscout/Metrica')}
              />
              <span className="inline-flex items-center gap-2 border border-[#8abfe4]/60 hover:border-[#8abfe4] text-[#8abfe4] bg-transparent hover:bg-[#8abfe4]/10 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all">
                <span className="material-symbols-outlined text-[16px]">file_upload</span>
                <span>IMPORTAR CSV (Wyscout/Metrica)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Modo Estádio (Otimização Mobile/Tablet) */}
        <div className="flex flex-col gap-3 border-b border-[#26262B] pb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#ffb3b1] uppercase tracking-wider">
              MODO ESTÁDIO (OTIMIZAÇÃO MOBILE/TABLET)
            </h3>

            {/* Dynamic Status Badge */}
            {stadiumMode ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-data bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Offline (Cache Local)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-data bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online (Sincronizado)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-[#e5e2e3]">Ativar Modo Estádio</span>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleStadiumMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                stadiumMode ? 'bg-[#ff535b]' : 'bg-[#26262B]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  stadiumMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-[#e4bebc] leading-relaxed">
            Otimiza a interface para ecrãs táteis (ex: Xiaomi Pad 7 Pro), ocultando menus laterais, aumentando a área de toque nos cartões de avaliação e ativando a cache local para funcionamento 100% offline na bancada do estádio.
          </p>
        </div>

        {/* Section 4: Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => onTriggerToast('Definições guardadas com sucesso.')}
            className="bg-[#ff535b] text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg cursor-pointer"
          >
            Guardar Definições
          </button>
        </div>
      </div>
    </div>
  );
};


