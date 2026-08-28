export type RatingSystem = '5' | '10' | '20' | '100';

export const getDisplayRating = (rating?: number | null, _ratingSystem?: RatingSystem): number | string => {
  if (rating == null || rating === 0) return '-';
  const num = rating <= 5 ? rating : rating / 4;
  return Math.min(5, Math.max(1, Math.round(num)));
};

export const getCategoryDisplayRating = (
  baseVal20: number | undefined,
  defaultBaseVal20: number,
  _system?: RatingSystem
): number => {
  const base = baseVal20 !== undefined ? baseVal20 : defaultBaseVal20;
  const num = base <= 5 ? base : base / 4;
  return Math.min(5, Math.max(1, Math.round(num)));
};

export const convertCategoryInputToBase20 = (inputVal: number, _system?: RatingSystem): number => {
  const val = Math.min(5, Math.max(1, Math.round(inputVal)));
  return val * 4;
};

export const getSystemMaxVal = (_system?: RatingSystem): number => 5;

export type PlayerStatus = 'pending' | 'hire' | 'track' | 'squad' | 'discard';

export type PositionCode = 
  | 'GR' | 'DC' | 'DD' | 'DE' | 'LDO' | 'LEO'
  | 'MDC' | 'MC' | 'MO' 
  | 'EE' | 'ED' | 'PL';

export interface PositionalRequirement {
  positionCode: PositionCode;
  physicalTags: string[];
  tacticalTags: string[];
  technicalTags: string[];
  psychologicalTags: string[];
  boardDirectives: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  scout: string;
  rating?: number;
}

export interface NoteEntry {
  id: string;
  date: string;
  text: string;
}

export interface ObservationNotes {
  tecnica?: string;
  tatica?: string;
  fisica?: string;
  psicologica?: string;
  tecnicaRating?: number;     // base 1-20 scale
  taticaRating?: number;      // base 1-20 scale
  fisicaRating?: number;      // base 1-20 scale
  psicologicaRating?: number; // base 1-20 scale
  history?: NoteEntry[];
}

export interface SeasonStats {
  matchesPlayed: number;
  starts: number;
  minutesPlayed: number;
}

export function calculateAge(birthDate?: string, fallbackAge: number = 24): number {
  if (!birthDate) return fallbackAge;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return fallbackAge;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getPlayerAge(player: { birthDate?: string; age?: number }): number {
  return calculateAge(player.birthDate, player.age ?? 24);
}

export type PriorityRank = 'Alvo Prioritário' | 'Alvo Secundário' | 'Oportunidade de Mercado';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  age: number;
  birthDate?: string;
  heightCm: number;
  nationality: string;
  flag: string;
  club: string;
  league?: string;
  contractEnd: string;
  agent: string;
  dominantFoot: 'Direito' | 'Esquerdo' | 'Ambidestro';
  position: PositionCode;
  secondaryPositions?: PositionCode[];
  status: PlayerStatus;
  priorityRank?: PriorityRank;
  pipelineStage?: 'Sinalizado' | 'Em Análise' | 'Analisado';
  rating?: number | null; // 1 to 5 (or null if unevaluated)
  tacticalFitPercent?: number | null; // 0 to 100 (or null if unevaluated)
  avatarUrl: string;
  reportPdfUrl?: string; // Link direto cloud ou arquivo PDF anexado
  reportPdfName?: string; // Nome do ficheiro PDF
  notes?: ObservationNotes;
  timeline: TimelineEvent[];
  wyscoutUrl?: string;
  transfermarktUrl?: string;
  zerozeroUrl?: string;
  isContractExpiringSoon?: boolean;
  seasonStats?: SeasonStats;
  attachments?: AttachmentFile[];
}

export interface ShadowTeam {
  id: string;
  name: string;
  players: Player[];
}

export type MainView = 'overview' | 'squad' | 'dashboard' | 'shadowTeams' | 'teamAudit' | 'shortlists' | 'wizard' | 'matches' | 'agents' | 'calendar' | 'contacts' | 'settings';

export type CalendarEventType = 'observacao_ao_vivo' | 'reuniao_direcao' | 'jogo_equipa' | 'prazo_mercado';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  time: string; // HH:mm format
  location: string;
  type: CalendarEventType;
  notes?: string;
  linkedPlayerId?: string;
}

export type ContactType = 'Agente' | 'Diretor Desportivo' | 'Scout' | 'Treinador' | 'Intermediário' | 'Outro';

export interface Contact {
  id: string;
  name: string;
  contactType: ContactType;
  role: string; // e.g. 'Agente FIFA / CEO', 'Diretor Desportivo', 'Treinador Principal'
  organization: string; // e.g. 'Gestifute', 'Sporting CP'
  email: string;
  phone: string;
  country?: string;
  avatarUrl?: string;
  notes?: string;
  tags?: string[]; // e.g. ['#MercadoInterno', '#Internacional']
  representedPlayerIds?: string[]; // Player IDs represented by this contact if Agent
  lastContact?: string; // CRM Last Contact details (e.g., '28/07 - Abordagem inicial')
}

export type DashboardSubView = 'list' | 'kanban' | 'tactical';

export type FormationName =
  | '4-2-3-1'
  | '4-3-3'
  | '4-4-2'
  | '4-1-4-1'
  | '4-4-1-1'
  | '4-2-2-2'
  | '4-3-1-2'
  | '3-5-2'
  | '3-4-3'
  | '3-4-2-1'
  | '5-3-2'
  | '5-4-1';

export interface TacticalSlot {
  slotId: string;
  positionCode: PositionCode;
  label: string;
  row: number; // 1 (Attack) to 4 (Defense)
  col: number; // 1 to 5
  assignedPlayerId?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uploadedAt: string;
}

export interface MatchNoteEntry {
  id: string;
  minute: string; // e.g., "14'", "45+2'"
  text: string;
  category: 'geral' | 'tatica' | 'tecnica' | 'golo' | 'cartao' | 'destaque';
  targetPlayerName?: string;
  timestamp: string; // e.g., "14:32"
}

export interface MatchReport {
  id: string;
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  status: 'agendado' | 'em_analise' | 'concluido';
  targetPlayerIds: string[];
  assignedScout: string;
  venue: string;
  reportPdfUrl?: string;
  reportPdfName?: string;
  attachments?: AttachmentFile[];
  notes?: string;
  timelineNotes?: MatchNoteEntry[];
  elapsedSeconds?: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  agency: string;
  email: string;
  phone: string;
  country: string;
  representedPlayerIds: string[];
}
