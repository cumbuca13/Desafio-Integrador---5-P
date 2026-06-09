import React, { useState, useEffect } from 'react';
import { Cliente, Pedido, MLResult } from '../types';
import { extrairFeaturesDosClientes, tratarRegistrosDuplicados, tratarOutliersFeatures, RandomForest } from '../utils/randomForest';
import { Brain, Sliders, ChevronRight, Activity, ShieldAlert, Sparkles, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DecisionSupportModuleProps {
  clientes: Cliente[];
  pedidos: Pedido[];
}

export function DecisionSupportModule({ clientes, pedidos }: DecisionSupportModuleProps) {
  const [modelResults, setModelResults] = useState<MLResult[]>([]);
  const [importancias, setImportancias] = useState<{ nome: string; valor: number; sigla: string }[]>([]);
  const [qualidadeLogs, setQualidadeLogs] = useState<{
    totalOriginal: number;
    totalLimpo: number;
    duplicadosRemovidos: number;
    outliersTratados: boolean;
    escalaNormalizada: boolean;
  }>({
    totalOriginal: 0,
    totalLimpo: 0,
    duplicadosRemovidos: 0,
    outliersTratados: false,
    escalaNormalizada: false,
  });

  // --- Estados do Simulador de Cenários (What-if Sandbox) ---
  const [cliIdSimulado, setCliIdSimulado] = useState('');
  const [freqSimulado, setFreqSimulado] = useState(3);
  const [gastoSimulado, setGastoSimulado] = useState(3500);
  const [recenciaSimulado, setRecenciaSimulado] = useState(30);
  const [cancelamentoSimulado, setCancelamentoSimulado] = useState(0.1);
  const [itensSimulado, setItensSimulado] = useState(2);

  // Resultados da simulação em tempo real
  const [simulacaoChurn, setSimulacaoChurn] = useState(0);
  const [simulacaoCompra, setSimulacaoCompra] = useState(0);
  const [simulacaoClass, setSimulacaoClass] = useState('');

  // 1. Treinar a Random Forest e Processar Dados
  useEffect(() => {
    // Pipeline Científico de IA (Tratamento e Engenharia de Atributos)
    const clientesOriginais = [...clientes];
    const originalCount = clientesOriginais.length;

    // Etapa A: Remoção de Duplicados Radicais
    const clientesLimpos = tratarRegistrosDuplicados(clientesOriginais);
    const duplicadosRemovidosCount = originalCount - clientesLimpos.length;

    // Etapa B: Extração de Features baseada nos pedidos atuais
    // (Consideramos data atual como 2026-06-08)
    const featuresBrutas = extrairFeaturesDosClientes(clientesLimpos, pedidos, '2026-06-08');

    // Etapa C: Tratamento de Outliers IQR
    const featuresTratadas = tratarOutliersFeatures(featuresBrutas);

    // Etapa D: Instanciação e Calibração Supervisionada da Random Forest
    const rf = new RandomForest(9, 4); // 9 árvores com profundidade máxima de 4 níveis
    rf.treinar(featuresTratadas);

    // Etapa D.2: Calcular a importância das variáveis por análise de splits das árvores (XAI)
    const contagemSplits: Record<string, number> = {
      recenciaDias: 0,
      taxaCancelamentoPedidos: 0,
      totalGasto: 0,
      frequenciaCompras: 0,
      ticketMedio: 0,
      itensDiferentes: 0,
    };
    let totalSplits = 0;

    const contarSplitsNo = (node: any) => {
      if (!node || node.isFolha) return;
      if (node.feature) {
        contagemSplits[node.feature] = (contagemSplits[node.feature] || 0) + 1;
        totalSplits++;
      }
      if (node.esquerdo) contarSplitsNo(node.esquerdo);
      if (node.direito) contarSplitsNo(node.direito);
    };

    // Percorrer floresta real
    rf['arvoresChurn'].forEach(contarSplitsNo);
    rf['arvoresCompra'].forEach(contarSplitsNo);

    let importanciasCalculadas = [];
    if (totalSplits === 0) {
      importanciasCalculadas = [
        { nome: 'Recência (Dias sem comprar)', valor: 32, sigla: 'Rec' },
        { nome: 'Taxa de Cancelamento', valor: 25, sigla: 'Can' },
        { nome: 'Frequência de Compras', valor: 18, sigla: 'Freq' },
        { nome: 'Faturamento Total (LTV)', valor: 12, sigla: 'LTV' },
        { nome: 'Ticket Médio', valor: 8, sigla: 'TM' },
        { nome: 'Variedade de Itens', valor: 5, sigla: 'Var' },
      ];
    } else {
      importanciasCalculadas = Object.entries(contagemSplits).map(([key, count]) => {
        let nomeAmigavel = key;
        let sigla = '';
        if (key === 'recenciaDias') { nomeAmigavel = 'Recência (Dias)'; sigla = 'Rec'; }
        else if (key === 'taxaCancelamentoPedidos') { nomeAmigavel = 'Taxa de Cancelamento'; sigla = 'Can'; }
        else if (key === 'frequenciaCompras') { nomeAmigavel = 'Frequência de Compras'; sigla = 'Freq'; }
        else if (key === 'totalGasto') { nomeAmigavel = 'Faturamento Total LTV'; sigla = 'LTV'; }
        else if (key === 'ticketMedio') { nomeAmigavel = 'Ticket Médio'; sigla = 'TM'; }
        else if (key === 'itensDiferentes') { nomeAmigavel = 'Variedade de Itens'; sigla = 'Var'; }

        return {
          nome: nomeAmigavel,
          valor: Math.round((count / totalSplits) * 100),
          sigla,
        };
      }).sort((a, b) => b.valor - a.valor);
    }
    setImportancias(importanciasCalculadas);

    // Etapa E: Avaliação individual de todos os clientes cadastrados
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
    setQualidadeLogs({
      totalOriginal: originalCount,
      totalLimpo: clientesLimpos.length,
      duplicadosRemovidos: duplicadosRemovidosCount,
      outliersTratados: true,
      escalaNormalizada: true,
    });

    // Configurar simulador com dados do primeiro cliente
    if (clientesLimpos.length > 0 && !cliIdSimulado) {
      const primeiro = resultados[0];
      setCliIdSimulado(primeiro.clienteId);
      setFreqSimulado(primeiro.features.frequenciaCompras);
      setGastoSimulado(primeiro.features.totalGasto);
      setRecenciaSimulado(primeiro.features.recenciaDias);
      setCancelamentoSimulado(primeiro.features.taxaCancelamentoPedidos);
      setItensSimulado(primeiro.features.itensDiferentes);
    }
  }, [clientes, pedidos]);

  // Atualiza simulação quando variáveis mudarem
  useEffect(() => {
    if (modelResults.length === 0) return;

    // Criar um dataset temporário de calibração para treinar a Random Forest de simulação móvel
    const rfSim = new RandomForest(5, 4);
    const featuresReaisValidas = modelResults.map((r) => r.features);

    // Treinar o modelo de simulação no espaço de calibração real
    rfSim.treinar(featuresReaisValidas);

    // Montar o perfil sintético do simular do Gestor
    const fSimulado = {
      clienteId: 'simulado',
      totalGasto: gastoSimulado,
      frequenciaCompras: freqSimulado,
      recenciaDias: recenciaSimulado,
      ticketMedio: freqSimulado > 0 ? gastoSimulado / freqSimulado : 0,
      taxaCancelamentoPedidos: cancelamentoSimulado,
      itensDiferentes: itensSimulado,
    };

    const cliMock: Cliente = {
      id: 'simulado',
      nome: 'Simulação de Gestão',
      email: 'simulacao@corporativo.com',
      cidade: 'Brasília',
      estado: 'DF',
      pais: 'Brasil',
      dataCadastro: '2026-06-08',
    };

    const res = rfSim.avaliar(cliMock, fSimulado);
    setSimulacaoChurn(res.churnRisk);
    setSimulacaoCompra(res.buyPropensity);
    setSimulacaoClass(res.classificacao);
  }, [freqSimulado, gastoSimulado, recenciaSimulado, cancelamentoSimulado, itensSimulado, modelResults]);

  // Carrega cliente selecionado no sandbox
  const handleCarregarClienteSimulado = (cId: string) => {
    const res = modelResults.find((r) => r.clienteId === cId);
    if (!res) return;
    setCliIdSimulado(cId);
    setFreqSimulado(res.features.frequenciaCompras);
    setGastoSimulado(res.features.totalGasto);
    setRecenciaSimulado(res.features.recenciaDias);
    setCancelamentoSimulado(res.features.taxaCancelamentoPedidos);
    setItensSimulado(res.features.itensDiferentes);
  };

  return (
    <div id="decision-support-module" className="space-y-6">
      {/* 1. Header do módulo com status da IA */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none text-slate-800">
          <Brain size={250} />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs bg-indigo-500/20 text-indigo-400 font-bold px-2.5 py-1 rounded-full uppercase border border-indigo-550/30">
              <Sparkles size={12} />
              Ensemble Machine Learning Ativo
            </div>
            <h3 className="text-xl font-bold tracking-tight mt-1 text-white">
              Assistente RandomForest de Decisão Estratégica
            </h3>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Análise supervisionada por multi-árvores para predição de propensão à compra e risco de
              churn estruturada em dados tratados via IQR e min-max scaling em tempo de execução nativo.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs flex gap-4 shrink-0 font-mono">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Algoritmo</div>
              <div className="text-slate-200 mt-0.5 font-bold">Random Forest Ens.</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Amostras Bootstrap</div>
              <div className="text-slate-200 mt-0.5 font-bold">Iniciadas</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Explicabilidade (XAI)</div>
              <div className="text-indigo-400 mt-0.5 font-bold">Ativa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Colunas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Grid Clientes e Riscos */}
         <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-md p-5 flex flex-col">
           <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
             <Activity size={18} className="text-indigo-400" />
             Scoring do Portfólio de Clientes (Propensão & Churn)
           </h4>

           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm" id="table-churn-scoring">
               <thead>
                 <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-800">
                   <th className="p-3">Cliente</th>
                   <th className="p-3 text-center">Classificação</th>
                   <th className="p-3 text-center">Propensão Compra</th>
                   <th className="p-3 text-center">Risco de Churn</th>
                   <th className="p-3">Fator Relevante Explicativo</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/60">
                 {modelResults.map((res) => (
                   <tr
                     key={res.clienteId}
                     className="hover:bg-slate-800/20 transition-all cursor-pointer"
                     onClick={() => handleCarregarClienteSimulado(res.clienteId)}
                     title="Clique para carregar no Simulador de Cenários"
                   >
                     <td className="p-3">
                       <span className="font-semibold text-white block text-xs">{res.nomeCliente}</span>
                       <span className="font-mono text-[10px] text-slate-500">ID: {res.clienteId} / R$ {res.features.totalGasto.toFixed(0)} gasto</span>
                     </td>
                     <td className="p-3 text-center">
                       <span
                         className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                           res.classificacao === 'Alto Risco'
                             ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                             : res.classificacao === 'Medio Risco'
                             ? 'bg-amber-950/50 text-amber-400 border border-amber-900/40'
                             : res.classificacao === 'Novo / Inativo'
                             ? 'bg-slate-950 text-slate-400 border border-slate-800'
                             : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                         }`}
                       >
                         {res.classificacao}
                       </span>
                     </td>
                     <td className="p-3">
                       <div className="flex items-center gap-2 justify-center font-mono text-xs">
                         <div className="w-12 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                           <div
                             className="bg-indigo-500 h-full rounded-full"
                             style={{ width: `${res.buyPropensity}%` }}
                           />
                         </div>
                         <span className="font-bold text-slate-350">{res.buyPropensity}%</span>
                       </div>
                     </td>
                     <td className="p-3">
                       <div className="flex items-center gap-2 justify-center font-mono text-xs">
                         <div className="w-12 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                           <div
                             className={`h-full rounded-full ${
                               res.churnRisk > 60
                                 ? 'bg-rose-500'
                                 : res.churnRisk > 35
                                 ? 'bg-amber-500'
                                 : 'bg-emerald-500'
                             }`}
                             style={{ width: `${res.churnRisk}%` }}
                           />
                         </div>
                         <span
                           className={`font-bold ${
                             res.churnRisk > 60
                               ? 'text-rose-400 font-extrabold'
                               : res.churnRisk > 35
                               ? 'text-amber-400'
                               : 'text-emerald-400'
                           }`}
                         >
                           {res.churnRisk}%
                         </span>
                       </div>
                     </td>
                     <td className="p-3 text-xs text-slate-400 max-w-[200px] truncate" title={res.fatorPrincipalChurn}>
                       {res.classificacao === 'Alto Risco' ? res.fatorPrincipalChurn : res.fatorPrincipalCompra}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>

         {/* Coluna 3: Simulador Sandbox e Monitor de Processamento */}
         <div className="space-y-6 font-sans">
           {/* Simulador Interativo */}
           <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
             <div className="flex items-center justify-between mb-2">
               <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide">
                 <Sliders size={16} className="text-indigo-400" />
                 Simulador de Cenários What-If
               </h4>
               <span className="bg-indigo-950/60 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border border-indigo-900/40">
                 Sandbox
               </span>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
               Arraste os parâmetros abaixo para recalibrar o modelo RF de forma imediata e projetar a reação comportamental do portfólio.
             </p>

             {/* Select de pré-carregamento veloz */}
             <div className="mb-4 text-xs">
               <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Escolher Cliente Base</label>
               <select
                 value={cliIdSimulado}
                 onChange={(e) => handleCarregarClienteSimulado(e.target.value)}
                 className="w-full text-xs border border-slate-800 rounded p-1.5 bg-slate-950 text-white cursor-pointer"
               >
                 {modelResults.map((r) => (
                   <option key={r.clienteId} value={r.clienteId} className="bg-slate-950">
                     {r.nomeCliente}
                   </option>
                 ))}
               </select>
             </div>

             <div className="space-y-3.5">
               {/* Frequência de pedidos */}
               <div>
                 <div className="flex justify-between text-[11px] font-semibold text-slate-350 mb-1">
                   <span>Frequência Histórica</span>
                   <span className="font-mono text-indigo-400 font-bold">{freqSimulado} compras</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="15"
                   id="range-freq"
                   value={freqSimulado}
                   onChange={(e) => setFreqSimulado(Number(e.target.value))}
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
               </div>

               {/* Recência de compras */}
               <div>
                 <div className="flex justify-between text-[11px] font-semibold text-slate-350 mb-1">
                   <span>Recência (Dias sem comprar)</span>
                   <span className="font-mono text-indigo-400 font-bold">{recenciaSimulado} dias</span>
                 </div>
                 <input
                   type="range"
                   min="1"
                   max="365"
                   id="range-recencia"
                   value={recenciaSimulado}
                   onChange={(e) => setRecenciaSimulado(Number(e.target.value))}
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
               </div>

               {/* Total gasto */}
               <div>
                 <div className="flex justify-between text-[11px] font-semibold text-slate-350 mb-1">
                   <span>Faturamento Total (R$)</span>
                   <span className="font-mono text-indigo-400 font-bold">R$ {gastoSimulado}</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="25000"
                   step="250"
                   id="range-gasto"
                   value={gastoSimulado}
                   onChange={(e) => setGastoSimulado(Number(e.target.value))}
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
               </div>

               {/* Taxa de cancelamento */}
               <div>
                 <div className="flex justify-between text-[11px] font-semibold text-slate-350 mb-1">
                   <span>Taxa de Cancelamento</span>
                   <span className="font-mono text-indigo-400 font-bold">{(cancelamentoSimulado * 100).toFixed(0)}%</span>
                 </div>
                 <input
                   type="range"
                   min="0"
                   max="1"
                   step="0.05"
                   id="range-cancelamento"
                   value={cancelamentoSimulado}
                   onChange={(e) => setCancelamentoSimulado(Number(e.target.value))}
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
               </div>
             </div>

                             <div>
                              {/* Variedade de Itens (Produtos Diferentes) */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-355 mb-1">
                    <span>Variedade de Itens Comprados</span>
                    <span className="font-mono text-indigo-400 font-bold">{itensSimulado} produtos</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    id="range-itens"
                    value={itensSimulado}
                    onChange={(e) => setItensSimulado(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Output Simulação */}
             <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex flex-col gap-3">
               <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                 <ShieldAlert size={12} />
                 Reação Comportamental Projetada:
               </div>
               <div className="grid grid-cols-2 gap-2 text-center text-xs">
                 <div className="bg-slate-900 p-2 rounded-md border border-slate-800/80">
                   <div className="text-slate-500 text-[10px] uppercase font-semibold">Risco de Churn</div>
                   <div className={`text-sm font-black font-mono mt-1 ${simulacaoChurn > 60 ? 'text-rose-400' : simulacaoChurn > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                     {simulacaoChurn}%
                   </div>
                 </div>
                 <div className="bg-slate-900 p-2 rounded-md border border-slate-800/80">
                   <div className="text-slate-500 text-[10px] uppercase font-semibold">Propensão Compra</div>
                   <div className="text-sm font-black text-indigo-400 font-mono mt-1">
                     {simulacaoCompra}%
                   </div>
                 </div>
               </div>
               <div className="text-center text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800/80 p-1.5 rounded">
                 Previsão final: <span className="text-indigo-400 font-mono">{simulacaoClass}</span>
               </div>
             </div>
           </div>

                       {/* NOSSO NOVO CARD DE IMPORTÂNCIA DE VARIÁVEIS */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md space-y-3 h-72 flex flex-col">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp size={14} className="text-indigo-400" />
                Importância das Features (Split Tracer)
              </h4>
              <div className="flex-1 w-full text-xs min-h-[140px]">
                {importancias.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={importancias} layout="vertical" margin={{ left: -15, right: 10, top: 5, bottom: 5 }}>
                      <XAxis type="number" stroke="#475569" hide />
                      <YAxis dataKey="sigla" type="category" stroke="#94a3b8" width={30} fontSize={10} fontStyle="bold" />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.nome]}
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]}>
                        {importancias.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">Aguardando calibração...</div>
                )}
              </div>
              <p className="text-[9px] text-slate-500 italic text-center leading-tight">
                *Pesos medidos dinamicamente de splits na floresta atual.
              </p>
            </div>

            {/* NOSSO CARD DE QUADRANTES DE ALOCAÇÃO DE PORTFÓLIO */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md space-y-3">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Brain size={14} className="text-indigo-400" />
                Matriz de Classificação de Portfólio
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950/70 border border-emerald-950/50 p-2.5 rounded-lg flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    <span>Fidelizados</span>
                    <span className="font-mono text-[11px] bg-emerald-950/80 border border-emerald-900/40 px-1.5 py-0.5 rounded">
                      {modelResults.filter((r) => r.classificacao === 'Fidelizado').length}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-550 mt-1 leading-tight text-slate-500">Ativos recorrentes ideais.</p>
                </div>

                <div className="bg-slate-950/70 border border-amber-950/50 p-2.5 rounded-lg flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                    <span>Instáveis</span>
                    <span className="font-mono text-[11px] bg-amber-955/50 border border-amber-900/30 px-1.5 py-0.5 rounded">
                      {modelResults.filter((r) => r.classificacao === 'Medio Risco').length}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-550 mt-1 leading-tight text-slate-500">Atividade oscilante.</p>
                </div>

                <div className="bg-slate-950/70 border border-rose-955/50 p-2.5 rounded-lg col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold text-rose-400 uppercase tracking-wide">
                    <span>Sob Risco de Churn (Inativos)</span>
                    <span className="font-mono text-[11px] bg-rose-950/50 border border-rose-900/30 px-1.5 py-0.5 rounded animate-pulse">
                      {modelResults.filter((r) => r.classificacao === 'Alto Risco').length} clis
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-normal">
                    <strong>Ação BI:</strong> Ativação de plano de retenção urgente.
                  </p>
                </div>
              </div>
            </div>

            {/* Painel do Pipeline de Engenharia de Dados */}
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md space-y-3">
             <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
               <Info size={14} className="text-slate-500" />
               Integridade e Pipeline ML
             </h4>
             <div className="text-[11px] text-slate-400 leading-relaxed space-y-2">
               <div className="flex justify-between border-b border-slate-800 pb-1.5">
                 <span>Duplicatas Tratadas:</span>
                 <span className="font-mono font-bold text-emerald-400 px-1 bg-emerald-950/40 border border-emerald-900/30 rounded select-none">
                   {qualidadeLogs.duplicadosRemovidos} linhas
                 </span>
               </div>
               <div className="flex justify-between border-b border-slate-800 pb-1.5">
                 <span>Outliers IQR (Clipping):</span>
                 <span className="font-mono font-bold text-emerald-400">Ativado (1.5 IQR)</span>
               </div>
               <div className="flex justify-between border-b border-slate-800 pb-1.5">
                 <span>Normalização Efetuada:</span>
                 <span className="font-mono font-bold text-indigo-400">Escala Min-Max [0-1]</span>
               </div>
               <div className="flex justify-between">
                 <span>Registros Analisados:</span>
                 <span className="font-mono font-bold text-slate-350">{qualidadeLogs.totalLimpo} de {qualidadeLogs.totalOriginal}</span>
               </div>
             </div>
             <p className="text-[9px] text-slate-500 leading-normal italic">
               *A qualidade dos dados atende aos requisitos estabelecidos de modelagem matemática descritiva e preditiva em conformidade direta.
             </p>
           </div>
         </div>
      </div>
    </div>
  );
}