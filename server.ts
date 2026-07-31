import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Server-side GenAI initialization
  const getAi = () => {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Route: Assistant Chat (Elite Copilot with Context Injection & Actions)
  app.post('/api/assistant', async (req, res) => {
    try {
      const {
        message,
        players = [],
        squadPlayers = [],
        globalPlayers = [],
        matches = [],
        positionalRequirements = {},
        currentClub = 'GD Chaves',
        defaultFormation = '4-2-3-1',
      } = req.body;

      const ai = getAi();
      if (!ai) {
        return res.json({ status: 'NO_KEY' });
      }

      const allPlayersCombined = globalPlayers.length > 0 ? globalPlayers : players;

      const prompt = `
CONTEXTO DA APLICAÇÃO EM TEMPO REAL:
- Clube Principal / Equipa da Casa: ${currentClub}
- Formação Tática Padrão: ${defaultFormation}

1. PLANTEL ATUAL DA EQUIPA (${squadPlayers.length} Atletas):
${JSON.stringify(
  squadPlayers.map((p: any) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    age: p.age,
    club: p.club,
    contractEnd: p.contractEnd,
    isContractExpiringSoon: p.isContractExpiringSoon,
    marketValueFormatted: p.marketValueFormatted,
    tacticalFitPercent: p.tacticalFitPercent,
    status: p.status,
    notes: p.notes,
  })),
  null,
  2
)}

2. BASE GLOBAL DE PROSPEÇÃO & SHORTLISTS (${allPlayersCombined.length} Atletas):
${JSON.stringify(
  allPlayersCombined.map((p: any) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    secondaryPositions: p.secondaryPositions,
    age: p.age,
    club: p.club,
    league: p.league,
    contractEnd: p.contractEnd,
    isContractExpiringSoon: p.isContractExpiringSoon,
    marketValueFormatted: p.marketValueFormatted,
    marketValueValue: p.marketValueValue,
    tacticalFitPercent: p.tacticalFitPercent,
    status: p.status,
    notes: p.notes,
  })),
  null,
  2
)}

3. JOGOS, RELATÓRIOS E ANEXOS DE OBSERVAÇÃO (${matches.length} Jogos):
${JSON.stringify(matches, null, 2)}

4. REQUISITOS POSICIONAIS DEFINIDOS PELO DEPARTAMENTO:
${JSON.stringify(positionalRequirements, null, 2)}

PERGUNTA / COMANDO DO UTILIZADOR:
"${message}"
`;

      const systemInstruction = `
És o "Assistant Scout", o Copilot de Prospeção de Elite, Observação e Análise Tática do clube ${currentClub} na plataforma Shadow Scouting.
Responde SEMPRE em Português de Portugal com linguagem rigorosa, profissional e estruturada de futebol profissional.

DIRETRIZES FUNDAMENTAIS:
1. Responde de forma direta, perspicaz e fundamentada com os dados reais fornecidos no contexto.
2. Se o utilizador pedir uma COMPARAÇÃO RÁPIDA entre jogadores, gera uma tabela em Markdown comparando:
   | Métrica | Jogador A | Jogador B |
   com Posição, Idade, Clube, Fim de Contrato, Valor de Mercado, Tactical Fit % e Principais Notas Técnicas/Táticas/Físicas.
3. Se o utilizador perguntar por ANÁLISE DE JOGOS ou RELATÓRIOS (ex: "pontos fracos do lateral direito do Braga no último jogo"), analisa os relatórios/jogos (ex: SC Braga, Vitória SC vs SC Braga, jogador Lucas Silva - DD) e as suas notas técnicas e anexos para sintetizar os pontos fortes e fracos de forma clara.
4. Se a mensagem solicitar uma AÇÃO INTERATIVA (ex: filtrar jogadores, comparar no ecran, ou navegar), acrescenta no FIM da tua resposta um bloco JSON com as acções mapeadas, estruturado exatamente assim:

\`\`\`action
{
  "action": "FILTER_PLAYERS" | "COMPARE_PLAYERS" | "NAVIGATE_VIEW" | "OPEN_PLAYER",
  "playerIds": ["p1", "p2"],
  "targetView": "squad" | "shortlists" | "teamAudit" | "matches",
  "positionFilter": "PL" | "DD" | "MDC" | "EE" | "all",
  "contractExpiringOnly": true | false,
  "minFit": 80
}
\`\`\`
Não inventes dados que não existam na base de dados fornecida.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Assistant API Error:', err);
      res.status(500).json({ error: err?.message || 'Erro ao comunicar com a IA' });
    }
  });

  // API Route: AI Executive Report
  app.post('/api/report', async (req, res) => {
    try {
      const { player } = req.body;
      const ai = getAi();
      if (!ai) {
        return res.json({ status: 'NO_KEY' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Cria um Relatório Executivo Analítico de Observação de Futebol para o jogador:
Nome: ${player.name}
Idade: ${player.age} anos | Posição: ${player.position}
Clube Atual: ${player.club} | Pé Dominante: ${player.dominantFoot}
Valor de Mercado: ${player.marketValueFormatted} | Fim de Contrato: ${player.contractEnd}
Adequação Tática ao Modelo do Clube: ${player.tacticalFitPercent}%

Notas do Scout:
- Técnica: ${player.notes?.tecnica}
- Tática: ${player.notes?.tatica}
- Física: ${player.notes?.fisica}
- Psicológica: ${player.notes?.psicologica}

Instruções:
Sintetiza as informações em 4 subsecções executivas:
1. Perfil e Impacto Imediato no Plantel
2. Análise Multidimensional (Técnica, Tática, Física, Atitude)
3. Adequação Tática e Riscos de Adaptação
4. Parecer Final e Ação Recomendada (Contratar/Acompanhar/Descartar)

Mantém um tom rigoroso, profissional e de nível da Liga dos Campeões.`,
      });

      res.json({ reportText: response.text });
    } catch (err: any) {
      console.error('Report API Error:', err);
      res.status(500).json({ error: err?.message || 'Erro ao gerar relatório com IA' });
    }
  });

  // Vite middleware in dev mode / Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
