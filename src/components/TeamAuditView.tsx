import React, { useState, useEffect } from 'react';
import { Player, PositionCode, AttachmentFile, PositionalRequirement, FormationName } from '../types';
import { AttachmentsSection } from './AttachmentsSection';
import { PositionalRequirementsForm } from './PositionalRequirementsForm';
import { StarRating } from './StarRating';
import { ReportPdfSection } from './ReportPdfSection';

export interface PositionAuditItem {
  positionCode: PositionCode;
  positionLabel: string;
  playerNames: string;
  rating: number; // 1-10 rating
  status: 'solido' | 'abaixo' | 'reforco' | 'destaque';
  notes: string;
}

export interface TeamAuditMatch {
  id: string;
  date: string;
  competition: string;
  opponent: string;
  isHome: boolean;
  score?: string;
  status: 'agendado' | 'concluido';
  venue: string;
  reportPdfUrl?: string;
  reportPdfName?: string;
  tacticalGapsNote: string;
  recruitmentProfileNote: string;
  priorityPositions: PositionCode[];
  positionAudits: PositionAuditItem[];
  attachments?: AttachmentFile[];
}

interface TeamAuditViewProps {
  squadPlayers: Player[];
  onPlayerClick?: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  defaultFormation?: FormationName;
  onFormationChange?: (formation: FormationName) => void;
}

export const TACTICAL_POSITIONS_DICT: Record<PositionCode, { code: PositionCode; label: string; sector: string }> = {
  GR: { code: 'GR', label: 'Guarda-Redes', sector: 'Baliza' },
  DC: { code: 'DC', label: 'Defesa Central', sector: 'Defesa' },
  DD: { code: 'DD', label: 'Lateral Direito', sector: 'Defesa' },
  DE: { code: 'DE', label: 'Lateral Esquerdo', sector: 'Defesa' },
  LDO: { code: 'LDO', label: 'Lateral Direito Ofensivo (Ala)', sector: 'Defesa / Ala' },
  LEO: { code: 'LEO', label: 'Lateral Esquerdo Ofensivo (Ala)', sector: 'Defesa / Ala' },
  MDC: { code: 'MDC', label: 'Médio Defensivo', sector: 'Meio-Campo' },
  MC: { code: 'MC', label: 'Médio Centro', sector: 'Meio-Campo' },
  MO: { code: 'MO', label: 'Médio Ofensivo', sector: 'Meio-Campo' },
  EE: { code: 'EE', label: 'Extremo Esquerdo', sector: 'Ataque' },
  ED: { code: 'ED', label: 'Extremo Direito', sector: 'Ataque' },
  PL: { code: 'PL', label: 'Ponta de Lança', sector: 'Ataque' },
};

export const POSITIONS_BY_FORMATION: Record<FormationName, PositionCode[]> = {
  '4-2-3-1': ['GR', 'DD', 'DC', 'DE', 'MC', 'MO', 'ED', 'EE', 'PL'],
  '4-3-3': ['GR', 'DD', 'DC', 'DE', 'MDC', 'MC', 'ED', 'EE', 'PL'],
  '4-4-2': ['GR', 'DD', 'DC', 'DE', 'MC', 'ED', 'EE', 'PL'],
  '4-1-4-1': ['GR', 'DD', 'DC', 'DE', 'MDC', 'MC', 'ED', 'EE', 'PL'],
  '4-4-1-1': ['GR', 'DD', 'DC', 'DE', 'MC', 'MO', 'ED', 'EE', 'PL'],
  '4-2-2-2': ['GR', 'DD', 'DC', 'DE', 'MDC', 'MO', 'PL'],
  '4-3-1-2': ['GR', 'DD', 'DC', 'DE', 'MDC', 'MC', 'MO', 'PL'],
  '3-5-2': ['GR', 'DC', 'LEO', 'LDO', 'MDC', 'MC', 'PL'],
  '3-4-3': ['GR', 'DC', 'LEO', 'LDO', 'MC', 'ED', 'EE', 'PL'],
  '3-4-2-1': ['GR', 'DC', 'LEO', 'LDO', 'MC', 'MO', 'PL'],
  '5-3-2': ['GR', 'DC', 'LEO', 'LDO', 'MDC', 'MC', 'PL'],
  '5-4-1': ['GR', 'DC', 'LEO', 'LDO', 'MC', 'ED', 'EE', 'PL'],
};

const DEFAULT_POSITIONAL_REQUIREMENTS: Record<PositionCode, PositionalRequirement> = {
  GR: {
    positionCode: 'GR',
    physicalTags: ['Estatura Elevada (>1.88m)', 'Agilidade Explosiva', 'Alcance de Braços', 'Flexibilidade'],
    tacticalTags: ['Organização Defensiva', 'Posicionamento sob Remate', 'Leitura de Cruzamentos', 'Líbero em Transição'],
    technicalTags: ['Jogo de Pés (Saída Curta)', 'Passe Longo de Reposição', 'Defesa de Remates Próximos', 'Segurança nas Mãos'],
    psychologicalTags: ['Liderança & Comunicação', 'Foco Continuado 90\'', 'Calma sob Pressão', 'Resiliência após Erro'],
    boardDirectives: 'Exigência de guarda-redes capaz de atuar como líbero e iniciar construção desde trás com os pés, garantindo conforto sob pressão alta do adversário.',
  },
  DD: {
    positionCode: 'DD',
    physicalTags: ['Aceleração & Velocidade', 'Resistência Aeróbica (Caixa)', 'Capacidade de Duelo 1v1', 'Recuperação Rápida'],
    tacticalTags: ['Fecho de Espaço Interior', 'Timing de Sobreposição (Overlap)', 'Controlo do Lado Cego', 'Balanço Defensivo'],
    technicalTags: ['Cruzamento em Andamento', 'Passe em Progressão', 'Desarme Limpo', 'Primeiro Toque sob Pressão'],
    psychologicalTags: ['Agressividade Positiva', 'Disciplina Tática', 'Espírito de Sacrifício', 'Concentração 90\''],
    boardDirectives: 'Lateral de perfil ofensivo capaz de dar largura total no corredor direito e chegar à linha de fundo com qualidade de cruzamento.',
  },
  DC: {
    positionCode: 'DC',
    physicalTags: ['Duelo Aéreo Dominante', 'Força Física & Impulsão', 'Velocidade em Média Distância', 'Robustez no Contacto'],
    tacticalTags: ['Controlo da Linha de Fora de Jogo', 'Cobertura ao Lateral', 'Antecipação ao Avançado', 'Temporização'],
    technicalTags: ['Passe Vertical de Ruptura', 'Corte & Desarme Rasteiro', 'Cabeceamento Defensivo/Ofensivo', 'Condução de Bola'],
    psychologicalTags: ['Comunicação / Voz de Comando', 'Coragem nos Duelos', 'Foco Implacável', 'Compostura sob Pressão'],
    boardDirectives: 'Central com perfil forte no jogo aéreo e capacidade de quebrar linhas através do passe vertical de construção.',
  },
  DE: {
    positionCode: 'DE',
    physicalTags: ['Velocidade de Ponta', 'Resistência em Alta Intensidade', 'Equilíbrio em Mudança de Direção', 'Capacidade de Sprint Repetido'],
    tacticalTags: ['Associação por Dentro (Underlap)', 'Apoio ao Extremo', 'Posicionamento no Segundo Poste', 'Pressão no Portador'],
    technicalTags: ['Cruzamento Rasteiro & Tenso', 'Passe de Ligação', 'Dribling em Velocidade', 'Desarme Rasteiro'],
    psychologicalTags: ['Inteligência Emocional', 'Capacidade de Trabalho', 'Audácia Ofensiva', 'Resiliência'],
    boardDirectives: 'Lateral moderno capaz de projetar no corredor e associar-se por dentro no meio-campo em momento de organização ofensiva.',
  },
  LDO: {
    positionCode: 'LDO',
    physicalTags: ['Capacidade de Sprint Repetido', 'Resistência em Alta Intensidade', 'Aceleração & Velocidade de Ponta', 'Recuperação Defensiva'],
    tacticalTags: ['Projeção Total no Corredor Direito', 'Timing de Sobreposição (Overlap)', 'Pressão Alta na Saída Adversa', 'Fecho do Segundo Poste'],
    technicalTags: ['Cruzamento em Andamento & Tensão', 'Dribling 1v1 na Ala', 'Passe de Combinação Rápida', 'Desarme em Aceleração'],
    psychologicalTags: ['Audácia Ofensiva', 'Capacidade de Trabalho Continuado', 'Agressividade Positiva', 'Espírito de Sacrifício'],
    boardDirectives: 'Ala/Lateral Ofensivo responsável por garantir a largura total do corredor direito no sistema tático de 3/5 defesas.',
  },
  LEO: {
    positionCode: 'LEO',
    physicalTags: ['Resistência Cardiovascular Elevada', 'Velocidade de Ponta', 'Mudança de Direção Rápida', 'Força no Duelo na Ala'],
    tacticalTags: ['Projeção no Corredor Esquerdo', 'Associação por Dentro (Underlap)', 'Balanço Defensivo', 'Ataque à Linha de Fundo'],
    technicalTags: ['Cruzamento Tenso de Pé Esquerdo', 'Passe em Progressão', 'Primeiro Toque Orientado', 'Desarme Rasteiro'],
    psychologicalTags: ['Resiliência & Foco', 'Disciplina Tática', 'Confiança no 1v1', 'Inteligência Emocional'],
    boardDirectives: 'Ala/Lateral Ofensivo responsável pela amplitude no corredor esquerdo em sistemas táticos de 3/5 defesas.',
  },
  MDC: {
    positionCode: 'MDC',
    physicalTags: ['Raio de Ação Elevado', 'Força de Duelo no Meio-Campo', 'Equilíbrio & Centro de Gravidade', 'Resistência ao Choque'],
    tacticalTags: ['Cobertura das Costas dos Médios', 'Interceção de Linhas de Passe', 'Balanço Defensivo', 'Primeira Fase de Construção'],
    technicalTags: ['Passe Curto Seguro (90%+)', 'Orientação de Recepção', 'Desarme & Recuperação', 'Passe Rápido a 1 Toque'],
    psychologicalTags: ['Maturidade Tática', 'Friozura sob Pressão', 'Espírito Colectivo', 'Liderança Silenciosa'],
    boardDirectives: 'Pivô defensivo com excelente leitura situacional, forte no desarme e seguro a distribuir na saída de bola.',
  },
  MC: {
    positionCode: 'MC',
    physicalTags: ['Capacidade Box-to-Box', 'Aceleração em Espaços Curtos', 'Resistência Cardiovascular', 'Agilidade'],
    tacticalTags: ['Chegada à Área Adversa', 'Pressionante na Perda', 'Ocupação do Espaço entre Linhas', 'Ritmo de Jogo'],
    technicalTags: ['Passe de Ruptura / Assistência', 'Transporte de Bola', 'Remate de Meia Distância', 'Receção Orientada'],
    psychologicalTags: ['Criatividade Tática', 'Determinação', 'Comunicação de Campo', 'Mentalidade Vencedora'],
    boardDirectives: 'Médio de ligação com elevado raio de ação, capaz de acelerar a transição ofensiva e surgir em zonas de finalização.',
  },
  MO: {
    positionCode: 'MO',
    physicalTags: ['Mudança de Ritmo Explosiva', 'Agilidade & Flexibilidade', 'Equilíbrio em Rotativa', 'Aceleração 0-10m'],
    tacticalTags: ['Movimentação entre Linhas', 'Ataque à Segunda Bola', 'Visão de Jogo 360º', 'Desmarcação de Apoio'],
    technicalTags: ['Último Passe / Assistência', 'Dribling Curto', 'Finalização de Fora da Área', 'Controlo Orientado'],
    psychologicalTags: ['Improviso & Criatividade', 'Confiança / Tomada de Risco', 'Inteligência Espacial', 'Liderança Técnica'],
    boardDirectives: 'Médio ofensivo moderno, vertiginoso entre linhas, decisivo no passe de golo e com capacidade de golo próprio.',
  },
  EE: {
    positionCode: 'EE',
    physicalTags: ['Aceleração / Velocidade de Ponta', 'Explosividade 1v1', 'Agilidade Lateral', 'Capacidade de Sprint Repetido'],
    tacticalTags: ['Diagonal de Fora para Dentro', 'Ataque ao Espaço nas Costas', 'Pressão Alta na Saída Adversa', 'Apoio ao Lateral'],
    technicalTags: ['Dribling de Ruptura 1v1', 'Remate em Arco de Pé Direito', 'Cruzamento ao Segundo Poste', 'Primeiro Toque Orientado'],
    psychologicalTags: ['Audácia no Duelo', 'Persistência', 'Instinto Matador', 'Competitividade'],
    boardDirectives: 'Extremo de pé trocado (destro no lado esquerdo) focado em procurar o movimento interior para remate ou último passe.',
  },
  ED: {
    positionCode: 'ED',
    physicalTags: ['Velocidade de Explosão', 'Mudança de Direção Rápida', 'Resistência de Sprint', 'Equilíbrio no Contacto'],
    tacticalTags: ['Ataque à Linha de Fundo', 'Desmarcação em Profundidade', 'Pressão Coordenada', 'Balanço Ofensivo'],
    technicalTags: ['Cruzamento em Andamento', 'Dribling 1v1', 'Passe de Combinação Rápida', 'Finalização Rasteira'],
    psychologicalTags: ['Confiança no 1v1', 'Energia / Intensidade', 'Resiliência', 'Foco no Golo/Assistência'],
    boardDirectives: 'Extremo vertical, forte no um-contra-um, capaz de desequilibrar tanto por fora como em movimentos diagonais.',
  },
  PL: {
    positionCode: 'PL',
    physicalTags: ['Força no Duelo com Centrais', 'Impulsão & Jogo Aéreo', 'Explosividade em Curta Distância', 'Capacidade de Retenção'],
    tacticalTags: ['Ataque à Profundidade & Espaços', 'Movimentação na Área (Desmarcação)', 'Apoio de Costas para a Baliza', 'Primeiro Pressionante'],
    technicalTags: ['Finalização a 1-2 Toques', 'Cabeceamento Ofensivo', 'Jogo de Apoio / Pivot', 'Remate de Qualquer Ângulo'],
    psychologicalTags: ['Instinto de Golo (Killer Instinct)', 'Confiança Inabalável', 'Agressividade Positiva', 'Foco Continuado'],
    boardDirectives: 'Avançado completo com golo fácil, agressivo na área de rigor e com capacidade para dar apoios e segurar a equipa em transição.',
  },
};

const DEFAULT_AUDIT_MATCHES: TeamAuditMatch[] = [
  {
    id: 'audit-1',
    date: '24 JUL 2026',
    competition: 'Liga Portugal - Jornada 1',
    opponent: 'SC Braga',
    isHome: true,
    score: '1 - 1',
    status: 'concluido',
    venue: 'Estádio do Dragão',
    tacticalGapsNote: 'Falta capacidade de pressão alta no meio-campo e recuperação rápida em transição defensiva quando o adversário sai com bola controlada.',
    recruitmentProfileNote: 'Precisamos de um PL mais móvel, capaz de dar apoios e atacar a profundidade, e um Médio Centro com raio de ação elevado e capacidade de desarme.',
    priorityPositions: ['MDC', 'PL', 'DE'],
    attachments: [
      {
        id: 'att-aud1-1',
        name: 'Relatorio_Auditoria_Braga_Jornada1.pdf',
        size: '3.4 MB',
        type: 'application/pdf',
        uploadedAt: '25/07/2026',
      },
      {
        id: 'att-aud1-2',
        name: 'Analise_Transicoes_Defensivas.mp4',
        size: '18.2 MB',
        type: 'video/mp4',
        uploadedAt: '25/07/2026',
      },
    ],
    positionAudits: [
      {
        positionCode: 'GR',
        positionLabel: 'Guarda-Redes',
        playerNames: 'Diogo Costa',
        rating: 8,
        status: 'solido',
        notes: 'Seguro nas saídas e bom jogo de pés.',
      },
      {
        positionCode: 'DC',
        positionLabel: 'Defesa Central',
        playerNames: 'Pepe & O. Cardoso',
        rating: 7,
        status: 'solido',
        notes: 'Boa leitura antecipativa, mas expostos em transição.',
      },
      {
        positionCode: 'DD',
        positionLabel: 'Lateral Direito',
        playerNames: 'Joao Mario',
        rating: 6,
        status: 'solido',
        notes: 'Ofensivo mas concedeu espaço nas costas.',
      },
      {
        positionCode: 'DE',
        positionLabel: 'Lateral Esquerdo',
        playerNames: 'Wendell',
        rating: 5,
        status: 'abaixo',
        notes: 'Dificuldades nas dobras interiores.',
      },
      {
        positionCode: 'MDC',
        positionLabel: 'Médio Defensivo',
        playerNames: 'Alan Varela',
        rating: 5,
        status: 'reforco',
        notes: 'Falta raio de ação na pressão alta e cobertura lateral.',
      },
      {
        positionCode: 'MC',
        positionLabel: 'Médio Centro',
        playerNames: 'Nico González',
        rating: 6,
        status: 'solido',
        notes: 'Boa qualidade de construção curta.',
      },
      {
        positionCode: 'MO',
        positionLabel: 'Médio Ofensivo',
        playerNames: 'Iván Jaime',
        rating: 7,
        status: 'solido',
        notes: 'Visão de jogo entre linhas.',
      },
      {
        positionCode: 'EE',
        positionLabel: 'Extremo Esquerdo',
        playerNames: 'Galeno',
        rating: 8,
        status: 'destaque',
        notes: 'Decisivo na velocidade no corredor.',
      },
      {
        positionCode: 'ED',
        positionLabel: 'Extremo Direito',
        playerNames: 'Francisco Conceição',
        rating: 7,
        status: 'solido',
        notes: 'Drible 1v1 constante.',
      },
      {
        positionCode: 'PL',
        positionLabel: 'Ponta de Lança',
        playerNames: 'Evanilson',
        rating: 5,
        status: 'reforco',
        notes: 'Isolado entre centrais. Falta apoio móvel para ligação.',
      },
    ],
  },
  {
    id: 'audit-2',
    date: '02 AGO 2026',
    competition: 'Liga Portugal - Jornada 2',
    opponent: 'Vitória SC',
    isHome: false,
    status: 'agendado',
    venue: 'Estádio D. Afonso Henriques',
    tacticalGapsNote: '',
    recruitmentProfileNote: '',
    priorityPositions: ['PL', 'MC'],
    positionAudits: [
      { positionCode: 'GR', positionLabel: 'Guarda-Redes', playerNames: 'Diogo Costa', rating: 7, status: 'solido', notes: '' },
      { positionCode: 'DC', positionLabel: 'Defesa Central', playerNames: 'Plantel Titular', rating: 7, status: 'solido', notes: '' },
      { positionCode: 'MDC', positionLabel: 'Médio Defensivo', playerNames: 'Alan Varela', rating: 6, status: 'abaixo', notes: '' },
      { positionCode: 'PL', positionLabel: 'Ponta de Lança', playerNames: 'Evanilson / Namaso', rating: 5, status: 'reforco', notes: '' },
    ],
  },
];

export const TeamAuditView: React.FC<TeamAuditViewProps> = ({
  squadPlayers,
  onPlayerClick,
  onTriggerToast,
  defaultFormation = '4-2-3-1',
  onFormationChange,
}) => {
  const [mainTab, setMainTab] = useState<'analise' | 'requisitos'>('analise');
  const [formation, setFormation] = useState<FormationName>(defaultFormation);
  const [selectedPosition, setSelectedPosition] = useState<PositionCode>('GR');
  const [activeTab, setActiveTab] = useState<'agendados' | 'concluidos'>('concluidos');
  const [auditMatches, setAuditMatches] = useState<TeamAuditMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [positionalRequirements, setPositionalRequirements] = useState<
    Record<PositionCode, PositionalRequirement>
  >(DEFAULT_POSITIONAL_REQUIREMENTS);

  // Sync state when defaultFormation prop changes externally
  useEffect(() => {
    if (defaultFormation) {
      setFormation(defaultFormation);
    }
  }, [defaultFormation]);

  const handleFormationSelect = (newForm: FormationName) => {
    setFormation(newForm);
    if (onFormationChange) {
      onFormationChange(newForm);
    }
    onTriggerToast(`Formação tática alterada para ${newForm}. Posições dos requisitos atualizadas.`);
  };

  // Derive active positions for current formation
  const activePositionCodes = POSITIONS_BY_FORMATION[formation] || POSITIONS_BY_FORMATION['4-2-3-1'];
  const activePositions = activePositionCodes.map((code) => TACTICAL_POSITIONS_DICT[code]);

  // Ensure selectedPosition is valid for active formation
  useEffect(() => {
    if (!activePositionCodes.includes(selectedPosition)) {
      setSelectedPosition(activePositionCodes[0] || 'GR');
    }
  }, [formation, activePositionCodes, selectedPosition]);

  const handleUpdatePositionalRequirement = (
    positionCode: PositionCode,
    updated: PositionalRequirement
  ) => {
    setPositionalRequirements((prev) => ({
      ...prev,
      [positionCode]: updated,
    }));
  };

  const handleResetPositionalRequirement = (positionCode: PositionCode) => {
    setPositionalRequirements((prev) => ({
      ...prev,
      [positionCode]: DEFAULT_POSITIONAL_REQUIREMENTS[positionCode],
    }));
    const posLabel = TACTICAL_POSITIONS_DICT[positionCode]?.label || positionCode;
    onTriggerToast(
      `Requisitos de ${posLabel} restaurados para os valores predefinidos.`
    );
  };

  // Filter matches by tab
  const scheduledAudits = auditMatches.filter((m) => m.status === 'agendado');
  const completedAudits = auditMatches.filter((m) => m.status === 'concluido');
  const displayedMatches = activeTab === 'agendados' ? scheduledAudits : completedAudits;

  // Selected Match object
  const activeMatch = auditMatches.find((m) => m.id === selectedMatchId) || auditMatches[0];

  // Helper status styling and text
  const getStatusBadge = (status: PositionAuditItem['status']) => {
    switch (status) {
      case 'solido':
        return {
          label: 'Sólido',
          bg: 'bg-[#203a2c]',
          text: 'text-[#81c784]',
          border: 'border-[#2e5d41]',
          icon: 'check_circle',
        };
      case 'abaixo':
        return {
          label: 'Abaixo do Esperado',
          bg: 'bg-[#3e2e14]',
          text: 'text-[#ffb74d]',
          border: 'border-[#6a4f21]',
          icon: 'warning',
        };
      case 'reforco':
        return {
          label: 'Necessita Reforço',
          bg: 'bg-[#401216]',
          text: 'text-[#ff535b]',
          border: 'border-[#7a2228]',
          icon: 'error',
        };
      case 'destaque':
        return {
          label: 'Destaque Positivo',
          bg: 'bg-[#0b4e6e]/40',
          text: 'text-[#8abfe4]',
          border: 'border-[#1b6287]',
          icon: 'stars',
        };
      default:
        return {
          label: 'Sólido',
          bg: 'bg-[#203a2c]',
          text: 'text-[#81c784]',
          border: 'border-[#2e5d41]',
          icon: 'check_circle',
        };
    }
  };

  // Update audit match notes or position item
  const handleUpdateNotes = (field: 'tacticalGapsNote' | 'recruitmentProfileNote', value: string) => {
    setAuditMatches((prev) =>
      prev.map((m) => (m.id === activeMatch.id ? { ...m, [field]: value } : m))
    );
  };

  const handleUpdateMatchReportPdf = (reportPdfUrl?: string, reportPdfName?: string) => {
    setAuditMatches((prev) =>
      prev.map((m) => (m.id === activeMatch.id ? { ...m, reportPdfUrl, reportPdfName } : m))
    );
  };

  const handleUpdatePositionStatus = (
    positionCode: PositionCode,
    newStatus: PositionAuditItem['status']
  ) => {
    setAuditMatches((prev) =>
      prev.map((m) => {
        if (m.id !== activeMatch.id) return m;
        return {
          ...m,
          positionAudits: m.positionAudits.map((item) =>
            item.positionCode === positionCode ? { ...item, status: newStatus } : item
          ),
        };
      })
    );
  };

  const handleUpdatePositionNotes = (positionCode: PositionCode, notes: string) => {
    setAuditMatches((prev) =>
      prev.map((m) => {
        if (m.id !== activeMatch.id) return m;
        return {
          ...m,
          positionAudits: m.positionAudits.map((item) =>
            item.positionCode === positionCode ? { ...item, notes } : item
          ),
        };
      })
    );
  };

  const handleUpdatePositionRating = (positionCode: PositionCode, rating: number) => {
    setAuditMatches((prev) =>
      prev.map((m) => {
        if (m.id !== activeMatch.id) return m;
        return {
          ...m,
          positionAudits: m.positionAudits.map((item) =>
            item.positionCode === positionCode ? { ...item, rating } : item
          ),
        };
      })
    );
  };

  const handleAddAttachments = (files: AttachmentFile[]) => {
    setAuditMatches((prev) =>
      prev.map((m) =>
        m.id === activeMatch.id
          ? { ...m, attachments: [...(m.attachments || []), ...files] }
          : m
      )
    );
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAuditMatches((prev) =>
      prev.map((m) =>
        m.id === activeMatch.id
          ? {
              ...m,
              attachments: (m.attachments || []).filter((a) => a.id !== attachmentId),
            }
          : m
      )
    );
  };

  const handleCreateNewAudit = () => {
    const newId = `audit-${Date.now()}`;
    const newAudit: TeamAuditMatch = {
      id: newId,
      date: 'HOJE',
      competition: 'Liga Portugal',
      opponent: 'Adversário a Definir',
      isHome: true,
      status: 'agendado',
      venue: 'Estádio Principal',
      tacticalGapsNote: '',
      recruitmentProfileNote: '',
      priorityPositions: ['MDC', 'PL'],
      positionAudits: [
        { positionCode: 'GR', positionLabel: 'Guarda-Redes', playerNames: 'Titulares', rating: 7, status: 'solido', notes: '' },
        { positionCode: 'DC', positionLabel: 'Defesa Central', playerNames: 'Titulares', rating: 7, status: 'solido', notes: '' },
        { positionCode: 'MDC', positionLabel: 'Médio Defensivo', playerNames: 'Titulares', rating: 5, status: 'reforco', notes: '' },
        { positionCode: 'PL', positionLabel: 'Ponta de Lança', playerNames: 'Titulares', rating: 5, status: 'reforco', notes: '' },
      ],
    };
    setAuditMatches((prev) => [newAudit, ...prev]);
    setSelectedMatchId(newId);
    onTriggerToast('Nova auditoria de jogo da equipa criada na agenda!');
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 animate-fade-in pb-12">
      {/* Header with Title and Internal Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1c1b1c] p-5 rounded-2xl border border-[#353436]">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#ff535b]/20 border border-[#ff535b]/40 flex items-center justify-center text-[#ff535b] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-2xl">fact_check</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-[#e5e2e3] tracking-tight">
                Auditoria da Equipa & Diagnóstico de Plantel
              </h2>
              <span className="text-[10px] font-bold font-mono-data bg-[#0b4e6e]/50 text-[#8abfe4] px-2.5 py-0.5 rounded-full border border-[#1b6287]">
                USO INTERNO DO SCOUTING
              </span>
            </div>
            <p className="text-xs text-[#e4bebc] mt-1">
              Observação direta da própria equipa em jogo para identificar lacunas do modelo e definir o perfil de recrutamento.
            </p>
          </div>
        </div>

        {mainTab === 'analise' && (
          <button
            onClick={handleCreateNewAudit}
            className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Nova Auditoria</span>
          </button>
        )}
      </div>

      {/* Top Main Navigation Tabs: Análise de Jogos vs Requisitos Posicionais */}
      <div className="flex items-center gap-2 border-b border-[#353436] pb-3">
        <button
          onClick={() => setMainTab('analise')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            mainTab === 'analise'
              ? 'bg-[#ff535b] text-white shadow-md'
              : 'bg-[#1c1b1c] text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#26262B] border border-[#353436]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
          <span>Análise de Jogos</span>
        </button>

        <button
          onClick={() => setMainTab('requisitos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            mainTab === 'requisitos'
              ? 'bg-[#ff535b] text-white shadow-md'
              : 'bg-[#1c1b1c] text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#26262B] border border-[#353436]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
          <span>Requisitos Posicionais</span>
        </button>
      </div>

      {/* TAB 1: ANÁLISE DE JOGOS */}
      {mainTab === 'analise' && (
        <div className="flex flex-col gap-6">
          {/* Navigation Sub-Tabs (Agendados vs Concluídos) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26262B] pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('agendados')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'agendados'
                    ? 'bg-[#2a2a2b] text-[#ff535b] border border-[#ff535b]/30 shadow-sm'
                    : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1c1c1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Agendados</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-mono-data font-bold ${
                    activeTab === 'agendados' ? 'bg-[#ff535b] text-white' : 'bg-[#1c1c1f] text-[#e4bebc]'
                  }`}
                >
                  {scheduledAudits.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('concluidos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'concluidos'
                    ? 'bg-[#2a2a2b] text-[#ff535b] border border-[#ff535b]/30 shadow-sm'
                    : 'text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#1c1c1f]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                <span>Concluídos</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-mono-data font-bold ${
                    activeTab === 'concluidos' ? 'bg-[#ff535b] text-white' : 'bg-[#1c1c1f] text-[#e4bebc]'
                  }`}
                >
                  {completedAudits.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#e4bebc] font-mono-data">
              💡 Selecione uma partida para consultar ou editar o diagnóstico de necessidades
            </div>
          </div>

          {/* Match Selector Strip */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-2">
            {displayedMatches.map((m) => {
              const isSelected = m.id === activeMatch?.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 min-w-[240px] ${
                    isSelected
                      ? 'bg-[#26262B] border-[#ff535b] shadow-md ring-1 ring-[#ff535b]'
                      : 'bg-[#141416] border-[#353436] hover:border-[#5b403f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-[#ffb3b1]">
                    {m.status === 'concluido' ? 'fact_check' : 'event'}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[10px] font-mono-data font-bold text-[#e4bebc]">
                      <span>{m.date}</span>
                      <span className={m.status === 'concluido' ? 'text-[#81c784]' : 'text-[#8abfe4]'}>
                        {m.status === 'concluido' ? 'Concluído' : 'Agendado'}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-[#e5e2e3] truncate mt-0.5">
                      vs {m.opponent} {m.score ? `(${m.score})` : ''}
                    </span>
                    <span className="text-[10px] text-[#e4bebc]/70 truncate">{m.competition}</span>
                  </div>
                </button>
              );
            })}

            {displayedMatches.length === 0 && (
              <div className="text-xs text-[#e4bebc] italic py-2">
                Nenhum jogo nesta categoria. Clique em "+ Nova Auditoria" para agendar.
              </div>
            )}
          </div>

          {/* Active Match Assessment Dashboard */}
          {activeMatch && (
            <div className="flex flex-col gap-6 mt-2">
              {/* Active Game Info Banner */}
              <div className="bg-[#141416] border border-[#353436] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff535b]" />
                <div className="flex flex-col gap-1 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold font-mono-data text-[#ffb3b1] uppercase">
                      {activeMatch.competition}
                    </span>
                    <span className="text-[#353436]">•</span>
                    <span className="text-xs text-[#e4bebc] font-mono-data">{activeMatch.date}</span>
                  </div>
                  <h3 className="text-xl font-black text-[#e5e2e3] flex items-center gap-2">
                    <span>Plantel Principal</span>
                    <span className="text-[#ff535b] text-base font-mono-data">
                      {activeMatch.score || 'vs'}
                    </span>
                    <span>{activeMatch.opponent}</span>
                  </h3>
                  <div className="text-xs text-[#e4bebc] flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-[#8abfe4]">stadium</span>
                    <span>{activeMatch.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      const newStatus = activeMatch.status === 'concluido' ? 'agendado' : 'concluido';
                      setAuditMatches((prev) =>
                        prev.map((m) => (m.id === activeMatch.id ? { ...m, status: newStatus } : m))
                      );
                      onTriggerToast(
                        `Estado do jogo alterado para ${newStatus === 'concluido' ? 'Concluído' : 'Agendado'}.`
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                      activeMatch.status === 'concluido'
                        ? 'bg-[#203a2c] text-[#81c784] border-[#2e5d41]'
                        : 'bg-[#0b4e6e]/40 text-[#8abfe4] border-[#1b6287]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeMatch.status === 'concluido' ? 'check_circle' : 'schedule'}
                    </span>
                    <span>{activeMatch.status === 'concluido' ? 'Auditoria Concluída' : 'Marcar Concluído'}</span>
                  </button>
                </div>
              </div>

              {/* Relatório de Observação da Equipa (PDF) */}
              <ReportPdfSection
                pdfUrl={activeMatch.reportPdfUrl}
                pdfName={activeMatch.reportPdfName}
                onChange={(url, name) => handleUpdateMatchReportPdf(url, name)}
                title="Relatório de Observação da Equipa (PDF)"
              />

              {/* ATTACHMENTS & REPORTS SECTION */}
              <AttachmentsSection
                attachments={activeMatch.attachments || []}
                onAddAttachments={handleAddAttachments}
                onRemoveAttachment={handleRemoveAttachment}
                onTriggerToast={onTriggerToast}
                title="Relatórios & Anexos do Jogo"
              />

              {/* SECTION A: AVALIAÇÃO DE RENDIMENTO POR POSIÇÃO */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#353436] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ff535b]">grid_view</span>
                    <h3 className="font-bold text-base text-[#e5e2e3]">
                      Avaliação de Rendimento por Posição
                    </h3>
                  </div>
                  <span className="text-xs text-[#e4bebc] font-mono-data">
                    Atribua nota e estado (Sólido, Abaixo do Esperado, Necessita Reforço, Destaque)
                  </span>
                </div>

                {/* Position Audits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMatch.positionAudits.map((item) => {
                    const badge = getStatusBadge(item.status);

                    return (
                      <div
                        key={item.positionCode}
                        className="bg-[#141416] border border-[#353436] hover:border-[#5b403f] rounded-2xl p-4 flex flex-col gap-3 transition-all shadow-md"
                      >
                        {/* Top Position & Player Line */}
                        <div className="flex items-center justify-between border-b border-[#26262B] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono-data text-[#ffb3b1] bg-[#1c1b1c] px-2 py-0.5 rounded border border-[#353436]">
                              {item.positionCode}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-[#e5e2e3]">
                                {item.positionLabel}
                              </span>
                              <span className="text-[11px] text-[#e4bebc] font-semibold truncate">
                                {item.playerNames}
                              </span>
                            </div>
                          </div>

                          {/* Interactive 5-Star Rating */}
                          <div className="flex items-center gap-1.5 bg-[#1c1b1c] px-2.5 py-1 rounded-lg border border-[#353436]">
                            <StarRating
                              value={item.rating <= 5 ? item.rating : item.rating / 2}
                              onChange={(val) => handleUpdatePositionRating(item.positionCode, val)}
                              size="xs"
                            />
                          </div>
                        </div>

                        {/* Performance Status Dropdown Selector */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#e4bebc] uppercase tracking-wider">
                            Estado do Setor:
                          </span>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleUpdatePositionStatus(
                                item.positionCode,
                                e.target.value as PositionAuditItem['status']
                              )
                            }
                            className={`text-xs font-bold font-mono-data px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-all ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <option value="solido" className="bg-[#141416] text-[#81c784]">
                              🟢 Sólido
                            </option>
                            <option value="destaque" className="bg-[#141416] text-[#8abfe4]">
                              🔵 Destaque Positivo
                            </option>
                            <option value="abaixo" className="bg-[#141416] text-[#ffb74d]">
                              🟡 Abaixo do Esperado
                            </option>
                            <option value="reforco" className="bg-[#141416] text-[#ff535b]">
                              🔴 Necessita Reforço
                            </option>
                          </select>
                        </div>

                        {/* Section Notes input */}
                        <div className="flex flex-col gap-1 mt-1">
                          <label className="text-[10px] font-bold text-[#e4bebc] uppercase tracking-wider">
                            Observações no Jogo:
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) =>
                              handleUpdatePositionNotes(item.positionCode, e.target.value)
                            }
                            placeholder="Adicionar nota específica do setor/jogador..."
                            className="bg-[#1c1b1c] border border-[#26262B] focus:border-[#ff535b] text-xs text-[#e5e2e3] rounded-lg px-2.5 py-1.5 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUISITOS POSICIONAIS */}
      {mainTab === 'requisitos' && (
        <div className="flex flex-col md:flex-row gap-6 mt-1">
          {/* Secondary Sidebar with Tactical Positions */}
          <div className="w-full md:w-64 shrink-0 bg-[#1c1b1c] border border-[#353436] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            {/* Header & Formation Selector */}
            <div className="flex flex-col gap-2 border-b border-[#353436] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff535b]">tactics</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#e5e2e3]">Posições Táticas</h3>
                  <p className="text-[10px] text-[#e4bebc]">Perfis da Formação Ativa</p>
                </div>
              </div>

              {/* Formation Selector Control */}
              <div className="mt-1 bg-[#141416] border border-[#353436] rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold font-mono-data text-[#8abfe4] uppercase tracking-wider">
                    Formação Tática
                  </span>
                  <span className="text-[10px] font-extrabold font-mono-data bg-[#ff535b]/20 text-[#ffb3b1] px-1.5 py-0.5 rounded border border-[#ff535b]/30">
                    {formation}
                  </span>
                </div>
                <select
                  value={formation}
                  onChange={(e) => handleFormationSelect(e.target.value as FormationName)}
                  className="w-full bg-[#1c1b1c] border border-[#353436] text-[#e5e2e3] px-2 py-1.5 text-xs rounded-lg font-mono-data outline-none focus:border-[#ff535b] cursor-pointer"
                >
                  <option value="4-2-3-1">4-2-3-1 (Laterais DD/DE)</option>
                  <option value="4-3-3">4-3-3 (Laterais DD/DE)</option>
                  <option value="3-5-2">3-5-2 (Alas LDO/LEO)</option>
                  <option value="3-4-3">3-4-3 (Alas LDO/LEO)</option>
                  <option value="4-4-2">4-4-2 (Laterais DD/DE)</option>
                  <option value="4-1-4-1">4-1-4-1 (Laterais DD/DE)</option>
                  <option value="4-4-1-1">4-4-1-1 (Laterais DD/DE)</option>
                  <option value="4-2-2-2">4-2-2-2 (Laterais DD/DE)</option>
                  <option value="4-3-1-2">4-3-1-2 (Laterais DD/DE)</option>
                  <option value="3-4-2-1">3-4-2-1 (Alas LDO/LEO)</option>
                  <option value="5-3-2">5-3-2 (Alas LDO/LEO)</option>
                  <option value="5-4-1">5-4-1 (Alas LDO/LEO)</option>
                </select>
              </div>
            </div>

            {/* List of Positions for Selected Formation */}
            <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-0.5 custom-scrollbar">
              {activePositions.map((pos) => {
                const isSelected = selectedPosition === pos.code;
                return (
                  <button
                    key={pos.code}
                    type="button"
                    onClick={() => setSelectedPosition(pos.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#26262B] border-[#ff535b] text-white shadow-sm ring-1 ring-[#ff535b]'
                        : 'bg-[#141416] border-[#353436] text-[#e4bebc] hover:border-[#5b403f] hover:text-[#e5e2e3]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-xs font-extrabold font-mono-data px-2 py-0.5 rounded border shrink-0 ${
                          isSelected
                            ? 'bg-[#ff535b] text-white border-[#ff535b]'
                            : 'bg-[#1c1b1c] text-[#ffb3b1] border-[#353436]'
                        }`}
                      >
                        {pos.code}
                      </span>
                      <span className="text-xs font-bold truncate">{pos.label}</span>
                    </div>
                    <span className="text-[10px] text-[#e4bebc]/60 font-mono-data uppercase shrink-0 ml-1">
                      {pos.sector}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Screen with Positional Requirements Form */}
          <div className="flex-1 bg-[#1c1b1c] border border-[#353436] rounded-2xl p-6 min-h-[500px] shadow-xl">
            <PositionalRequirementsForm
              positionCode={selectedPosition}
              positionLabel={
                TACTICAL_POSITIONS_DICT[selectedPosition]?.label || selectedPosition
              }
              requirement={
                positionalRequirements[selectedPosition] ||
                DEFAULT_POSITIONAL_REQUIREMENTS[selectedPosition] || {
                  positionCode: selectedPosition,
                  physicalTags: [],
                  tacticalTags: [],
                  technicalTags: [],
                  psychologicalTags: [],
                  boardDirectives: '',
                }
              }
              onChangeRequirement={(updated) =>
                handleUpdatePositionalRequirement(selectedPosition, updated)
              }
              onTriggerToast={onTriggerToast}
              onResetDefault={() => handleResetPositionalRequirement(selectedPosition)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
