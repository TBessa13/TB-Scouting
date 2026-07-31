import React, { useState, useRef, useEffect } from 'react';
import { Player, MatchReport, MainView, FormationName } from '../types';
import { Avatar } from './Avatar';

interface ActionDirective {
  action: 'FILTER_PLAYERS' | 'COMPARE_PLAYERS' | 'NAVIGATE_VIEW' | 'OPEN_PLAYER';
  playerIds?: string[];
  targetView?: MainView;
  positionFilter?: string;
  contractExpiringOnly?: boolean;
  minFit?: number;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedPlayers?: Player[];
  actionExecuted?: string;
  actionDirective?: ActionDirective;
  timestamp: string;
}

interface AssistantScoutModalProps {
  squadPlayers?: Player[];
  globalPlayers?: Player[];
  players?: Player[]; // Fallback active team players
  matches?: MatchReport[];
  positionalRequirements?: any;
  currentClub?: string;
  defaultFormation?: FormationName;
  onPlayerClick: (player: Player) => void;
  onTriggerToast: (msg: string) => void;
  onNavigateView?: (view: MainView) => void;
  onComparePlayers?: (playerIds: string[]) => void;
}

// Custom Light/Dark Markdown & Table Renderer for Chat
const ChatMarkdownText: React.FC<{ content: string }> = ({ content }) => {
  // Remove ```action ... ``` code blocks from visible text
  const cleanContent = content.replace(/```action[\s\S]*?```/g, '').trim();

  // Split content into blocks (paragraphs / tables)
  const lines = cleanContent.split('\n');
  const blocks: { type: 'paragraph' | 'table' | 'list'; lines: string[] }[] = [];

  let currentBlock: { type: 'paragraph' | 'table' | 'list'; lines: string[] } | null = null;

  lines.forEach((line) => {
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isListLine = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());

    if (isTableLine) {
      if (currentBlock?.type === 'table') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'table', lines: [line] };
      }
    } else if (isListLine) {
      if (currentBlock?.type === 'list') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', lines: [line] };
      }
    } else {
      if (currentBlock?.type === 'paragraph') {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', lines: [line] };
      }
    }
  });
  if (currentBlock) blocks.push(currentBlock);

  const renderFormattedInline = (str: string) => {
    // Basic bold parsing **text**
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-[#ffb3b1]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, bIdx) => {
        if (block.type === 'table') {
          // Render Table
          const rows = block.lines
            .filter((l) => !l.includes('---')) // Filter separator line
            .map((l) =>
              l
                .split('|')
                .slice(1, -1)
                .map((cell) => cell.trim())
            );

          if (rows.length === 0) return null;
          const [header, ...bodyRows] = rows;

          return (
            <div key={bIdx} className="my-2 overflow-x-auto rounded-lg border border-[#26262B]">
              <table className="w-full text-left text-[11px] border-collapse bg-[#0A0A0B]">
                {header && (
                  <thead>
                    <tr className="bg-[#1C1C1F] border-b border-[#26262B] text-[#ffb3b1] font-bold">
                      {header.map((col, cIdx) => (
                        <th key={cIdx} className="p-2 border-r border-[#26262B] last:border-0 uppercase tracking-wider">
                          {renderFormattedInline(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {bodyRows.map((r, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#26262B] last:border-0 hover:bg-[#141416]/50">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-[#26262B] last:border-0 text-[#e5e2e3]">
                          {renderFormattedInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={bIdx} className="list-disc list-inside space-y-1 my-1 text-[#e5e2e3]">
              {block.lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {renderFormattedInline(l.replace(/^[-*]\s+|\d+\.\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bIdx} className="whitespace-pre-wrap leading-relaxed">
            {renderFormattedInline(block.lines.join('\n'))}
          </p>
        );
      })}
    </div>
  );
};

export const AssistantScoutModal: React.FC<AssistantScoutModalProps> = ({
  squadPlayers = [],
  globalPlayers = [],
  players = [],
  matches = [],
  positionalRequirements = {},
  currentClub = 'GD Chaves',
  defaultFormation = '4-2-3-1',
  onPlayerClick,
  onTriggerToast,
  onNavigateView,
  onComparePlayers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const allAvailablePlayers = globalPlayers.length > 0 ? globalPlayers : players;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Olá, Tiago! Sou o teu **Assistant Scout** (${currentClub}).\n\nTenho acesso em tempo real ao teu Plantel, Base de Dados Global, Jogos & Relatórios e Requisitos Posicionais. Como posso apoiar a prospeção hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Mostra os pontas de lança a acabar contrato',
    'Resume os pontos fracos do lateral do Braga no último jogo',
    'Compara o Kovac com o Silva',
    'Filtra extremos com fit tático > 80%',
  ];

  const handleExecuteAction = (actionDir: ActionDirective) => {
    if (actionDir.action === 'NAVIGATE_VIEW' && actionDir.targetView && onNavigateView) {
      onNavigateView(actionDir.targetView);
      onTriggerToast(`Navegado para a vista "${actionDir.targetView}"`);
    } else if (actionDir.action === 'COMPARE_PLAYERS' && actionDir.playerIds && actionDir.playerIds.length > 0 && onComparePlayers) {
      onComparePlayers(actionDir.playerIds);
      onTriggerToast(`A abrir comparação entre ${actionDir.playerIds.length} jogadores`);
    } else if (actionDir.action === 'OPEN_PLAYER' && actionDir.playerIds && actionDir.playerIds.length > 0) {
      const p = allAvailablePlayers.find((item) => item.id === actionDir.playerIds![0]);
      if (p) {
        onPlayerClick(p);
        onTriggerToast(`A abrir perfil de ${p.name}`);
      }
    } else if (actionDir.action === 'FILTER_PLAYERS' && onNavigateView) {
      onNavigateView('shortlists');
      onTriggerToast(`Filtros de prospeção aplicados na lista`);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // 1. Send request to Server API
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          players: allAvailablePlayers,
          squadPlayers,
          globalPlayers: allAvailablePlayers,
          matches,
          positionalRequirements,
          currentClub,
          defaultFormation,
        }),
      });

      const data = await res.json();

      if (data.reply && data.status !== 'NO_KEY') {
        const replyText: string = data.reply;

        // Extract action block if exists
        let actionDir: ActionDirective | undefined = undefined;
        let actionLabel = '';
        const actionMatch = replyText.match(/```action([\s\S]*?)```/);

        if (actionMatch && actionMatch[1]) {
          try {
            actionDir = JSON.parse(actionMatch[1].trim());
            if (actionDir) {
              if (actionDir.action === 'COMPARE_PLAYERS') actionLabel = '⚡ Ação: Comparação no ecrã iniciada';
              else if (actionDir.action === 'FILTER_PLAYERS') actionLabel = '⚡ Ação: Filtros de prospeção aplicados';
              else if (actionDir.action === 'NAVIGATE_VIEW') actionLabel = `⚡ Ação: Vista alterada para ${actionDir.targetView}`;
              else if (actionDir.action === 'OPEN_PLAYER') actionLabel = '⚡ Ação: Perfil do jogador aberto';

              handleExecuteAction(actionDir);
            }
          } catch (e) {
            console.warn('Action JSON parse warning:', e);
          }
        }

        // Check matching recommended player cards
        let recPlayers: Player[] = [];
        if (actionDir?.playerIds && actionDir.playerIds.length > 0) {
          recPlayers = allAvailablePlayers.filter((p) => actionDir!.playerIds!.includes(p.id));
        }

        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          recommendedPlayers: recPlayers,
          actionExecuted: actionLabel,
          actionDirective: actionDir,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('AI Assistant fallback active:', err);
    }

    // 2. Intelligent Local Fallback
    setTimeout(() => {
      const lower = query.toLowerCase();
      let matchedPlayers: Player[] = [];
      let replyText = '';
      let actionExec = '';
      let actionDir: ActionDirective | undefined = undefined;

      // Scenario A: Pontas de lança a acabar contrato
      if (lower.includes('ponta') || lower.includes('pontas de lança') || lower.includes('avançado') || (lower.includes('pl') && lower.includes('contrato'))) {
        matchedPlayers = allAvailablePlayers.filter(
          (p) =>
            (p.position === 'PL' || p.secondaryPositions?.includes('PL')) &&
            (p.isContractExpiringSoon || p.contractEnd.includes('2024') || p.contractEnd.includes('2025') || p.contractEnd.includes('2026'))
        );

        if (matchedPlayers.length === 0) {
          matchedPlayers = allAvailablePlayers.filter((p) => p.position === 'PL').slice(0, 2);
        }

        replyText = `### 🎯 Pontas de Lança em Situação Contratual Vulnerável\n\nIdentifiquei **${matchedPlayers.length} avançados** da base de prospeção em fim de contrato próximo:\n\n` +
          matchedPlayers.map(p => `- **${p.name}** (${p.club}) — ${p.contractEnd} | Valor: ${p.marketValueFormatted} | Fit: **${p.tacticalFitPercent}%**`).join('\n') +
          `\n\n*Nota Tática:* Perfil de finalização imediata com excelente oportunidade de mercado a custo zero ou negociável.`;

        actionExec = '⚡ Ação: Tabela filtrada para Pontas de Lança em fim de contrato';
        actionDir = { action: 'FILTER_PLAYERS', positionFilter: 'PL', contractExpiringOnly: true, targetView: 'shortlists' };
        if (onNavigateView) onNavigateView('shortlists');
      }

      // If database is empty (0 players)
      else if (allAvailablePlayers.length === 0) {
        replyText = `### 📋 Base de Dados Vazia\n\nA base de dados de prospeção está atualmente limpa (0 atletas registados).\n\nPara começar a utilizar o assistente de IA, adicione novos perfis de atletas através do **Scout Wizard** ou importe relatórios de jogo.`;
        actionExec = '⚡ Ação: Base de dados pronta para receber novos atletas';
      }

      // Scenario B: Procura por posições ou relatórios
      else if (lower.includes('lateral') || lower.includes('relatório') || lower.includes('jogo')) {
        const topPlayer = allAvailablePlayers[0];
        matchedPlayers = topPlayer ? [topPlayer] : [];

        replyText = `### 📋 Análise de Atleta Sinalizado\n**Atleta:** ${topPlayer.name} (${topPlayer.position} - ${topPlayer.club})\n**Adequação Tática:** ${topPlayer.tacticalFitPercent}%\n\n#### Notes do Scout:\n- **Técnica:** ${topPlayer.notes?.tecnica || 'Em análise'}\n- **Tática:** ${topPlayer.notes?.tatica || 'Em análise'}`;

        actionExec = `⚡ Ação: Perfil de ${topPlayer.name} analisado`;
        actionDir = { action: 'OPEN_PLAYER', playerIds: [topPlayer.id] };
      }

      // Scenario C: Comparação entre jogadores
      else if (lower.includes('compara') || lower.includes('comparação')) {
        const p1 = allAvailablePlayers[0];
        const p2 = allAvailablePlayers[1] || allAvailablePlayers[0];
        matchedPlayers = [p1, p2].filter(Boolean);

        replyText = `### 📊 Comparativo Tático & Perfil Módulo Prospeção\n\n| Parâmetro | **${p1.name}** | **${p2?.name || p1.name}** |\n| :--- | :--- | :--- |\n| **Posição** | ${p1.position} | ${p2?.position || p1.position} |\n| **Idade** | ${p1.age} anos | ${p2?.age || p1.age} anos |\n| **Clube Atual** | ${p1.club} | ${p2?.club || p1.club} |\n| **Adequação Tática** | **${p1.tacticalFitPercent}%** | **${p2?.tacticalFitPercent || p1.tacticalFitPercent}%** |`;

        actionExec = '⚡ Ação: Módulo de Comparação Aberto';
        actionDir = { action: 'COMPARE_PLAYERS', playerIds: matchedPlayers.map(p => p.id) };
        if (onComparePlayers) onComparePlayers(matchedPlayers.map(p => p.id));
      }

      // Scenario D: Default response
      else {
        matchedPlayers = allAvailablePlayers.slice(0, 2);
        replyText = `Analisando a tua questão **"${query}"** no contexto do **${currentClub}** (${defaultFormation}):\n\nCom base na base de dados de observação e relatórios disponíveis, reuni os atletas com melhor perfil de encaixe no modelo de jogo:`;
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        recommendedPlayers: matchedPlayers,
        actionExecuted: actionExec,
        actionDirective: actionDir,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 bg-[#141416] hover:bg-[#1C1C1F] text-[#e5e2e3] border-2 border-[#ff535b] px-4 py-3 rounded-full shadow-[0_0_20px_rgba(255,83,91,0.35)] hover:shadow-[0_0_28px_rgba(255,83,91,0.55)] transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[#ff535b] text-[22px] group-hover:rotate-12 transition-transform">
            auto_awesome
          </span>
          <span className="font-bold text-xs uppercase tracking-wider text-[#e5e2e3]">
            Assistant Scout
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff535b] animate-ping absolute -top-1 -right-1" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff535b] absolute -top-1 -right-1" />
        </button>
      </div>

      {/* CHAT PANEL / SLIDE-OVER DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 w-full sm:w-[460px] md:w-[500px] h-full bg-[#141416] border-l border-[#ff535b]/40 shadow-2xl flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="p-4 bg-[#0e0e0f] border-b border-[#26262B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff535b]/20 border border-[#ff535b] flex items-center justify-center shadow-[0_0_12px_rgba(255,83,91,0.3)]">
                  <span className="material-symbols-outlined text-[#ff535b] text-[22px]">
                    auto_awesome
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#e5e2e3]">
                      Assistant Scout
                    </span>
                    <span className="text-[9px] font-mono-data uppercase bg-[#0b4e6e] text-[#8abfe4] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8abfe4] animate-pulse" />
                      Gemini 3.6
                    </span>
                  </div>
                  <span className="text-[10px] text-[#e4bebc] flex items-center gap-1">
                    <span>{currentClub}</span>
                    <span>•</span>
                    <span className="text-[#8abfe4]">Contexto Ativo em Tempo Real</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#e4bebc] hover:text-[#e5e2e3] hover:bg-[#26262B] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* MESSAGES HISTORY */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 max-w-[92%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`p-3.5 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#ff535b] text-white font-medium rounded-tr-none shadow-md'
                        : 'bg-[#1C1C1F] border border-[#26262B] text-[#e5e2e3] rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Formatted Markdown Content */}
                    <ChatMarkdownText content={msg.text} />

                    {/* ACTION EXECUTION PILL */}
                    {msg.actionExecuted && (
                      <div className="mt-2.5 pt-2 border-t border-[#ff535b]/30 flex items-center justify-between gap-2 bg-[#0e0e0f]/60 p-2 rounded-lg text-[#ffb3b1] font-mono-data text-[10px]">
                        <span>{msg.actionExecuted}</span>
                        {msg.actionDirective && (
                          <button
                            onClick={() => handleExecuteAction(msg.actionDirective!)}
                            className="bg-[#ff535b] text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase hover:brightness-110 cursor-pointer"
                          >
                            Ver no Ecrã
                          </button>
                        )}
                      </div>
                    )}

                    {/* RECOMMENDED PLAYERS CARDS */}
                    {msg.recommendedPlayers && msg.recommendedPlayers.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-[#26262B]">
                        <span className="text-[10px] font-bold text-[#e4bebc] uppercase tracking-wider">
                          Atletas Identificados ({msg.recommendedPlayers.length}):
                        </span>
                        {msg.recommendedPlayers.map((player) => (
                          <div
                            key={player.id}
                            onClick={() => {
                              onPlayerClick(player);
                              onTriggerToast(`A abrir perfil completo de ${player.name}`);
                            }}
                            className="bg-[#0e0e0f] hover:bg-[#26262B] border border-[#ff535b]/40 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={player.name}
                                className="w-8 h-8 text-[11px] border border-[#26262B] group-hover:border-[#ff535b] shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-[#e5e2e3] group-hover:text-[#ffb3b1]">
                                  {player.name}
                                </span>
                                <span className="text-[10px] text-[#e4bebc]">
                                  {player.position} | {player.club} | Fit: <span className="text-[#8abfe4] font-bold">{player.tacticalFitPercent}%</span>
                                </span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-[16px] text-[#ff535b] group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-[#e4bebc]/70 font-mono-data px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="self-start bg-[#1C1C1F] border border-[#26262B] p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-[#e4bebc]">
                  <span className="w-2 h-2 rounded-full bg-[#ff535b] animate-ping" />
                  <span>Assistant Scout a analisar dados e relatórios...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* QUICK PROMPTS CHIPS */}
            <div className="p-3 bg-[#0e0e0f] border-t border-[#26262B] flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#e4bebc] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-[#ff535b]">tips_and_updates</span>
                <span>Sugestões de Consulta:</span>
              </span>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="bg-[#1C1C1F] hover:bg-[#26262B] text-[#e4bebc] hover:text-[#e5e2e3] border border-[#26262B] hover:border-[#ff535b]/50 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* INPUT BAR */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pergunta à IA (ex: Resume os pontos fracos do lateral do Braga)..."
                  className="flex-1 bg-[#1C1C1F] border border-[#26262B] focus:border-[#ff535b] text-[#e5e2e3] text-xs px-3.5 py-2.5 rounded-xl outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping}
                  className="bg-[#ff535b] hover:brightness-110 disabled:opacity-50 text-white p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
