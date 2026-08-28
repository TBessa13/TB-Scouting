/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Player, PlayerStatus, ShadowTeam, MatchReport, Contact, CalendarEvent } from '../types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mqlyogacdvlidnfpcpjs.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbHlvZ2FjZHZsaWRuZnBjcGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NTMxNzUsImV4cCI6MjEwMTAyOTE3NX0.1RKKyosNQv1RLxUdBNLNB3bwbuvp7ZTrZ1hxdb6INKY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function mapRowToPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name || row.name,
    age: Number(row.age) || 20,
    birthDate: row.birth_date || undefined,
    heightCm: Number(row.height_cm) || 180,
    nationality: row.nationality || 'Portugal',
    flag: row.flag || '🇵🇹',
    club: row.club || 'Livre',
    league: row.league || 'Liga Portugal',
    contractEnd: row.contract_end || 'Jun 2026',
    agent: row.agent || '',
    dominantFoot: row.dominant_foot || 'Direito',
    position: row.position || 'MC',
    secondaryPositions: Array.isArray(row.secondary_positions) ? row.secondary_positions : [],
    status: (row.status as PlayerStatus) || 'pending',
    priorityRank: row.priority_rank || undefined,
    pipelineStage: (row.pipeline_stage as any) || 'Sinalizado',
    rating: row.rating !== null && row.rating !== undefined && row.rating !== '' ? Number(row.rating) : null,
    tacticalFitPercent: row.tactical_fit_percent !== null && row.tactical_fit_percent !== undefined && row.tactical_fit_percent !== '' ? Number(row.tactical_fit_percent) : null,
    avatarUrl:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    reportPdfUrl: row.report_pdf_url || undefined,
    reportPdfName: row.report_pdf_name || undefined,
    generalNotes: row.general_notes || (typeof row.notes === 'string' ? row.notes : undefined),
    notes: row.notes && typeof row.notes === 'object' ? row.notes : {},
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    wyscoutUrl: row.wyscout_url || undefined,
    transfermarktUrl: row.transfermarkt_url || undefined,
    zerozeroUrl: row.zerozero_url || undefined,
    isContractExpiringSoon: Boolean(row.is_contract_expiring_soon),
    seasonStats: row.season_stats || undefined,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
  };
}

export function mapPlayerToRow(player: Player, isSquad: boolean = false): any {
  return {
    id: player.id,
    name: player.name,
    short_name: player.shortName || player.name,
    age: player.age,
    birth_date: player.birthDate || null,
    height_cm: player.heightCm,
    nationality: player.nationality,
    flag: player.flag,
    club: player.club,
    league: player.league || null,
    contract_end: player.contractEnd,
    agent: player.agent,
    dominant_foot: player.dominantFoot,
    position: player.position,
    secondary_positions: player.secondaryPositions || [],
    status: player.status,
    priority_rank: player.priorityRank || null,
    pipeline_stage: player.pipelineStage || 'Sinalizado',
    rating: player.rating ?? null,
    tactical_fit_percent: player.tacticalFitPercent ?? null,
    avatar_url: player.avatarUrl,
    report_pdf_url: player.reportPdfUrl || null,
    report_pdf_name: player.reportPdfName || null,
    general_notes: player.generalNotes || null,
    notes: player.notes || {},
    timeline: player.timeline || [],
    wyscout_url: player.wyscoutUrl || null,
    transfermarkt_url: player.transfermarktUrl || null,
    zerozero_url: player.zerozeroUrl || null,
    is_contract_expiring_soon: Boolean(player.isContractExpiringSoon),
    season_stats: player.seasonStats || {},
    attachments: player.attachments || [],
    is_squad: isSquad,
  };
}

export async function fetchPlayersFromDb(): Promise<{ globalPlayers: Player[]; squadPlayers: Player[] }> {
  try {
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching players from Supabase:', error);
      return { globalPlayers: [], squadPlayers: [] };
    }

    if (!data || data.length === 0) {
      return { globalPlayers: [], squadPlayers: [] };
    }

    const mapped = data.map(mapRowToPlayer);
    const globalPlayers = data.filter((r) => !r.is_squad).map(mapRowToPlayer);
    const squadPlayers = data.filter((r) => r.is_squad).map(mapRowToPlayer);

    return {
      globalPlayers: globalPlayers.length > 0 ? globalPlayers : mapped,
      squadPlayers: squadPlayers,
    };
  } catch (err) {
    console.error('Exception fetching players from Supabase:', err);
    return { globalPlayers: [], squadPlayers: [] };
  }
}

export async function updatePlayerStatusInDb(playerId: string, newStatus: PlayerStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('players')
      .update({ status: newStatus })
      .eq('id', playerId);

    if (error) {
      console.error('Error updating player status in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating player status:', err);
    return false;
  }
}

export async function updatePlayerPipelineStageInDb(
  playerId: string,
  newStage: 'Sinalizado' | 'Em Análise' | 'Analisado'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('players')
      .update({ pipeline_stage: newStage })
      .eq('id', playerId);

    if (error) {
      console.error('Error updating player pipeline_stage in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating player pipeline_stage:', err);
    return false;
  }
}

export async function saveNewPlayerToDb(player: Player, isSquad: boolean = false): Promise<Player | null> {
  try {
    const row = mapPlayerToRow(player, isSquad);
    const { data, error } = await supabase.from('players').insert([row]).select('*').single();

    if (error) {
      console.error('Error inserting player into Supabase:', error);
      return null;
    }

    return data ? mapRowToPlayer(data) : player;
  } catch (err) {
    console.error('Exception saving new player to Supabase:', err);
    return null;
  }
}

export async function updatePlayerInDb(player: Player): Promise<boolean> {
  try {
    const row = mapPlayerToRow(player);
    const { error } = await supabase.from('players').update(row).eq('id', player.id);

    if (error) {
      console.error('Error updating player in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating player in Supabase:', err);
    return false;
  }
}

export async function fetchShadowTeamsFromDb(): Promise<ShadowTeam[]> {
  try {
    const { data: teamsData, error: teamsError } = await supabase.from('shadow_teams').select('*');
    if (teamsError || !teamsData) {
      console.error('Error fetching shadow teams:', teamsError);
      return [];
    }

    const { data: teamPlayersData, error: tpError } = await supabase.from('shadow_team_players').select('*');
    if (tpError) {
      console.error('Error fetching shadow_team_players:', tpError);
    }

    const { globalPlayers } = await fetchPlayersFromDb();
    const playerMap = new Map<string, Player>(globalPlayers.map((p) => [p.id, p]));

    return teamsData.map((t) => {
      const pIds = (teamPlayersData || []).filter((tp) => tp.team_id === t.id).map((tp) => tp.player_id);
      const teamPlayers = pIds.map((id) => playerMap.get(id)).filter((p): p is Player => p !== undefined);

      return {
        id: t.id,
        name: t.name,
        players: teamPlayers,
      };
    });
  } catch (err) {
    console.error('Exception fetching shadow teams:', err);
    return [];
  }
}

export async function addPlayerToShadowTeamInDb(teamId: string, playerId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shadow_team_players')
      .upsert({ team_id: teamId, player_id: playerId }, { onConflict: 'team_id,player_id' });
    return !error;
  } catch (err) {
    console.error('Error adding player to shadow team:', err);
    return false;
  }
}

export async function removePlayerFromShadowTeamInDb(teamId: string, playerId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shadow_team_players')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId);
    return !error;
  } catch (err) {
    console.error('Error removing player from shadow team:', err);
    return false;
  }
}

export async function createShadowTeamInDb(id: string, name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('shadow_teams').insert([{ id, name }]);
    return !error;
  } catch (err) {
    console.error('Error creating shadow team in Supabase:', err);
    return false;
  }
}

// Matches
export async function fetchMatchesFromDb(): Promise<MatchReport[]> {
  try {
    const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((m) => ({
      id: m.id,
      date: m.date || '',
      competition: m.competition || '',
      homeTeam: m.home_team || '',
      awayTeam: m.away_team || '',
      score: m.score || undefined,
      status: m.status || 'agendado',
      targetPlayerIds: Array.isArray(m.target_player_ids) ? m.target_player_ids : [],
      assignedScout: m.assigned_scout || '',
      venue: m.venue || '',
      reportPdfUrl: m.report_pdf_url || undefined,
      reportPdfName: m.report_pdf_name || undefined,
      attachments: Array.isArray(m.attachments) ? m.attachments : [],
      notes: m.notes || undefined,
      timelineNotes: Array.isArray(m.timeline_notes) ? m.timeline_notes : [],
      elapsedSeconds: m.elapsed_seconds || 0,
    }));
  } catch (err) {
    console.error('Error fetching matches from Supabase:', err);
    return [];
  }
}

export async function saveMatchToDb(match: MatchReport): Promise<boolean> {
  try {
    const row = {
      id: match.id,
      date: match.date,
      competition: match.competition,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      score: match.score || null,
      status: match.status,
      target_player_ids: match.targetPlayerIds || [],
      assigned_scout: match.assignedScout,
      venue: match.venue,
      report_pdf_url: match.reportPdfUrl || null,
      report_pdf_name: match.reportPdfName || null,
      attachments: match.attachments || [],
      notes: match.notes || null,
      timeline_notes: match.timelineNotes || [],
      elapsed_seconds: match.elapsedSeconds || 0,
    };
    const { error } = await supabase.from('matches').upsert(row);
    return !error;
  } catch (err) {
    console.error('Error saving match to Supabase:', err);
    return false;
  }
}

// Contacts
export async function fetchContactsFromDb(): Promise<Contact[]> {
  try {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      contactType: c.contact_type || 'Agente',
      role: c.role || '',
      organization: c.organization || '',
      email: c.email || '',
      phone: c.phone || '',
      country: c.country || undefined,
      avatarUrl: c.avatar_url || undefined,
      notes: c.notes || undefined,
      tags: Array.isArray(c.tags) ? c.tags : [],
      representedPlayerIds: Array.isArray(c.represented_player_ids) ? c.represented_player_ids : [],
      lastContact: c.last_contact || undefined,
    }));
  } catch (err) {
    console.error('Error fetching contacts from Supabase:', err);
    return [];
  }
}

export async function saveContactToDb(contact: Contact): Promise<boolean> {
  try {
    const row = {
      id: contact.id,
      name: contact.name,
      contact_type: contact.contactType,
      role: contact.role,
      organization: contact.organization,
      email: contact.email,
      phone: contact.phone,
      country: contact.country || null,
      avatar_url: contact.avatarUrl || null,
      notes: contact.notes || null,
      tags: contact.tags || [],
      represented_player_ids: contact.representedPlayerIds || [],
      last_contact: contact.lastContact || null,
    };
    const { error } = await supabase.from('contacts').upsert(row);
    return !error;
  } catch (err) {
    console.error('Error saving contact to Supabase:', err);
    return false;
  }
}

export async function deleteContactFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('Error deleting contact:', err);
    return false;
  }
}

// Calendar Events
export async function fetchCalendarEventsFromDb(): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase.from('calendar_events').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date || '',
      time: e.time || '',
      location: e.location || '',
      type: e.type || 'observacao_ao_vivo',
      notes: e.notes || undefined,
      linkedPlayerId: e.linked_player_id || undefined,
    }));
  } catch (err) {
    console.error('Error fetching calendar events from Supabase:', err);
    return [];
  }
}

export async function saveCalendarEventToDb(event: CalendarEvent): Promise<boolean> {
  try {
    const row = {
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      type: event.type,
      notes: event.notes || null,
      linked_player_id: event.linkedPlayerId || null,
    };
    const { error } = await supabase.from('calendar_events').upsert(row);
    return !error;
  } catch (err) {
    console.error('Error saving calendar event:', err);
    return false;
  }
}

export async function deleteCalendarEventFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    return false;
  }
}
