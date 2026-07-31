import React, { useState, useEffect, useRef } from 'react';
import { MatchReport, MatchNoteEntry, Player } from '../types';
import { Avatar } from './Avatar';

interface StadiumModeViewProps {
  match: MatchReport;
  targetPlayers: Player[];
  onClose: () => void;
  onUpdateMatchNotes: (matchId: string, updatedNotes: MatchNoteEntry[], elapsedSeconds: number) => void;
  onUpdateMatchStatus: (matchId: string, status: MatchReport['status']) => void;
  onTriggerToast: (msg: string) => void;
}

export const StadiumModeView: React.FC<StadiumModeViewProps> = ({
  match,
  targetPlayers = [],
  onClose,
  onUpdateMatchNotes,
  onUpdateMatchStatus,
  onTriggerToast,
}) => {
  // Timer State
  const [seconds, setSeconds] = useState<number>(match.elapsedSeconds || 0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Timeline Notes State
  const [notes, setNotes] = useState<MatchNoteEntry[]>(match.timelineNotes || []);

  // Form State
  const [noteText, setNoteText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MatchNoteEntry['category']>('geral');
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<string>(
    targetPlayers.length > 0 ? targetPlayers[0].name : ''
  );

  // Voice Dictation State
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of timeline when notes change
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  // Timer Interval Effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // ESC key listener to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sync back notes and seconds to parent component
  const syncParent = (newNotes: MatchNoteEntry[], newSecs: number) => {
    onUpdateMatchNotes(match.id, newNotes, newSecs);
  };

  // Helper to format MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
  };

  // Helper to format Match Minute (e.g. 14', 45+2')
  const getMatchMinute = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    if (mins === 45) {
      const extra = totalSecs % 60;
      if (extra > 0) return `45'`;
    }
    if (mins > 45 && mins < 48 && totalSecs < 2880) {
      // 1st half extra time
      return `45+${mins - 45}'`;
    }
    if (mins > 90) {
      return `90+${mins - 90}'`;
    }
    return `${mins}'`;
  };

  // Timer Controls
  const handleStart = () => {
    setIsRunning(true);
    onTriggerToast('Cronómetro de jogo iniciado!');
  };

  const handlePause = () => {
    setIsRunning(false);
    onTriggerToast('Cronómetro em pausa (Intervalo / Paragem).');
  };

  const handleEndMatch = () => {
    setIsRunning(false);
    onUpdateMatchStatus(match.id, 'concluido');
    syncParent(notes, seconds);
    onTriggerToast('Partida encerrada! Relatório marcado como Concluído.');
  };

  const handleSetPreset = (presetSeconds: number, label: string) => {
    setSeconds(presetSeconds);
    syncParent(notes, presetSeconds);
    onTriggerToast(`Cronómetro ajustado para ${label}.`);
  };

  const handleAddMinutes = (minsToAdd: number) => {
    const updated = Math.max(0, seconds + minsToAdd * 60);
    setSeconds(updated);
    syncParent(notes, updated);
  };

  // Add Note Handler
  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) return;

    const newEntry: MatchNoteEntry = {
      id: `note-${Date.now()}`,
      minute: getMatchMinute(seconds),
      text: noteText.trim(),
      category: selectedCategory,
      targetPlayerName: selectedTargetPlayer || undefined,
      timestamp: formatTime(seconds),
    };

    const updatedNotes = [...notes, newEntry];
    setNotes(updatedNotes);
    syncParent(updatedNotes, seconds);
    setNoteText('');
    onTriggerToast(`Nota carimbada aos ${newEntry.minute}!`);
  };

  // Remove Note Handler
  const handleRemoveNote = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    syncParent(updatedNotes, seconds);
    onTriggerToast('Nota removida da timeline.');
  };

  // Web Speech API Voice Dictation
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      onTriggerToast('Ditado áudio parado.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onTriggerToast('O seu navegador não suporta ditado de voz automático. Digite a nota no campo abaixo.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-PT';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        onTriggerToast('🎙️ Ditado por voz ativado — Fale a sua observação!');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setNoteText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onTriggerToast('Erro na captação de voz. Tente novamente.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      onTriggerToast('Não foi possível iniciar o microfone.');
    }
  };

  // Category Color Map
  const getCategoryBadge = (cat: MatchNoteEntry['category']) => {
    switch (cat) {
      case 'golo':
        return { label: '⚽ Golo', bg: 'bg-[#1b4332]', text: 'text-[#74c69d]' };
      case 'cartao':
        return { label: '🟨 Cartão', bg: 'bg-[#7f5539]/40', text: 'text-[#ddb892]' };
      case 'tatica':
        return { label: '🧠 Tático', bg: 'bg-[#0b4e6e]/40', text: 'text-[#8abfe4]' };
      case 'tecnica':
        return { label: '🛡️ Técnica / Duelo', bg: 'bg-[#4a154b]/40', text: 'text-[#e0a96d]' };
      case 'destaque':
        return { label: '⭐ Destaque Alvo', bg: 'bg-[#ff535b]/20', text: 'text-[#ffb3b1]' };
      default:
        return { label: '📝 Geral', bg: 'bg-[#26262B]', text: 'text-[#e4bebc]' };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0b] text-[#e5e2e3] flex flex-col font-sans overflow-hidden select-none animate-fade-in">
      {/* 1. TOP HEADER - STADIUM MODE & MATCH TIMER */}
      <header className="bg-[#141416] border-b border-[#26262B] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-xl">
        {/* Match Details Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff535b] to-[#7f1319] border border-[#ffb3b1]/40 flex items-center justify-center text-white shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[22px]">stadium</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffb3b1] font-mono-data">
                MODO ESTÁDIO • ZEN MODE
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <h2 className="text-base font-extrabold text-[#e5e2e3] truncate">
              {match.homeTeam} vs {match.awayTeam}
            </h2>
            <span className="text-[11px] text-[#e4bebc]/70 truncate">
              {match.competition} • {match.venue}
            </span>
          </div>
        </div>

        {/* CENTERED MATCH TIMER DISPLAY & CONTROLS */}
        <div className="flex flex-col items-center gap-1.5 bg-[#0e0e0f] border border-[#26262B] px-4 py-2 rounded-2xl shadow-inner">
          <div className="flex items-center gap-3">
            {/* Live Indicator Dot */}
            <span
              className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-amber-500'
              }`}
              title={isRunning ? 'A contar em tempo real' : 'Pausado'}
            />

            {/* Time Display MM:SS */}
            <span className="font-mono-data font-black text-3xl sm:text-4xl text-[#ffb3b1] tracking-wider drop-shadow-md">
              {formatTime(seconds)}
            </span>

            {/* Match Minute Badge */}
            <span className="bg-[#ff535b]/20 border border-[#ff535b]/40 text-[#ffb3b1] font-mono-data font-extrabold text-sm px-2.5 py-1 rounded-xl">
              {getMatchMinute(seconds)}
            </span>
          </div>

          {/* TIMER CONTROL BUTTONS */}
          <div className="flex items-center gap-1.5">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStart}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>Iniciar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow"
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                <span>Pausa</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEndMatch}
              className="bg-[#353436] hover:bg-[#ff535b] text-[#e4bebc] hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
              title="Encerrar Partida"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="hidden sm:inline">Encerrar</span>
            </button>

            {/* Quick Preset Time Actions */}
            <div className="hidden md:flex items-center gap-1 border-l border-[#26262B] pl-2 ml-1">
              <button
                type="button"
                onClick={() => handleSetPreset(0, '1º Tempo (00:00)')}
                className="text-[10px] bg-[#1c1c1f] hover:bg-[#26262B] text-[#e4bebc] px-2 py-0.5 rounded font-mono-data cursor-pointer"
              >
                1ºT (00m)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(2700, 'Intervalo (45:00)')}
                className="text-[10px] bg-[#1c1c1f] hover:bg-[#26262B] text-[#e4bebc] px-2 py-0.5 rounded font-mono-data cursor-pointer"
              >
                INT (45m)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(2700, '2º Tempo (45:00)')}
                className="text-[10px] bg-[#1c1c1f] hover:bg-[#26262B] text-[#e4bebc] px-2 py-0.5 rounded font-mono-data cursor-pointer"
              >
                2ºT (45m)
              </button>
              <button
                type="button"
                onClick={() => handleAddMinutes(1)}
                className="text-[10px] bg-[#1c1c1f] hover:bg-[#26262B] text-[#8abfe4] px-1.5 py-0.5 rounded font-mono-data cursor-pointer"
                title="+1 Minuto"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => handleAddMinutes(5)}
                className="text-[10px] bg-[#1c1c1f] hover:bg-[#26262B] text-[#8abfe4] px-1.5 py-0.5 rounded font-mono-data cursor-pointer"
                title="+5 Minutos"
              >
                +5m
              </button>
            </div>
          </div>
        </div>

        {/* EXIT ZEN MODE ACTION */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#26262B] hover:bg-[#ff535b] text-[#e5e2e3] hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Sair do Modo Estádio</span>
            <kbd className="hidden lg:inline text-[9px] bg-[#141416] px-1.5 py-0.5 rounded border border-[#353436]">
              ESC
            </kbd>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY - TIMELINE DE OBSERVAÇÃO */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0a0a0b] flex flex-col gap-4 max-w-4xl mx-auto w-full scrollbar-thin">
        {/* Targets Quick Banner */}
        {targetPlayers.length > 0 && (
          <div className="bg-[#141416] border border-[#26262B] rounded-2xl p-3 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffb3b1] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">radar</span>
              <span>Alvos sob Observação neste Jogo:</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {targetPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedTargetPlayer(p.name);
                    setSelectedCategory('destaque');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTargetPlayer === p.name
                      ? 'bg-[#ff535b]/20 text-[#ffb3b1] border-[#ff535b]'
                      : 'bg-[#1c1c1f] text-[#e4bebc] border-[#26262B] hover:border-[#ff535b]/40'
                  }`}
                >
                  <Avatar name={p.name} className="w-5 h-5 text-[9px] shrink-0" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE SECTION HEADER */}
        <div className="flex items-center justify-between border-b border-[#26262B] pb-2 text-xs font-bold uppercase text-[#e4bebc]">
          <span className="flex items-center gap-1.5 text-[#ffb3b1]">
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Timeline de Observação Qualitativa ({notes.length} notas)</span>
          </span>
          <span className="text-[10px] text-[#e4bebc]/60 font-mono-data">
            Notas ordenadas cronologicamente
          </span>
        </div>

        {/* TIMELINE LIST */}
        {notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3 bg-[#141416]/50 border border-dashed border-[#26262B] rounded-2xl my-auto">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1F] border border-[#353436] flex items-center justify-center text-[#ff535b]">
              <span className="material-symbols-outlined text-3xl">mic</span>
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <p className="font-bold text-sm text-[#e5e2e3]">Nenhuma nota registada no relvado ainda.</p>
              <p className="text-xs text-[#e4bebc]/70">
                Pressione o botão flutuante de microfone no canto inferior direito para ditar por voz ou escreva na caixa abaixo.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 relative before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#26262B]">
            {notes.map((item) => {
              const catBadge = getCategoryBadge(item.category);

              return (
                <div
                  key={item.id}
                  className="relative flex items-start gap-4 pl-2 group animate-fade-in"
                >
                  {/* Minute Circle Badge */}
                  <div className="w-9 h-9 rounded-full bg-[#1c1c1f] border-2 border-[#ff535b] flex items-center justify-center font-mono-data font-black text-xs text-[#ffb3b1] shrink-0 z-10 shadow-lg">
                    {item.minute}
                  </div>

                  {/* Note Card */}
                  <div className="flex-1 bg-[#141416] border border-[#26262B] hover:border-[#353436] rounded-2xl p-3.5 flex flex-col gap-2 transition-all shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-lg uppercase ${catBadge.bg} ${catBadge.text}`}>
                          {catBadge.label}
                        </span>

                        {item.targetPlayerName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30">
                            👤 {item.targetPlayerName}
                          </span>
                        )}

                        <span className="text-[10px] text-[#e4bebc]/60 font-mono-data">
                          Tempo: {item.timestamp}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveNote(item.id)}
                        className="text-[#e4bebc]/40 hover:text-[#ff535b] p-1 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Apagar nota"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#e5e2e3] leading-relaxed font-sans">{item.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={timelineEndRef} />
          </div>
        )}
      </main>

      {/* 3. VOICE DICTATION LISTENING OVERLAY BANNER */}
      {isListening && (
        <div className="bg-[#ff535b] text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-pulse shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] animate-bounce">mic</span>
            <span>🎙️ Ditado Áudio Ativo: A ouvir a sua voz... Fale claramente a observação.</span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider cursor-pointer"
          >
            Parar Ditado
          </button>
        </div>
      )}

      {/* 4. FIXED BOTTOM INPUT BAR */}
      <footer className="bg-[#141416] border-t border-[#26262B] p-3 sm:p-4 shrink-0 flex flex-col gap-2 shadow-2xl relative">
        {/* Category & Player Selectors */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase text-[#e4bebc]/70 mr-1">Categoria:</span>
            {(
              [
                { id: 'geral', label: '📝 Geral' },
                { id: 'tatica', label: '🧠 Tática' },
                { id: 'tecnica', label: '🛡️ Técnica' },
                { id: 'golo', label: '⚽ Golo' },
                { id: 'cartao', label: '🟨 Cartão' },
                { id: 'destaque', label: '⭐ Destaque' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#ff535b] text-white'
                    : 'bg-[#1c1c1f] text-[#e4bebc] hover:bg-[#26262B]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {targetPlayers.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold uppercase text-[#e4bebc]/70">Alvo:</span>
              <select
                value={selectedTargetPlayer}
                onChange={(e) => setSelectedTargetPlayer(e.target.value)}
                className="bg-[#1c1c1f] text-[#e5e2e3] border border-[#26262B] text-[11px] px-2 py-1 rounded-xl outline-none"
              >
                <option value="">Nenhum Alvo</option>
                {targetPlayers.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddNote} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Escreva nota ao vivo para os ${getMatchMinute(seconds)}... (ex: Excelente controlo orientado)`}
              className="w-full bg-[#0a0a0b] border border-[#26262B] focus:border-[#ff535b] text-[#e5e2e3] text-xs px-4 py-3 rounded-xl outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!noteText.trim()}
            className="bg-[#ff535b] hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl transition-all cursor-pointer shadow flex items-center gap-1 shrink-0"
          >
            <span>Registar ({getMatchMinute(seconds)})</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>

        {/* LARGE FLOATING ACTION BUTTON (FAB) FOR AUDIO DICTATION */}
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-4 -top-16 sm:-top-18 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer z-20 ${
            isListening
              ? 'bg-red-600 ring-8 ring-red-500/50 animate-bounce'
              : 'bg-gradient-to-br from-[#ff535b] to-[#c92a32] hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(255,83,91,0.5)]'
          }`}
          title={isListening ? 'A ouvir... clique para parar' : 'Ditado por voz ao vivo (Ativar Microfone)'}
        >
          <span className="material-symbols-outlined text-2xl">
            {isListening ? 'mic_off' : 'mic'}
          </span>
        </button>
      </footer>
    </div>
  );
};
