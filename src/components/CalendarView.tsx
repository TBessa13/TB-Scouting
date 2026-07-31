import React, { useState, useMemo, useEffect } from 'react';
import { Player, CalendarEvent, CalendarEventType } from '../types';
import { fetchCalendarEventsFromDb, saveCalendarEventToDb, deleteCalendarEventFromDb } from '../lib/supabase';
import { Avatar } from './Avatar';

interface CalendarViewProps {
  allPlayers: Player[];
  onPlayerClick: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
}

const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; colorBg: string; colorText: string; colorBorder: string; icon: string }
> = {
  observacao_ao_vivo: {
    label: 'Observação ao Vivo',
    colorBg: 'bg-[#ff535b]/20',
    colorText: 'text-[#ffb3b1]',
    colorBorder: 'border-[#ff535b]/50',
    icon: 'visibility',
  },
  reuniao_direcao: {
    label: 'Reunião de Direção',
    colorBg: 'bg-[#0b4e6e]/40',
    colorText: 'text-[#8abfe4]',
    colorBorder: 'border-[#0b4e6e]',
    icon: 'groups',
  },
  jogo_equipa: {
    label: 'Jogo da Equipa',
    colorBg: 'bg-[#353436]/60',
    colorText: 'text-[#e5e2e3]',
    colorBorder: 'border-[#5b403f]/50',
    icon: 'sports_soccer',
  },
  prazo_mercado: {
    label: 'Prazos de Mercado',
    colorBg: 'bg-[#1b4332]/60',
    colorText: 'text-[#74c69d]',
    colorBorder: 'border-[#2d6a4f]',
    icon: 'timer',
  },
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  allPlayers,
  onPlayerClick,
  onTriggerToast,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<CalendarEventType | 'all'>('all');

  useEffect(() => {
    async function loadEvents() {
      const dbEvents = await fetchCalendarEventsFromDb();
      setEvents(dbEvents);
    }
    loadEvents();
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Modal Form Inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('15:00');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<CalendarEventType>('observacao_ao_vivo');
  const [formNotes, setFormNotes] = useState('');
  const [formLinkedPlayerId, setFormLinkedPlayerId] = useState<string>('');

  // Drag and drop state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Month & Year Display
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 6, 27));
  };

  // Open Modal for New Event
  const handleOpenNewEvent = (presetDateStr?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    const dStr =
      presetDateStr ||
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
        currentDate.getDate()
      ).padStart(2, '0')}`;
    setFormDate(dStr);
    setFormTime('15:00');
    setFormLocation('');
    setFormType('observacao_ao_vivo');
    setFormNotes('');
    setFormLinkedPlayerId('');
    setIsModalOpen(true);
  };

  // Open Modal for Editing Event
  const handleOpenEditEvent = (evt: CalendarEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormTime(evt.time);
    setFormLocation(evt.location);
    setFormType(evt.type);
    setFormNotes(evt.notes || '');
    setFormLinkedPlayerId(evt.linkedPlayerId || '');
    setIsModalOpen(true);
  };

  // Save Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    if (editingEvent) {
      // Edit
      const updatedEvt: CalendarEvent = {
        ...editingEvent,
        title: formTitle,
        date: formDate,
        time: formTime,
        location: formLocation,
        type: formType,
        notes: formNotes,
        linkedPlayerId: formLinkedPlayerId || undefined,
      };
      saveCalendarEventToDb(updatedEvt);
      setEvents((prev) =>
        prev.map((item) => (item.id === editingEvent.id ? updatedEvt : item))
      );
      onTriggerToast(`Evento "${formTitle}" atualizado com sucesso.`);
    } else {
      // Create
      const newEvt: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle,
        date: formDate,
        time: formTime,
        location: formLocation,
        type: formType,
        notes: formNotes,
        linkedPlayerId: formLinkedPlayerId || undefined,
      };
      saveCalendarEventToDb(newEvt);
      setEvents((prev) => [...prev, newEvt]);
      onTriggerToast(`Novo evento "${formTitle}" agendado no calendário.`);
    }

    setIsModalOpen(false);
  };

  // Delete Event
  const handleDeleteEvent = () => {
    if (!editingEvent) return;
    deleteCalendarEventFromDb(editingEvent.id);
    setEvents((prev) => prev.filter((item) => item.id !== editingEvent.id));
    onTriggerToast(`Evento "${editingEvent.title}" removido.`);
    setIsModalOpen(false);
  };

  // HTML5 Drag and drop handler
  const handleDragStart = (evtId: string, e: React.DragEvent) => {
    setDraggedEventId(evtId);
    e.dataTransfer.setData('text/plain', evtId);
  };

  const handleDropOnDate = (targetDateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEventId) return;

    setEvents((prev) =>
      prev.map((item) =>
        item.id === draggedEventId ? { ...item, date: targetDateStr } : item
      )
    );

    const targetEvt = events.find((e) => e.id === draggedEventId);
    if (targetEvt) {
      onTriggerToast(`Evento "${targetEvt.title}" reagendado para ${targetDateStr}.`);
    }
    setDraggedEventId(null);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  // Calendar Grid Calculation (Month View)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as starting day of week (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] =
      [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      days.push({ dateStr, dayNum, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr || dateStr === '2026-07-27',
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(
        i
      ).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Week Days calculation (Week View)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    let day = startOfWeek.getDay() - 1;
    if (day === -1) day = 6;
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      result.push({
        dateStr,
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()].substring(0, 3),
        dayName: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i],
        isToday: dateStr === '2026-07-27',
      });
    }
    return result;
  }, [currentDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#141416] p-6 rounded-2xl border border-[#26262B] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shadow-[0_0_15px_rgba(255,83,91,0.25)]">
            <span className="material-symbols-outlined text-[#ff535b] text-[24px]">
              calendar_month
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#e5e2e3]">
              Calendário & Agenda
            </h1>
            <p className="text-xs text-[#e4bebc] mt-0.5">
              Planeamento de jogos, missões de observação e compromissos do departamento
            </p>
          </div>
        </div>

        {/* Header Right: Navigation & New Event Button */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Month/Year Title & Arrows */}
          <div className="flex items-center gap-2 bg-[#0e0e0f] border border-[#26262B] p-1.5 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#1C1C1F] transition-colors cursor-pointer"
              title="Anterior"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <span className="font-mono-data font-bold text-sm text-[#e5e2e3] px-3 min-w-[130px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#1C1C1F] transition-colors cursor-pointer"
              title="Seguinte"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-[#ffb3b1] bg-[#ff535b]/20 hover:bg-[#ff535b]/30 rounded-lg border border-[#ff535b]/40 transition-colors cursor-pointer ml-1"
            >
              Hoje
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0e0e0f] border border-[#26262B] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] shadow-sm'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] shadow-sm'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#1C1C1F] text-[#e5e2e3] border border-[#353436] shadow-sm'
                  : 'text-[#e4bebc] hover:text-[#e5e2e3]'
              }`}
            >
              Dia
            </button>
          </div>

          {/* New Event Button */}
          <button
            onClick={() => handleOpenNewEvent()}
            className="bg-[#ff535b] hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* 2. EVENT TYPE FILTER BAR */}
      <div className="bg-[#141416] border border-[#26262B] p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono-data font-bold uppercase text-[#e4bebc] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">filter_alt</span>
          <span>Filtrar por Tipo:</span>
        </span>

        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'all'
              ? 'bg-[#1C1C1F] text-[#e5e2e3] border-[#ff535b]'
              : 'bg-[#0e0e0f] text-[#e4bebc] border-[#353436] hover:border-[#ff535b]/50'
          }`}
        >
          Todos os Eventos ({events.length})
        </button>

        {(Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[]).map((typeKey) => {
          const cfg = EVENT_TYPE_CONFIG[typeKey];
          const count = events.filter((e) => e.type === typeKey).length;
          const isSelected = filterType === typeKey;

          return (
            <button
              key={typeKey}
              onClick={() => setFilterType(typeKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                cfg.colorBg
              } ${cfg.colorText} ${
                isSelected ? 'border-[#ff535b] ring-1 ring-[#ff535b]' : cfg.colorBorder
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="bg-black/40 px-1.5 py-0.2 rounded-full text-[10px] font-mono-data">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. CALENDAR CONTENT VIEWS */}
      {viewMode === 'month' && (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl overflow-hidden shadow-2xl">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 bg-[#0e0e0f] border-b border-[#26262B] text-center text-[11px] font-mono-data uppercase font-bold text-[#e4bebc]">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(
              (dayName) => (
                <div key={dayName} className="py-3 border-r border-[#26262B] last:border-r-0">
                  {dayName}
                </div>
              )
            )}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#26262B]">
            {calendarDays.map((cell, idx) => {
              const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr);

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(cell.dateStr, e)}
                  onClick={() => handleOpenNewEvent(cell.dateStr)}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                    cell.isCurrentMonth
                      ? 'bg-[#141416] hover:bg-[#1C1C1F]/60'
                      : 'bg-[#0A0A0B]/60 text-stone-600'
                  }`}
                >
                  {/* Top Bar inside day cell */}
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-mono-data font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-[#ff535b] text-white shadow-[0_0_10px_rgba(255,83,91,0.5)]'
                          : cell.isCurrentMonth
                          ? 'text-[#e5e2e3]'
                          : 'text-[#5b403f]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Hover '+' button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNewEvent(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-[#26262B] hover:bg-[#ff535b] text-white text-[12px] transition-all"
                      title="Adicionar evento"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>

                  {/* Event List Pills inside cell */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[110px] pr-0.5">
                    {dayEvents.map((evt) => {
                      const cfg = EVENT_TYPE_CONFIG[evt.type];
                      const linkedPlayer = allPlayers.find((p) => p.id === evt.linkedPlayerId);

                      return (
                        <div
                          key={evt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(evt.id, e)}
                          onClick={(e) => handleOpenEditEvent(evt, e)}
                          className={`p-1.5 rounded-lg border ${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText} hover:brightness-125 transition-all cursor-grab active:cursor-grabbing text-left shadow-sm`}
                        >
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <span className="text-[10px] font-mono-data font-bold opacity-80">
                              {evt.time}
                            </span>
                            <span className="material-symbols-outlined text-[12px]">
                              {cfg.icon}
                            </span>
                          </div>

                          <div className="text-[11px] font-bold truncate mt-0.5" title={evt.title}>
                            {evt.title}
                          </div>

                          {/* Linked Player preview badge */}
                          {linkedPlayer && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayerClick(linkedPlayer);
                              }}
                              className="mt-1 flex items-center gap-1 bg-black/40 hover:bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-[#e5e2e3] font-semibold border border-white/10"
                              title={`Ver perfil de ${linkedPlayer.name}`}
                            >
                              <Avatar
                                name={linkedPlayer.name}
                                className="w-3.5 h-3.5 text-[7px] shrink-0"
                              />
                              <span className="truncate max-w-[80px]">{linkedPlayer.shortName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-7 bg-[#0e0e0f] border-b border-[#26262B]">
            {weekDays.map((wd) => (
              <div
                key={wd.dateStr}
                className={`p-3 text-center border-r border-[#26262B] last:border-r-0 ${
                  wd.isToday ? 'bg-[#ff535b]/10' : ''
                }`}
              >
                <div className="text-[11px] font-mono-data font-bold text-[#e4bebc]">
                  {wd.dayName}
                </div>
                <div
                  className={`text-lg font-extrabold mt-0.5 ${
                    wd.isToday ? 'text-[#ff535b]' : 'text-[#e5e2e3]'
                  }`}
                >
                  {wd.dayNum} {wd.monthName}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 min-h-[450px] divide-x divide-[#26262B]">
            {weekDays.map((wd) => {
              const dayEvents = filteredEvents.filter((e) => e.date === wd.dateStr);

              return (
                <div
                  key={wd.dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(wd.dateStr, e)}
                  onClick={() => handleOpenNewEvent(wd.dateStr)}
                  className="p-2 space-y-2 hover:bg-[#1C1C1F]/40 transition-colors cursor-pointer"
                >
                  {dayEvents.length === 0 ? (
                    <div className="text-[10px] text-stone-600 text-center pt-8">
                      Sem eventos
                    </div>
                  ) : (
                    dayEvents.map((evt) => {
                      const cfg = EVENT_TYPE_CONFIG[evt.type];
                      const linkedPlayer = allPlayers.find((p) => p.id === evt.linkedPlayerId);

                      return (
                        <div
                          key={evt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(evt.id, e)}
                          onClick={(e) => handleOpenEditEvent(evt, e)}
                          className={`p-2 rounded-xl border ${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText} hover:brightness-125 transition-all cursor-grab shadow`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono-data font-bold">
                            <span>{evt.time}</span>
                            <span className="material-symbols-outlined text-[14px]">
                              {cfg.icon}
                            </span>
                          </div>
                          <div className="text-xs font-bold mt-1">{evt.title}</div>
                          {evt.location && (
                            <div className="text-[10px] text-[#e4bebc] flex items-center gap-1 mt-1 truncate">
                              <span className="material-symbols-outlined text-[12px]">
                                location_on
                              </span>
                              <span>{evt.location}</span>
                            </div>
                          )}
                          {linkedPlayer && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayerClick(linkedPlayer);
                              }}
                              className="mt-2 flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/10 hover:bg-black"
                            >
                              <Avatar
                                name={linkedPlayer.name}
                                className="w-4 h-4 text-[8px] shrink-0"
                              />
                              <span className="text-[10px] font-bold text-white truncate">
                                {linkedPlayer.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#26262B]">
            <div>
              <h3 className="text-lg font-extrabold text-[#e5e2e3]">
                Agenda do Dia ({currentDate.getDate()} de {monthNames[currentMonth]} {currentYear})
              </h3>
              <p className="text-xs text-[#e4bebc]">
                Lista detalhada de compromissos para o dia selecionado
              </p>
            </div>
            <button
              onClick={() =>
                handleOpenNewEvent(
                  `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                    currentDate.getDate()
                  ).padStart(2, '0')}`
                )
              }
              className="bg-[#ff535b] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Novo Evento Hoje</span>
            </button>
          </div>

          {(() => {
            const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              currentDate.getDate()
            ).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter((e) => e.date === todayStr);

            if (dayEvents.length === 0) {
              return (
                <div className="p-12 text-center text-[#e4bebc] space-y-2">
                  <span className="material-symbols-outlined text-4xl text-[#353436]">
                    event_busy
                  </span>
                  <div className="font-bold text-sm">Sem compromissos agendados para este dia.</div>
                  <p className="text-xs text-[#e4bebc]/70">
                    Clique no botão acima para adicionar um novo evento.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayEvents.map((evt) => {
                  const cfg = EVENT_TYPE_CONFIG[evt.type];
                  const linkedPlayer = allPlayers.find((p) => p.id === evt.linkedPlayerId);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditEvent(evt)}
                      className={`p-4 rounded-xl border ${cfg.colorBg} ${cfg.colorBorder} hover:brightness-110 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0">
                          <span className={`material-symbols-outlined ${cfg.colorText}`}>
                            {cfg.icon}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data font-bold text-xs text-[#ffb3b1] bg-black/50 px-2 py-0.5 rounded">
                              {evt.time}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-mono-data font-bold px-2 py-0.5 rounded border ${cfg.colorBg} ${cfg.colorText} ${cfg.colorBorder}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-[#e5e2e3] mt-1">
                            {evt.title}
                          </h4>

                          {evt.location && (
                            <div className="flex items-center gap-1 text-xs text-[#e4bebc] mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">
                                location_on
                              </span>
                              <span>{evt.location}</span>
                            </div>
                          )}

                          {evt.notes && (
                            <p className="text-xs text-[#e4bebc]/80 mt-1 italic">
                              "{evt.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Linked Player Info */}
                      {linkedPlayer && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayerClick(linkedPlayer);
                          }}
                          className="flex items-center gap-2 bg-black/60 hover:bg-black border border-white/10 p-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          <Avatar
                            name={linkedPlayer.name}
                            className="w-9 h-9 text-xs border border-[#ff535b]/60 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] text-[#ffb3b1] font-mono-data font-bold block uppercase">
                              Atleta Vinculado
                            </span>
                            <span className="text-xs font-bold text-white block">
                              {linkedPlayer.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. MODAL FOR NEW / EDIT EVENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-[#353436] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff535b] text-[22px]">
                  event
                </span>
                <h3 className="text-xl font-extrabold text-[#e5e2e3]">
                  {editingEvent ? 'Editar Compromisso' : 'Agendar Novo Evento'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#e4bebc] hover:text-white hover:bg-[#26262B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Event Title */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ex: Observação ao Vivo: Sporting vs Braga"
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 outline-none font-medium"
                />
              </div>

              {/* Event Type Selector */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1.5">
                  Tipo de Evento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[]).map((typeKey) => {
                    const cfg = EVENT_TYPE_CONFIG[typeKey];
                    const isSelected = formType === typeKey;

                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => setFormType(typeKey)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          cfg.colorBg
                        } ${cfg.colorText} ${
                          isSelected
                            ? 'border-[#ff535b] ring-2 ring-[#ff535b]/60 font-bold'
                            : 'border-[#26262B] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {cfg.icon}
                        </span>
                        <span className="text-[11px] truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                  />
                </div>

                <div>
                  <label className="text-[#e4bebc] font-bold block mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2 outline-none font-mono-data"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">Localização</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="ex: Estádio José Alvalade, Sala de Reuniões..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 outline-none font-medium"
                />
              </div>

              {/* Link Player */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Vincular Atleta (Opcional)
                </label>
                <select
                  value={formLinkedPlayerId}
                  onChange={(e) => setFormLinkedPlayerId(e.target.value)}
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                >
                  <option value="">Nenhum atleta vinculado</option>
                  {allPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position} - {player.club} {player.league ? `(${player.league})` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[#e4bebc] font-bold block mb-1">
                  Notas Adicionais
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observações táticas ou pontos de discussão..."
                  className="w-full bg-[#0e0e0f] border border-[#353436] focus:border-[#ff535b] text-[#e5e2e3] rounded-xl p-3 outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#26262B] flex justify-between items-center">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#26262B] text-[#e5e2e3] rounded-xl border border-[#353436] font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#ff535b] hover:brightness-110 text-white rounded-xl font-bold transition-all shadow cursor-pointer active:scale-95"
                  >
                    {editingEvent ? 'Guardar Alterações' : 'Criar Evento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
