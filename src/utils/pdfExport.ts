import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Player, RatingSystem, getPlayerAge, PlayerStatus } from '../types';

const statusLabels: Record<PlayerStatus, string> = {
  hire: 'Contratar',
  track: 'Acompanhar',
  squad: 'Opção Plantel',
  discard: 'Descartar',
  pending: 'Por definir',
};

export function exportShadowTeamListPdf(
  teamName: string,
  players: Player[],
  ratingSystem: RatingSystem = '20'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Top Decorative Header Banner
  doc.setFillColor(20, 20, 22); // #141416
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Accent Line
  doc.setFillColor(255, 83, 91); // #ff535b
  doc.rect(0, 21.5, pageWidth, 1.5, 'F');

  // Brand Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(228, 190, 188); // #e4bebc
  doc.text('SHADOW SCOUTING  |  DEPARTAMENTO DE PROSPEÇÃO', 12, 8);

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`RELATÓRIO DE PLANTEL: ${teamName.toUpperCase()}`, 12, 16);

  // Header Right Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(228, 190, 188);
  doc.text(`Data: ${dateStr}`, pageWidth - 12, 9, { align: 'right' });
  doc.text(`Total: ${players.length} Atletas`, pageWidth - 12, 15, { align: 'right' });

  // Prepare table rows
  // Columns requested: Nome, Clube/Liga, Posição, Idade, Altura, Pé, Recomendação, Rating, Agente, Adequação Tática
  const tableData = players.map((player) => {
    const age = getPlayerAge(player);
    const height = player.heightCm ? `${player.heightCm} cm` : '-';
    const foot = player.dominantFoot || '-';
    const clubLeague = `${player.club || 'Sem Clube'}${player.league ? ` (${player.league})` : ''}`;
    const status = statusLabels[player.status] || player.status || 'Por definir';

    let ratingStr = '-';
    if (player.rating != null) {
      ratingStr = ratingSystem === '20' ? `${player.rating} / 20` : `${player.rating} ★`;
    }

    const tacticalFit = player.tacticalFitPercent != null ? `${player.tacticalFitPercent}%` : '-';
    const agent = player.agent && player.agent !== 'Sem Agente Registado' ? player.agent : 'Sem Agente';

    return [
      player.name,
      clubLeague,
      player.position,
      `${age} anos`,
      height,
      foot,
      status,
      ratingStr,
      agent,
      tacticalFit,
    ];
  });

  autoTable(doc, {
    startY: 28,
    margin: { top: 26, right: 10, bottom: 14, left: 10 },
    head: [[
      'Nome',
      'Clube / Liga',
      'Posição',
      'Idade',
      'Altura',
      'Pé',
      'Recomendação',
      'Rating',
      'Agente',
      'Adeq. Tática',
    ]],
    body: tableData.length > 0 ? tableData : [['Nenhum jogador registado nesta Shadow Team', '', '', '', '', '', '', '', '', '']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      font: 'helvetica',
      valign: 'middle',
      lineColor: [220, 220, 225],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [28, 27, 28], // #1c1b1c
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 42 }, // Nome
      1: { halign: 'left', cellWidth: 50 }, // Clube / Liga
      2: { halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38], cellWidth: 18 }, // Posição
      3: { halign: 'center', cellWidth: 18 }, // Idade
      4: { halign: 'center', cellWidth: 18 }, // Altura
      5: { halign: 'center', cellWidth: 20 }, // Pé
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 28 }, // Recomendação
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 22 }, // Rating
      8: { halign: 'left', cellWidth: 38 }, // Agente
      9: { halign: 'center', cellWidth: 23 }, // Adeq. Tática
    },
    didDrawPage: (data) => {
      // Footer
      const pageNumber = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(
        'Shadow Scouting Platform • Documento Oficial de Análise e Prospeção',
        12,
        pageHeight - 6
      );
      doc.text(
        `Página ${pageNumber}`,
        pageWidth - 12,
        pageHeight - 6,
        { align: 'right' }
      );
    },
  });

  const safeTeamName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  doc.save(`shadow_team_${safeTeamName}_lista.pdf`);
}
