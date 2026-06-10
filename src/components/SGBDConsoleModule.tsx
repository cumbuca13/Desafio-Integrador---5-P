import React, { useState, useEffect } from 'react';
import { Cliente, Produto, Pedido } from '../types';
import { executeVirtualSQL, SQLResult } from '../utils/sqlEngine';
import { 
  Database, 
  Terminal, 
  Play, 
  BookOpen, 
  Layers, 
  Key, 
  HelpCircle, 
  Check, 
  X, 
  Clock, 
  FileSpreadsheet,
  Network
} from 'lucide-react';

interface SGBDConsoleModuleProps {
  clientes: Cliente[];
  produtos: Produto[];
  pedidos: Pedido[];
  persistenceMode: 'local' | 'fullstack';
  serverUrl?: string;
}

export function SGBDConsoleModule({ clientes, produtos, pedidos, persistenceMode, serverUrl }: SGBDConsoleModuleProps) {
  // Queries educacionais pré-definidas para facilidade do aluno
  const PRESET_QUERIES = [
    {
      title: "1. Listar Clientes por Estado",
      query: "SELECT id, nome, cidade, estado, pais FROM clientes ORDER BY estado ASC",
      desc: "Demonstra projeção, ordenação e filtros de tabelas do SGBD.",
    },
    {
      title: "2. Portfólio de Alta Margem",
      query: "SELECT nome, preco, estoque, categoria FROM produtos WHERE preco > 1500 ORDER BY preco DESC",
      desc: "Consulta filtrada com operador relacional (>) e ordenação decrescente.",
    },
    {
      title: "3. Pedidos Faturados Recentes",
      query: "SELECT id, nomeCliente, valorTotal, status FROM pedidos WHERE status = 'concluido' ORDER BY valorTotal DESC",
      desc: "Filtros de status de faturamento e ranqueamento de ticket-médio.",
    },
    {
      title: "4. Junção Relacional (JOIN Clientes + Pedidos)",
      query: "SELECT clientes.nome, pedidos.id, pedidos.valorTotal, pedidos.status FROM clientes JOIN pedidos ON clientes.id = pedidos.clienteId",
      desc: "Resolução de chave estrangeira (FK) clienteId conectando Clientes às Vendas.",
    },
    {
      title: "5. Agrupamento & Faturamento por Categoria (GROUP BY)",
      query: "SELECT categoria, COUNT(*) AS total_pedidos, SUM(valorTotal) AS faturamento_total FROM pedidos GROUP BY categoria",
      desc: "Visão analítica avançada compilando métricas de agregação COUNT e SUM em grupos.",
    }
  ];

  const [customQuery, setCustomQuery] = useState(PRESET_QUERIES[0].query);
  const [sqlResult, setSqlResult] = useState<SQLResult | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  // Executar SQL virtual
  const handleExecuteSQL = (queryToRun: string) => {
    const res = executeVirtualSQL(queryToRun, { clientes, produtos, pedidos });
    setSqlResult(res);
  };

  // Carregar query padrão inicial
  useEffect(() => {
    handleExecuteSQL(customQuery);
  }, [clientes, produtos, pedidos]);

  const selectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setCustomQuery(PRESET_QUERIES[index].query);
    handleExecuteSQL(PRESET_QUERIES[index].query);
  };

  return (
    <div id="sgbd-console-module" className="space-y-6">
      
      {/* Top Banner de Infraestrutura Relevante */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/70 border border-indigo-900/50 p-1 px-2.5 rounded-md inline-block">
            Módulo Acadêmico de Banco de Dados
          </span>
          <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <Database size={18} className="text-indigo-400" />
            SGBD Virtual & Engenharia de Persistência Relacional
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Este terminal permite a resolução de consultas estruturadas de banco de dados diretamente nos dados corporativos mapeados. Ele valida o requisito acadêmico de <strong>Modelagem de Dados Relacional e Consultas SQL via SGBD</strong>.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block leading-none">
              Persistência de Estado
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 block leading-tight">
              {persistenceMode === 'fullstack' ? 'Full-Stack (NestJS Server + DB)' : 'Local Engine Ativo'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Modelo DER + Terminal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Lado Esquerdo: Modelo Relacional DER (4 colunas) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Network size={16} className="text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest">
                Diagrama Entidade-Relacionamento (DER)
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Tabela Clientes */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all">
                <span className="font-mono font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider mb-2">
                  <Database size={11} />
                  tb_clientes
                </span>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-indigo-300 font-bold">
                    <Key size={10} className="text-amber-400" />
                    <span>id [PK]</span>
                  </div>
                  <span className="text-slate-500 text-right">VARCHAR(50)</span>
                  
                  <span>nome</span>
                  <span className="text-slate-500 text-right">VARCHAR(100)</span>
                  
                  <span>email</span>
                  <span className="text-slate-500 text-right">VARCHAR(100)</span>
                  
                  <span>cidade</span>
                  <span className="text-slate-500 text-right">VARCHAR(50)</span>
                  
                  <span>estado</span>
                  <span className="text-slate-500 text-right">CHAR(2)</span>
                </div>
              </div>

              {/* Tabela Produtos */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all">
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider mb-2">
                  <Database size={11} />
                  tb_produtos
                </span>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-emerald-300 font-bold">
                    <Key size={10} className="text-amber-400" />
                    <span>id [PK]</span>
                  </div>
                  <span className="text-slate-500 text-right">VARCHAR(50)</span>
                  
                  <span>nome</span>
                  <span className="text-slate-500 text-right">VARCHAR(120)</span>
                  
                  <span>preco</span>
                  <span className="text-slate-500 text-right">DECIMAL(10,2)</span>
                  
                  <span>estoque</span>
                  <span className="text-slate-500 text-right">INT</span>
                </div>
              </div>

              {/* Tabela Pedidos */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all relative">
                <span className="font-mono font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider mb-2">
                  <Database size={11} />
                  tb_pedidos
                </span>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-blue-300 font-bold">
                    <Key size={10} className="text-amber-400" />
                    <span>id [PK]</span>
                  </div>
                  <span className="text-slate-500 text-right">VARCHAR(50)</span>

                  <div className="flex items-center gap-1 text-indigo-400 pl-1">
                    <span className="border-l border-slate-700 h-2 mr-0.5" />
                    <span>clienteId [FK]</span>
                  </div>
                  <span className="text-slate-500 text-right italic font-sans text-[9px]">ref tb_clientes.id</span>
                  
                  <span>data</span>
                  <span className="text-slate-500 text-right">DATE</span>
                  
                  <span>valorTotal</span>
                  <span className="text-slate-500 text-right">DECIMAL(10,2)</span>
                  
                  <span>status</span>
                  <span className="text-slate-550 text-right">VARCHAR(20)</span>
                </div>
              </div>

              {/* Tabela de Ligação / Aplanador N:M */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all">
                <span className="font-mono font-bold text-pink-400 flex items-center gap-1 uppercase tracking-wider mb-2">
                  <Database size={11} />
                  tb_itens_pedido
                </span>
                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-blue-400">
                    <Key size={10} className="text-amber-600" />
                    <span>pedidoId [PK, FK]</span>
                  </div>
                  <span className="text-slate-505 text-right italic font-sans text-[9px]">ref tb_pedidos.id</span>

                  <div className="flex items-center gap-1 text-emerald-400">
                    <Key size={10} className="text-amber-600" />
                    <span>produtoId [PK, FK]</span>
                  </div>
                  <span className="text-slate-505 text-right italic font-sans text-[9px]">ref tb_produtos.id</span>
                  
                  <span>quantidade</span>
                  <span className="text-slate-500 text-right">INT</span>
                  
                  <span>precoUnitario</span>
                  <span className="text-slate-500 text-right">DECIMAL(10,2)</span>

                  <span className="font-semibold text-slate-355 text-indigo-305">subtotal</span>
                  <span className="text-slate-500 text-right italic text-[9px] font-sans">quantidade * preco</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Lado Direito: Terminal SQL + Resultados (7 colunas) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col gap-4">
            
            {/* Header Terminal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Terminal Interativo de Consulta SQL
                </h4>
              </div>
              <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-indigo-400 font-mono">
                Porta 3000 • SGBD Sincronizado
              </span>
            </div>

            {/* Presets rascunho de queries */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <BookOpen size={11} />
                Escolha um Script SQL Modelo:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPreset(idx)}
                    className={`text-left p-2.5 rounded-lg border text-[11px] leading-snug transition-all cursor-pointer ${
                      selectedPresetIndex === idx
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold block text-slate-300 mb-0.5">{preset.title}</span>
                    <span className="text-slate-400 block truncate font-mono text-[9px] bg-slate-950/80 px-1 py-0.5 rounded border border-slate-850/60 mt-1">
                      {preset.query}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Playground */}
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Editor de Query SQL (SQLite compatível)
                </label>
                <div className="text-[10px] text-slate-500 italic">
                  *Suporta SELECT, JOIN, WHERE, GROUP BY, ORDER BY, LIMIT
                </div>
              </div>
              <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-transparent text-indigo-300 outline-none resize-none leading-relaxed placeholder:text-slate-700 font-mono"
                  placeholder="Escreva sua query SQL aqui..."
                />
                
                {/* Floating Execute Trigger */}
                <button
                  onClick={() => handleExecuteSQL(customQuery)}
                  className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 px-3 rounded-md flex items-center gap-1 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Play size={12} fill="white" />
                  Executar [F5]
                </button>
              </div>
            </div>

            {/* Resultado do SQL */}
            {sqlResult && (
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <FileSpreadsheet size={13} className="text-slate-500" />
                    Visualização das Tuplas do SGBD:
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500 bg-slate-950/60 px-2 py-1 rounded">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {sqlResult.queryTimeMs} ms
                    </span>
                    <span>•</span>
                    <span>{sqlResult.rows.length} registros</span>
                  </div>
                </div>

                {sqlResult.error ? (
                  <div className="bg-rose-950/30 p-4 rounded-lg border border-rose-900/40 text-xs text-rose-400 flex items-start gap-2.5 leading-relaxed font-mono">
                    <X size={15} className="shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-1">ERRO SQL SGBD:</span>
                      {sqlResult.error}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-950/50">
                    <div className="overflow-x-auto max-h-[280px]">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-850/80 font-mono text-slate-400 uppercase text-[9px] font-bold">
                            {sqlResult.columns.map((col, idx) => (
                              <th key={idx} className="p-2 px-3 font-semibold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-mono text-slate-350">
                          {sqlResult.rows.length > 0 ? (
                            sqlResult.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-900/40 transition-all">
                                {sqlResult.columns.map((col, colIdx) => {
                                  const rawVal = row[col];
                                  let displayVal = rawVal;
                                  if (typeof rawVal === 'number') {
                                    // formatar decimal se for faturamento/preco
                                    if (col.toLowerCase().includes('preco') || col.toLowerCase().includes('valor') || col.toLowerCase().includes('subtotal') || col.toLowerCase().includes('faturamento') || col.toLowerCase().includes('receita')) {
                                      displayVal = `R$ ${rawVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                    }
                                  } else if (rawVal === null || rawVal === undefined) {
                                    displayVal = <span className="text-slate-700 italic">null</span>;
                                  }
                                  
                                  return (
                                    <td key={colIdx} className="p-2 px-3 py-2.5 truncate max-w-[170px]" title={String(rawVal)}>
                                      {displayVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={sqlResult.columns.length} className="p-6 text-center text-slate-500 italic">
                                A query foi executada com sucesso, mas retornou zero registros (Tabela Vazia ou Filtro Restritivo).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
