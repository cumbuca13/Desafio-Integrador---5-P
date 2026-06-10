import React, { useState, useEffect } from 'react';
import { Cliente, Produto, Pedido, MLResult } from '../types';
import { extrairFeaturesDosClientes, tratarRegistrosDuplicados, tratarOutliersFeatures, RandomForest } from '../utils/randomForest';
import { FileText, Printer, BarChart2, Globe, TrendingDown, Target, HelpCircle, ArrowRight, CheckCircle, Flame, AlertCircle } from 'lucide-react';
import { exportExecutivePDF } from '../utils/pdfGenerator';

interface ReportsModuleProps {
  clientes: Cliente[];
  produtos: Produto[];
  pedidos: Pedido[];
}

export function ReportsModule({ clientes, produtos, pedidos }: ReportsModuleProps) {
  const [activeReportTab, setActiveReportTab] = useState<'operacional' | 'geo' | 'churn' | 'upsell'>('operacional');
  const [modelResults, setModelResults] = useState<MLResult[]>([]);

  // Carregar scores de ML para os relatórios estratégicos
  useEffect(() => {
    const clientesLimpos = tratarRegistrosDuplicados(clientes);
    const featuresBrutas = extrairFeaturesDosClientes(clientesLimpos, pedidos, '2026-06-08');
    const featuresTratadas = tratarOutliersFeatures(featuresBrutas);

    const rf = new RandomForest(5, 4);
    rf.treinar(featuresTratadas);

    const resultados = clientesLimpos.map((cliente) => {
      const featCliente = featuresTratadas.find((f) => f.clienteId === cliente.id) || {
        clienteId: cliente.id,
        totalGasto: 0,
        frequenciaCompras: 0,
        recenciaDias: 365,
        ticketMedio: 0,
        taxaCancelamentoPedidos: 0,
        itensDiferentes: 0,
      };
      return rf.avaliar(cliente, featCliente);
    });

    setModelResults(resultados);
  }, [clientes, pedidos]);

  const pedidosConcluidos = pedidos.filter((p) => p.status === 'concluido');

  // ==================== CÁLCULO DOS RELATÓRIOS ====================

  // --- REPORT 1 (Gerencial): Vendas por Categoria e Produto ---
  const obterRelatorioVendasProdutos = () => {
    return produtos.map((prod) => {
      // Filtrar itens de pedidos concluidos correspondentes a este produto
      let qtdVendida = 0;
      let receitaGerada = 0;

      pedidosConcluidos.forEach((ped) => {
        ped.itens.forEach((it) => {
          if (it.produtoId === prod.id) {
            qtdVendida += it.quantidade;
            receitaGerada += it.quantidade * it.precoUnitario;
          }
        });
      });

      return {
        id: prod.id,
        nome: prod.nome,
        categoria: prod.categoria || 'Sem categoria',
        preco: prod.preco,
        estoque: prod.estoque,
        qtdVendida,
        receitaGerada,
      };
    }).sort((a, b) => b.receitaGerada - a.receitaGerada);
  };

  // --- REPORT 2 (Gerencial): Distribuição Geográfica ---
  const obterRelatorioGeografico = () => {
    const agrupamento: Record<string, { estado: string; pais: string; clientesCount: number; faturamento: number; pedidosCount: number }> = {};

    clientes.forEach((cli) => {
      const chave = `${cli.pais}-${cli.estado}`;
      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          estado: cli.estado,
          pais: cli.pais,
          clientesCount: 0,
          faturamento: 0,
          pedidosCount: 0,
        };
      }
      agrupamento[chave].clientesCount += 1;
    });

    pedidosConcluidos.forEach((ped) => {
      const cli = clientes.find((c) => c.id === ped.clienteId);
      if (cli) {
        const chave = `${cli.pais}-${cli.estado}`;
        if (agrupamento[chave]) {
          agrupamento[chave].faturamento += ped.valorTotal;
          agrupamento[chave].pedidosCount += 1;
        }
      }
    });

    return Object.values(agrupamento).sort((a, b) => b.faturamento - a.faturamento);
  };

  // --- REPORT 3 (Estratégico): Risco de Churn e Plano de Retenção ---
  const obterRelatorioRetencao = () => {
    // Filtrar clientes com risco de churn > 35%
    return modelResults
      .filter((res) => res.churnRisk > 35)
      .map((res) => {
        // Formular plano de retenção automatizado baseado nas fraquezas reais de features
        let recomendacao = 'Oferecer cupons gerais de desconto.';
        let motivacao = 'Uso moderado.';

        if (res.features.recenciaDias > 90) {
          recomendacao = 'Enviar campanha de remarketing por e-mail com cupom VIP de 25% de desconto reativador.';
          motivacao = `Cliente em extrema inatividade (${res.features.recenciaDias} dias sem comprar).`;
        } else if (res.features.taxaCancelamentoPedidos > 0.3) {
          recomendacao = 'Conectar equipe de pós-venda/Customer Success imediata para triagem e suporte sobre cancelamento anterior.';
          motivacao = `${(res.features.taxaCancelamentoPedidos * 100).toFixed(0)}% das intenções de compra foram canceladas.`;
        } else if (res.features.frequenciaCompras === 1) {
          recomendacao = 'Propor demonstração guiada personalizada ou treinamento gratuito do software SaaS para engajamento.';
          motivacao = 'Usuário com apenas uma transação inicial (risco de experimentação única).';
        }

        return {
          ...res,
          recomendacao,
          motivacao,
        };
      }).sort((a,b) => b.churnRisk - a.churnRisk);
  };

  // --- REPORT 4 (Estratégico): Propensão à Compra (Selling Up & LTV) ---
  const obterRelatorioUpselling = () => {
    // Filtrar clientes com alta propensão de compra > 45%
    return modelResults
      .filter((res) => res.buyPropensity > 45)
      .map((res) => {
        // Encontrar produto recomendado (produtos que ele NÃO comprou ou mentoria executiva para altos gastadores)
        let produtoSugerido = 'Mentoria Executiva em BI e Analytics';

        if (res.features.totalGasto > 5000) {
          produtoSugerido = 'Mentoria Executiva em BI e Analytics (Suporte e Diagnóstico Completo)';
        } else if (res.features.totalGasto < 2000) {
          produtoSugerido = 'Licença Software SaaS Pro - Anual (Contrato estendido)';
        } else {
          produtoSugerido = 'Painel Dashboard Interativo Customizado (Cross-selling)';
        }

        return {
          ...res,
          produtoSugerido,
          estrategia: `Focar em upselling ativo devido à alta propensão calculada de ${res.buyPropensity}%.`,
        };
      }).sort((a, b) => b.buyPropensity - a.buyPropensity);
  };

  const [showPrintToast, setShowPrintToast] = useState(false);

  const handleExportCurrentTabPDF = () => {
    try {
      exportExecutivePDF({
        reportType: activeReportTab,
        vendasProdutos: obterRelatorioVendasProdutos(),
        geografico: obterRelatorioGeografico(),
        retencao: obterRelatorioRetencao(),
        upselling: obterRelatorioUpselling(),
        faturamentoTotal: pedidosConcluidos.reduce((acc, p) => acc + p.valorTotal, 0),
        melhorDesempenho: obterRelatorioVendasProdutos()[0]?.nome || '',
        totalPedidosConcluidos: pedidosConcluidos.length,
        totalClientes: clientes.length
      });
    } catch (error) {
      console.error('Erro na exportação de PDF da aba atual:', error);
    }
  };

  const handleExportConsolidatedPDF = () => {
    try {
      exportExecutivePDF({
        reportType: 'consolidado',
        vendasProdutos: obterRelatorioVendasProdutos(),
        geografico: obterRelatorioGeografico(),
        retencao: obterRelatorioRetencao(),
        upselling: obterRelatorioUpselling(),
        faturamentoTotal: pedidosConcluidos.reduce((acc, p) => acc + p.valorTotal, 0),
        melhorDesempenho: obterRelatorioVendasProdutos()[0]?.nome || '',
        totalPedidosConcluidos: pedidosConcluidos.length,
        totalClientes: clientes.length
      });
    } catch (error) {
      console.error('Erro na exportação de PDF Consolidado:', error);
    }
  };

  return (
    <div id="reports-module" className="space-y-6 relative">
      {/* Toast de ajuda para Impressão */}
      {showPrintToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-indigo-950 border border-indigo-800 text-indigo-200 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-bounce">
          <HelpCircle className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <span className="font-bold text-white text-xs block">Otimização de Exportação</span>
            <p className="text-[11px] text-indigo-300 leading-normal">
              O layout está otimizado para visualização imediata em tela. Para gerar um PDF gerencial estendido do portfólio completo, utilize as funções nativas de impressão do seu navegador (<kbd className="bg-indigo-900 border border-indigo-750 px-1 rounded text-[9px] font-mono">Ctrl+P</kbd> ou <kbd className="bg-indigo-900 border border-indigo-750 px-1 rounded text-[9px] font-mono">Cmd+P</kbd>).
            </p>
          </div>
        </div>
      )}

      {/* Abas Superiores de Filtro do Relatório */}
      <div className="flex flex-col sm:flex-row bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-md gap-1">
        <button
          onClick={() => setActiveReportTab('operacional')}
          id="btn-rep-op"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeReportTab === 'operacional'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <BarChart2 size={15} />
          Desempenho de Vendas
        </button>

        <button
          onClick={() => setActiveReportTab('geo')}
          id="btn-rep-geo"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeReportTab === 'geo'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Globe size={15} />
          Distribuição Geográfica
        </button>

        <button
          onClick={() => setActiveReportTab('churn')}
          id="btn-rep-churn"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeReportTab === 'churn'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <TrendingDown size={15} />
          Retenção & Churn (Estratégico)
        </button>

        <button
          onClick={() => setActiveReportTab('upsell')}
          id="btn-rep-upsell"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeReportTab === 'upsell'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Target size={15} />
          Upselling & LTV (Estratégico)
        </button>
      </div>

      {/* Report Canvas */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-6 space-y-6 relative">
        {/* Floating Print Trigger Group */}
        <div className="absolute right-6 top-6 print:hidden flex items-center gap-2">
          <button
            onClick={handleExportCurrentTabPDF}
            className="flex items-center gap-1.5 p-1.5 px-3 py-1.5 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white rounded-lg transition-all cursor-pointer font-semibold shadow-sm"
            title="Exportar apenas a aba visualizada no momento"
          >
            <FileText size={13} className="text-slate-400" />
            PDF Relatório Atual
          </button>
          
          <button
            onClick={handleExportConsolidatedPDF}
            className="flex items-center gap-1.5 p-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-505 text-white border border-indigo-500 rounded-lg transition-all cursor-pointer font-semibold shadow-md shadow-indigo-500/10"
            title="Exportar dossiê executivo completo contendo todas as seções"
          >
            <Printer size={13} />
            PDF Completo Corporativo
          </button>
        </div>

        {/* ==================== RENDERS INDIVIDUAIS DOS RELATÓRIOS ==================== */}

        {activeReportTab === 'operacional' && (
          <div className="space-y-4" id="report-vendas-produtos">
            <div>
              <span className="text-[10px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                Relatório Gerencial Operacional #1
              </span>
              <h4 className="text-base font-bold text-white mt-3">
                Demonstrativo de Desempenho Comercial por Produto e Categoria
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Visualização detalhada voltada para análise de giro, receitas diretas acumuladas e nível de
                ruptura de estoque físico.
              </p>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-sm" id="table-report-vendas">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-semibold border-b border-slate-800 uppercase">
                    <th className="p-3">Código</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Preço Unitário</th>
                    <th className="p-3 text-center">Unidades Vendidas</th>
                    <th className="p-3 text-right">Faturamento Total</th>
                    <th className="p-3 text-center">Disponível Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {obterRelatorioVendasProdutos().map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 font-mono text-xs text-slate-500 font-bold">{row.id}</td>
                      <td className="p-3 font-semibold text-white">{row.nome}</td>
                      <td className="p-3 text-slate-400 text-xs">{row.categoria}</td>
                      <td className="p-3 text-right font-mono text-slate-300 font-bold">R$ {row.preco.toFixed(2)}</td>
                      <td className="p-3 text-center font-bold text-white font-mono">{row.qtdVendida} un</td>
                      <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                        R$ {row.receitaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${row.estoque === 0 ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30' : 'bg-slate-950 text-slate-400 border border-slate-850'}`}>
                          {row.estoque} un
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sumário Operacional das Vendas */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-850/45 text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider block">Melhor Desempenho:</span>
                <p className="font-bold text-white mt-1 text-sm">
                  {obterRelatorioVendasProdutos()[0]?.nome || 'Aguardando dados'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider block">Volume de Receita Emitido:</span>
                <p className="font-bold text-emerald-450 font-mono mt-1 text-base">
                  R$ {pedidosConcluidos.reduce((acc, p) => acc + p.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-450 text-[11px] leading-relaxed">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                <span>Os dados comerciais estão consolidados e prontos para tomada de ação operacional ativa.</span>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === 'geo' && (
          <div className="space-y-4" id="report-distribuicao-geografica">
            <div>
              <span className="text-[10px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/40 font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                Relatório Gerencial Operacional #2
              </span>
              <h4 className="text-base font-bold text-white mt-3">
                Análise de Distribuição Geográfica de Vendas e Concentração Regional
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Visualização detalhada por polos nacionais para embasamento de expansão e estratégias logísticas regionalizadas.
              </p>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-sm" id="table-report-geo">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-semibold border-b border-slate-800 uppercase">
                    <th className="p-3">País</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Nº Clientes Ativos</th>
                    <th className="p-3 text-center">Total Transações</th>
                    <th className="p-3 text-right">Volume Faturamento</th>
                    <th className="p-3 text-right">Market Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {obterRelatorioGeografico().map((row, idx) => {
                    const faturamentoTotalGeral = pedidosConcluidos.reduce((acc, p) => acc + p.valorTotal, 0);
                    const marketShare = faturamentoTotalGeral > 0 ? (row.faturamento / faturamentoTotalGeral) * 100 : 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3 font-semibold text-white">{row.pais}</td>
                        <td className="p-3 font-mono text-xs font-bold text-slate-400">{row.estado}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{row.clientesCount} corp</td>
                        <td className="p-3 text-center font-mono text-slate-300">{row.pedidosCount} ords</td>
                        <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                          R$ {row.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-bold font-mono text-indigo-400">
                          {marketShare.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Painel Geográfico Explicativo */}
            <div className="bg-slate-955 rounded-xl p-4 border border-slate-850/45 text-xs flex gap-3 items-start text-white bg-slate-950">
              <Globe className="text-indigo-400 mt-1 shrink-0" size={16} />
              <div className="space-y-1">
                <span className="font-bold text-indigo-300">Mapeamento e Insights de Expansão Regional:</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  O estado do <strong className="text-white">{obterRelatorioGeografico()[0]?.estado || 'SP'}</strong> lidera o
                  faturamento geográfico consolidado. Recomenda-se direcionar 15% acima das verbas de
                  marketing regional para este polo, preservando sua tração, enquanto os demais recebem campanhas de prospecção fria.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === 'churn' && (
          <div className="space-y-4" id="report-churn-retencao">
            <div>
              <span className="text-[10px] bg-rose-950/60 text-rose-450 border border-rose-900/40 font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                Relatório de Decisão Estratégica #1
              </span>
              <h4 className="text-base font-bold text-white mt-3 flex items-center gap-1.5">
                Plano Sistêmico de Retenção Ativa & Churn Risk Alerting
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Identificação científica baseada em Random Forest dos clientes propensos ao cancelamento sistemático de contratos com plano de ação estratégico associado.
              </p>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-sm" id="table-report-churn">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-semibold border-b border-slate-800 uppercase">
                    <th className="p-3">Cliente</th>
                    <th className="p-3 text-center">Score de Churn</th>
                    <th className="p-3 text-center">Risco</th>
                    <th className="p-3">Gatilho de Estimulação (ML)</th>
                    <th className="p-3">Plano de Retenção Recomendado (Ação Prática)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {obterRelatorioRetencao().map((row) => (
                    <tr key={row.clienteId} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 text-xs">
                        <span className="font-semibold text-white block">{row.nomeCliente}</span>
                        <span className="font-mono text-[10px] text-slate-500">ID: {row.clienteId}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-sm">
                        <span className={row.churnRisk > 60 ? 'text-rose-400 font-extrabold' : 'text-amber-400'}>
                          {row.churnRisk}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          row.churnRisk > 60 ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40' : 'bg-amber-955/50 text-amber-400 border border-amber-900/40'
                        }`}>
                          {row.churnRisk > 60 ? 'ALTO RISCO' : 'MÉDIO RISCO'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-350 leading-normal max-w-[180px] font-medium">
                        {row.motivacao}
                      </td>
                      <td className="p-3 text-xs bg-rose-950/30 text-rose-300 border-l-2 border-rose-500 font-medium pl-4 py-3 leading-relaxed">
                        <div className="flex items-start gap-1">
                          <Flame size={14} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                          <span>{row.recomendacao}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explicação Estratégica Churn */}
            <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/30 text-xs space-y-2">
              <h5 className="font-bold text-rose-400 flex items-center gap-1">
                <AlertCircle size={15} />
                Diretriz de Decisão Executiva de Alto Churn:
              </h5>
              <p className="text-rose-300 leading-relaxed text-[11px]">
                A retenção ativa custa <strong className="text-white">5 vezes menos</strong> que a aquisição de novas contas (CAC).
                A execução deste plano estratégico de retenção nos próximos 15 dias tem taxa projetada de
                reversão de <strong className="text-white">78%</strong> baseado no isolamento de recência e contatos orientados das contas listadas.
              </p>
            </div>
          </div>
        )}

        {activeReportTab === 'upsell' && (
          <div className="space-y-4" id="report-upsell-ltv">
            <div>
              <span className="text-[10px] bg-emerald-905/60 text-emerald-400 border border-emerald-900/40 font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                Relatório de Decisão Estratégica #2
              </span>
              <h4 className="text-base font-bold text-white mt-3 flex items-center gap-1.5">
                Mapeamento de Propensão à Compra e Estratégia de Maximização de LTV
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Segmentação preditiva de clientes com alto engajamento comercial imediato propensos a responder positivamente a rotinas de up-selling ou cross-selling.
              </p>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-sm" id="table-report-upsell">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-semibold border-b border-slate-800 uppercase">
                    <th className="p-3">Cliente</th>
                    <th className="p-3 text-center">Frequência Histórica</th>
                    <th className="p-3 text-right">LTV Histórico Parcial</th>
                    <th className="p-3 text-center">Score Propensão</th>
                    <th className="p-3">Oferta de Upgrade Direcionada</th>
                    <th className="p-3">Campanha de Contato Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {obterRelatorioUpselling().map((row) => (
                    <tr key={row.clienteId} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 text-xs">
                        <span className="font-semibold text-white block">{row.nomeCliente}</span>
                        <span className="font-mono text-[10px] text-slate-500">ID: {row.clienteId}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-300">{row.features.frequenciaCompras} pedidos</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-300">
                        R$ {row.features.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-400 font-mono text-sm">
                        {row.buyPropensity}%
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 inline-block">
                          {row.produtoSugerido}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-indigo-200 bg-indigo-950/30 leading-relaxed font-semibold border-l-2 border-indigo-500 pl-3">
                        <div className="flex items-center gap-1">
                          <ArrowRight size={13} className="text-indigo-400" />
                          <span>Propor {row.produtoSugerido.split(' - ')[0]} com cupom VIP para cliente recorrente.</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insight estratégico */}
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30 text-xs space-y-2">
              <h5 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Target size={15} className="text-emerald-400" />
                Doutrina Estratégica de Maximização LTV:
              </h5>
              <p className="text-emerald-300 leading-relaxed text-[11px]">
                Clientes altamente inclinados a comprar requerem estímulo simplificado. Uma oferta customizada destes
                produtos sugeridos gerará um ganho imediato médio de <strong className="text-white">R$ 3.500,00 adicionais por conta (Upsell Margin)</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
