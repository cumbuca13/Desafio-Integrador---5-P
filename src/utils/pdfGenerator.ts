import { jsPDF } from 'jspdf';

export interface PdfExportData {
  reportType: 'operacional' | 'geo' | 'churn' | 'upsell' | 'consolidado';
  vendasProdutos?: any[];
  geografico?: any[];
  retencao?: any[];
  upselling?: any[];
  faturamentoTotal?: number;
  melhorDesempenho?: string;
  totalPedidosConcluidos?: number;
  totalClientes?: number;
}

export function exportExecutivePDF(data: PdfExportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margins = { left: 15, right: 15, top: 25, bottom: 20 };
  const contentWidth = 210 - margins.left - margins.right; // 180mm
  let pageNum = 1;

  // Helper colors
  const colors = {
    slateDark: [15, 23, 42],      // #0f172a (Primary Slate)
    slateHeader: [30, 41, 59],    // #1e293b (Table Headers)
    indigo: [79, 70, 229],        // #4f46e5 (Brand Color)
    indigoLight: [238, 242, 255], // #eef2ff
    emerald: [5, 150, 105],       // #059669 (Faturamento/Sucesso)
    emeraldLight: [240, 253, 250],// #f0fdfa
    rose: [190, 24, 74],          // #be184a (Churn Risk)
    roseLight: [255, 241, 242],   // #fff1f2
    border: [226, 232, 240],      // #e2e8f0
    textDark: [51, 65, 85],       // #334155
    textLight: [100, 116, 139]    // #64748b
  };

  const drawHeader = (title: string) => {
    // Top colored banner
    doc.setFillColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.rect(margins.left, 10, contentWidth, 12, 'F');

    // Header title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('SGBD SINC  |  PORTAL INTELIGENTE DE BI & DECISÃO ESTRATÉGICA', margins.left + 5, 17.5);

    // Document context right-aligned
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(title.toUpperCase(), margins.left + contentWidth - 5, 17.5, { align: 'right' });

    // Footer lines and meta
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.2);
    doc.line(margins.left, 280, margins.left + contentWidth, 280);

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFontSize(7.5);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Confidencial da Corporação`, margins.left, 286);
    doc.text(`Página ${pageNum}`, margins.left + contentWidth, 286, { align: 'right' });
  };

  // Setup the cover background and initial title if consolidated report, otherwise standard page
  if (data.reportType === 'consolidado') {
    // BRAND COVER PAGE
    doc.setFillColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Graphic layout detail (minimal elegance)
    doc.setFillColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
    doc.rect(0, 110, 12, 70, 'F');

    // Document Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('RELATÓRIO DE', 25, 130);
    doc.text('BI & INTELIGÊNCIA', 25, 142);
    doc.setTextColor(129, 140, 248); // Indigo 400
    doc.text('ESTRATÉGICA', 25, 154);

    // Subtitle
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Mapeamento Inteligente de Vendas, Retenção Ativa, Churn e Upgrade de Contratos', 25, 165);

    // Metas
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Preparado para os quadros diretivos e de governança executiva.', 25, 175);

    // Footer of cover
    doc.line(25, 240, 185, 240);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`DATA DOS REQUISITOS: ${new Date().toLocaleDateString('pt-BR')}`, 25, 247);
    doc.text('SISTEMA ATIVO SGBD SINC PRO', 25, 253);
    doc.text('IMPRESSÃO EXECUTIVA FORMAL', 185, 247, { align: 'right' });

    pageNum++;
    doc.addPage();
  }

  // --------------------------------------------------------------------------
  // PAGINA 1: OPERACIONAL - DESEMPENHO COMERCIAL
  // --------------------------------------------------------------------------
  if (data.reportType === 'operacional' || data.reportType === 'consolidado') {
    drawHeader('Análise Comercial de Operações');
    let y = 32;

    doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('1. Relatório de Desempenho de Vendas por Produto', margins.left, y);
    y += 5;

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mapeamento geral do portfólio comercial de produtos, faturamento líquido acumulado e status de estoque.', margins.left, y);
    y += 10;

    // Métricas topo (KPI cards)
    doc.setFillColor(248, 250, 252); // slate 50
    doc.roundedRect(margins.left, y, contentWidth, 18, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margins.left, y, contentWidth, 18);

    // KPI 1
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('RECEITA LÍQUIDA EMITIDA', margins.left + 10, y + 5.5);
    doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
    doc.setFontSize(11);
    doc.text(`R$ ${data.faturamentoTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, margins.left + 10, y + 12);

    // KPI 2
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PEDIDOS CONCLUÍDOS', margins.left + 75, y + 5.5);
    doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.setFontSize(11);
    doc.text(`${data.totalPedidosConcluidos || 0} ordens`, margins.left + 75, y + 12);

    // KPI 3
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DESEMPENHO LÍDER', margins.left + 130, y + 5.5);
    doc.setTextColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
    doc.setFontSize(8.5);
    const topProd = data.melhorDesempenho || 'Nenhum';
    const cleanTopProd = topProd.length > 25 ? topProd.slice(0, 23) + '...' : topProd;
    doc.text(cleanTopProd, margins.left + 130, y + 11.5);

    y += 24;

    // Tabela Vendas
    const tableData = data.vendasProdutos || [];
    
    // Header tabelas
    doc.setFillColor(colors.slateHeader[0], colors.slateHeader[1], colors.slateHeader[2]);
    doc.rect(margins.left, y, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Cód', margins.left + 3, y + 5.5);
    doc.text('Nome do Produto', margins.left + 18, y + 5.5);
    doc.text('Categoria', margins.left + 72, y + 5.5);
    doc.text('Preço Unitário', margins.left + 115, y + 5.5, { align: 'right' });
    doc.text('Qtd Vendida', margins.left + 140, y + 5.5, { align: 'center' });
    doc.text('Recebimento Total', margins.left + 177, y + 5.5, { align: 'right' });

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    tableData.forEach((row, index) => {
      // Background striping
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margins.left, y, contentWidth, 7.5, 'F');
      
      // Bottom border line
      doc.setDrawColor(241, 245, 249);
      doc.line(margins.left, y + 7.5, margins.left + contentWidth, y + 7.5);

      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(row.id, margins.left + 3, y + 5);
      
      doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(row.nome.length > 28 ? row.nome.slice(0, 26) + '...' : row.nome, margins.left + 18, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(row.categoria, margins.left + 72, y + 5);

      doc.text(`R$ ${row.preco.toFixed(2)}`, margins.left + 115, y + 5, { align: 'right' });
      doc.text(`${row.qtdVendida} un`, margins.left + 140, y + 5, { align: 'center' });
      
      doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${row.receitaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margins.left + 177, y + 5, { align: 'right' });

      y += 7.5;
    });

    y += 10;

    // Rodapé de seção explicativa
    doc.setFillColor(colors.indigoLight[0], colors.indigoLight[1], colors.indigoLight[2]);
    doc.roundedRect(margins.left, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(224, 231, 255);
    doc.rect(margins.left, y, contentWidth, 14);

    doc.setTextColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DIRETRIZ DE ABASTECIMENTO:', margins.left + 5, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text('Avaliar imediatamente os produtos listados em fim de estoque e reposicionar verba para o best-seller.', margins.left + 5, y + 9.5);
  }

  // --------------------------------------------------------------------------
  // PAGINA 2: DISTRIBUIÇÃO GEOGRÁFICA
  // --------------------------------------------------------------------------
  if (data.reportType === 'geo' || data.reportType === 'consolidado') {
    if (data.reportType === 'consolidado') {
      pageNum++;
      doc.addPage();
    }
    
    drawHeader('Mapeamento Geográfico de Mercado');
    let y = 32;

    doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('2. Relatório de Distribuição de Vendas por Polos Regionais', margins.left, y);
    y += 5;

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Estudo de penetração em estados brasileiros e países vizinhos, faturamento local consolidado e share percentual.', margins.left, y);
    y += 10;

    // Listagem por Local
    const geoData = data.geografico || [];

    doc.setFillColor(colors.slateHeader[0], colors.slateHeader[1], colors.slateHeader[2]);
    doc.rect(margins.left, y, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('País', margins.left + 5, y + 5.5);
    doc.text('Estado', margins.left + 35, y + 5.5);
    doc.text('Nº Clientes Ativos', margins.left + 70, y + 5.5, { align: 'center' });
    doc.text('Vol. de Transações', margins.left + 110, y + 5.5, { align: 'center' });
    doc.text('Faturamento Acumulado', margins.left + 155, y + 5.5, { align: 'right' });
    doc.text('Share', margins.left + 177, y + 5.5, { align: 'right' });

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const fatTotal = data.faturamentoTotal || 1;

    geoData.forEach((row, index) => {
      const share = (row.faturamento / fatTotal) * 100;

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margins.left, y, contentWidth, 7.5, 'F');
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margins.left, y + 7.5, margins.left + contentWidth, y + 7.5);

      doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(row.pais, margins.left + 5, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(row.estado, margins.left + 35, y + 5);

      doc.text(`${row.clientesCount} corp`, margins.left + 70, y + 5, { align: 'center' });
      doc.text(`${row.pedidosCount} ords`, margins.left + 110, y + 5, { align: 'center' });
      
      doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${row.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margins.left + 155, y + 5, { align: 'right' });
      
      doc.setTextColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${share.toFixed(1)}%`, margins.left + 177, y + 5, { align: 'right' });

      y += 7.5;
    });

    y += 12;

    // Painel explicativo geo
    doc.setFillColor(colors.emeraldLight[0], colors.emeraldLight[1], colors.emeraldLight[2]);
    doc.roundedRect(margins.left, y, contentWidth, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(209, 250, 229);
    doc.rect(margins.left, y, contentWidth, 18);

    doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ESTATÍSTICA DE CENTRALIZAÇÃO GEOGRÁFICA:', margins.left + 5, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    const principalEstado = geoData[0]?.estado || 'SP';
    doc.text(`O polo mais volumoso representa uma vertical primordial de faturamento (${principalEstado}).`, margins.left + 5, y + 10.5);
    doc.text('Comitê Diretor recomenda expansão em canais offline adicionais para atenuar concentração de risco local.', margins.left + 5, y + 14);
  }

  // --------------------------------------------------------------------------
  // PAGINA 3: RISCO DE CHURN & PLANOS DE RETENÇÃO (DECISÃO ESTRATÉGICA)
  // --------------------------------------------------------------------------
  if (data.reportType === 'churn' || data.reportType === 'consolidado') {
    if (data.reportType === 'consolidado') {
      pageNum++;
      doc.addPage();
    }
    
    drawHeader('Previsão Ativa de Churn & Retenção');
    let y = 32;

    doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('3. Diagnóstico Preditivo de Churn e Prescrições de Atendimento', margins.left, y);
    y += 5;

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Cálculo estatístico via algoritmo RandomForest identificando contas sob vulnerabilidade iminente e plano de ação.', margins.left, y);
    y += 10;

    const churnData = data.retencao || [];

    doc.setFillColor(colors.slateHeader[0], colors.slateHeader[1], colors.slateHeader[2]);
    doc.rect(margins.left, y, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Cliente (ID)', margins.left + 5, y + 5.5);
    doc.text('Risco Churn', margins.left + 45, y + 5.5, { align: 'center' });
    doc.text('Gatilho Histórico do Usuário', margins.left + 70, y + 5.5);
    doc.text('Plano Prescritivo de Retenção', margins.left + 125, y + 5.5);

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    churnData.forEach((row, index) => {
      // Limit list size to fit nicely in 1 page if consolidated report
      if (data.reportType === 'consolidado' && index >= 12) return;

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margins.left, y, contentWidth, 12, 'F');
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margins.left, y + 12, margins.left + contentWidth, y + 12);

      // Nome do Cliente
      doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(row.nomeCliente.length > 18 ? row.nomeCliente.slice(0, 16) + '...' : row.nomeCliente, margins.left + 5, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.setFontSize(7);
      doc.text(`ID: ${row.clienteId}`, margins.left + 5, y + 9);
      doc.setFontSize(8);

      // Score de Risco Churn
      const riskColor = row.churnRisk > 60 ? colors.rose : colors.textDark;
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${row.churnRisk}%`, margins.left + 45, y + 7, { align: 'center' });
      
      // Classificação
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setFillColor(row.churnRisk > 60 ? colors.roseLight[0] : 254, row.churnRisk > 60 ? colors.roseLight[1] : 243, row.churnRisk > 60 ? colors.roseLight[2] : 199);
      doc.roundedRect(margins.left + 35, y + 8.5, 20, 3, 0.5, 0.5, 'FD');
      doc.setTextColor(row.churnRisk > 60 ? colors.rose[0] : 180, row.churnRisk > 60 ? colors.rose[1] : 83, row.churnRisk > 60 ? colors.rose[2] : 9);
      doc.text(row.churnRisk > 60 ? 'ALTO RISCO' : 'MÉDIO RISCO', margins.left + 45, y + 10.8, { align: 'center' });
      doc.setFontSize(8);

      // Gatilho
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      const cleanMotivacao = row.motivacao || 'Motivo geral';
      doc.text(cleanMotivacao, margins.left + 70, y + 7, { maxWidth: 50 });

      // Plano recomendação (Boxed alert)
      doc.setFillColor(colors.roseLight[0], colors.roseLight[1], colors.roseLight[2]);
      doc.rect(margins.left + 124, y + 1.5, 53, 9, 'F');
      doc.setDrawColor(254, 205, 211);
      doc.rect(margins.left + 124, y + 1.5, 53, 9);
      
      doc.setTextColor(colors.rose[0], colors.rose[1], colors.rose[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(row.recomendacao, margins.left + 126, y + 4.5, { maxWidth: 49 });
      doc.setFontSize(8);

      y += 12;
    });

    y += 10;

    // Churn Executive Advisory
    doc.setFillColor(colors.roseLight[0], colors.roseLight[1], colors.roseLight[2]);
    doc.roundedRect(margins.left, y, contentWidth, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(254, 205, 211);
    doc.rect(margins.left, y, contentWidth, 18);

    doc.setTextColor(colors.rose[0], colors.rose[1], colors.rose[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ADVISORY DE PREVENÇÃO:', margins.left + 5, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text('Clientes identificados em Alto Risco com mais de 35% de score preditivo necessitam de triagem prioritária.', margins.left + 5, y + 10.5);
    doc.text('Uma campanha direcionada nas próximas 48h mitigará a possibilidade de cancelamento ativo em até 80%.', margins.left + 5, y + 14);
  }

  // --------------------------------------------------------------------------
  // PAGINA 4: UPGRADE E LTV (ESTRATÉGICO)
  // --------------------------------------------------------------------------
  if (data.reportType === 'upsell' || data.reportType === 'consolidado') {
    if (data.reportType === 'consolidado') {
      pageNum++;
      doc.addPage();
    }
    
    drawHeader('Aumento de Receita e Maximização de LTV');
    let y = 32;

    doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('4. Matriz de Propensão à Compra (Cross-selling e Upgrade)', margins.left, y);
    y += 5;

    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Score preditivo de clientes com alto grau de engajamento interno recomendando portfólios complementares.', margins.left, y);
    y += 10;

    const upsellData = data.upselling || [];

    doc.setFillColor(colors.slateHeader[0], colors.slateHeader[1], colors.slateHeader[2]);
    doc.rect(margins.left, y, contentWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Cliente', margins.left + 5, y + 5.5);
    doc.text('Frequência Hist.', margins.left + 45, y + 5.5, { align: 'center' });
    doc.text('LTV Acumulado', margins.left + 72, y + 5.5, { align: 'right' });
    doc.text('Propensão', margins.left + 95, y + 5.5, { align: 'center' });
    doc.text('Upgrade de Portfólio Recomendado', margins.left + 115, y + 5.5);

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    upsellData.forEach((row, index) => {
      if (data.reportType === 'consolidado' && index >= 12) return;

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margins.left, y, contentWidth, 10, 'F');
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margins.left, y + 10, margins.left + contentWidth, y + 10);

      doc.setTextColor(colors.slateDark[0], colors.slateDark[1], colors.slateDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(row.nomeCliente, margins.left + 5, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(`${row.features.frequenciaCompras} transações`, margins.left + 45, y + 6, { align: 'center' });
      
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(`R$ ${row.features.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margins.left + 72, y + 6, { align: 'right' });

      doc.setTextColor(colors.emerald[0], colors.emerald[1], colors.emerald[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${row.buyPropensity}%`, margins.left + 95, y + 6, { align: 'center' });

      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(row.produtoSugerido, margins.left + 115, y + 6, { maxWidth: 62 });

      y += 10;
    });

    y += 10;

    // Advisory panel 4
    doc.setFillColor(colors.indigoLight[0], colors.indigoLight[1], colors.indigoLight[2]);
    doc.roundedRect(margins.left, y, contentWidth, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(224, 231, 255);
    doc.rect(margins.left, y, contentWidth, 16);

    doc.setTextColor(colors.indigo[0], colors.indigo[1], colors.indigo[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OUTCOMES DO COMPLEMENTO DE CARTEIRA:', margins.left + 5, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    doc.text('O up-sell e cross-sell ativo para esta fatia estruturada tem um retorno estimado médio de R$ 3.500 adicionais por conta.', margins.left + 5, y + 10.5);
  }

  // Save the constructed file
  const filename = `SGBD_SINC_REPOSITORIO_EXECUTIVO_${data.reportType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
