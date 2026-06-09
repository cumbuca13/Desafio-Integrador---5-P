import React from 'react';
import { Pedido, Cliente, Produto } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, Legend } from 'recharts';
import { Award, ShoppingCart, Users, DollarSign, TrendingUp, Compass, Landmark } from 'lucide-react';

interface DashboardChartsProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  produtos: Produto[];
}

export function DashboardCharts({ pedidos, clientes, produtos }: DashboardChartsProps) {
  const pedidosConcluidos = pedidos.filter((p) => p.status === 'concluido');

  // 1. Número total de vendas e ticket médio geral
  const totalVendasConcluidas = pedidosConcluidos.length;
  const faturamentoTotal = pedidosConcluidos.reduce((acc, p) => acc + p.valorTotal, 0);
  const ticketMedioGeral = totalVendasConcluidas > 0 ? faturamentoTotal / totalVendasConcluidas : 0;

  // 2. Vendas por Data (Gráfico de Linha de Faturamento)
  const faturamentoPorData = pedidosConcluidos.reduce((acc: Record<string, number>, p) => {
    const data = p.data;
    acc[data] = (acc[data] || 0) + p.valorTotal;
    return acc;
  }, {});

  const dadosFaturamentoTempo = Object.entries(faturamentoPorData)
    .map(([data, valor]) => ({ data, Faturamento: valor }))
    .sort((a, b) => a.data.localeCompare(b.data));

  // 3. Top Clientes por Gasto (Gráfico de Barras)
  const gastoPorCliente = pedidosConcluidos.reduce((acc: Record<string, { nome: string; total: number }>, p) => {
    acc[p.clienteId] = {
      nome: p.nomeCliente,
      total: (acc[p.clienteId]?.total || 0) + p.valorTotal,
    };
    return acc;
  }, {});

  const dadosTopClientes = Object.entries(gastoPorCliente)
    .map(([id, info]) => ({ id, nome: info.nome, GastoTotal: info.total }))
    .sort((a, b) => b.GastoTotal - a.GastoTotal)
    .slice(0, 5); // top 5

  // 4. Produtos Mais Vendidos (Quantidade total vendida)
  const qtdPorProduto = pedidosConcluidos.reduce((acc: Record<string, { nome: string; qtd: number }>, p) => {
    p.itens.forEach((it) => {
      acc[it.produtoId] = {
        nome: it.nomeProduto,
        qtd: (acc[it.produtoId]?.qtd || 0) + it.quantidade,
      };
    });
    return acc;
  }, {});

  const dadosProdutosMaisVendidos = Object.entries(qtdPorProduto)
    .map(([id, info]) => ({ id, nome: info.nome, Quantidade: info.qtd }))
    .sort((a, b) => b.Quantidade - a.Quantidade)
    .slice(0, 5);

  // 5. Produtos de Maior Valor Unitário (Unidade)
  const produtosMaiorValor = [...produtos]
    .sort((a, b) => b.preco - a.preco)
    .slice(0, 5);

  // 6. Vendas por Estado e Cidade
  const faturamentoPorEstado = pedidosConcluidos.reduce((acc: Record<string, number>, p) => {
    const cli = clientes.find((c) => c.id === p.clienteId);
    if (cli) {
      acc[cli.estado] = (acc[cli.estado] || 0) + p.valorTotal;
    } else {
      acc['S/E'] = (acc['S/E'] || 0) + p.valorTotal;
    }
    return acc;
  }, {});

  const dadosVendasPorEstado = Object.entries(faturamentoPorEstado).map(([estado, valor]) => ({
    estado,
    Faturamento: valor,
  }));

  const faturamentoPorCidade = pedidosConcluidos.reduce((acc: Record<string, number>, p) => {
    const cli = clientes.find((c) => c.id === p.clienteId);
    if (cli) {
      acc[cli.cidade] = (acc[cli.cidade] || 0) + p.valorTotal;
    }
    return acc;
  }, {});

  const dadosVendasPorCidade = Object.entries(faturamentoPorCidade)
    .map(([cidade, valor]) => ({ cidade, Faturamento: valor }))
    .sort((a, b) => b.Faturamento - a.Faturamento)
    .slice(0, 5);

  // Cores de Paleta Suíça / Moderna (Fidelizados e Dashboard)
  const CORES_PALETA = ['#3b82f6', '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div id="dashboard-charts" className="space-y-6">
      {/* 4 Cards Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-md flex items-center gap-3 hover:border-slate-700/50 transition-all">
          <div className="p-2.5 bg-indigo-950/50 text-indigo-400 border border-indigo-500/10 rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Receita Bruta (LTV)</div>
            <div className="text-xl lg:text-2xl font-black text-white font-display mt-0.5">
              R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-md flex items-center gap-3 hover:border-slate-700/50 transition-all">
          <div className="p-2.5 bg-indigo-950/50 text-indigo-400 border border-indigo-500/10 rounded-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Vendas Validadas</div>
            <div className="text-xl lg:text-2xl font-black text-white font-display mt-0.5">{totalVendasConcluidas} ords</div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-md flex items-center gap-3 hover:border-slate-700/50 transition-all">
          <div className="p-2.5 bg-emerald-950/40 text-emerald-400 border border-emerald-550/10 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Ticket Médio</div>
            <div className="text-xl lg:text-2xl font-black text-white font-display mt-0.5">
              R$ {ticketMedioGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-md flex items-center gap-3 hover:border-slate-700/50 transition-all">
          <div className="p-2.5 bg-amber-950/40 text-amber-550 border border-amber-550/10 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Clientes Portfólio</div>
            <div className="text-xl lg:text-2xl font-black text-white font-display mt-0.5">{clientes.length} corp</div>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento ao longo do Tempo */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col h-80 hover:border-slate-700/40 transition-all">
          <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
            <TrendingUp size={15} className="text-indigo-400" />
            Curva de Receita e Faturamento Cronológico (R$)
          </h4>
          <div className="flex-1 w-full text-xs">
            {dadosFaturamentoTempo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosFaturamentoTempo}>
                  <XAxis dataKey="data" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="Faturamento" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Sem faturamento concluído até o momento.</div>
            )}
          </div>
        </div>

        {/* Top Clientes por Gasto Total */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col h-80 hover:border-slate-700/40 transition-all">
          <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
            <Award size={15} className="text-blue-400" />
            Top 5 Clientes Parceiros em Faturamento Acumulado (R$)
          </h4>
          <div className="flex-1 w-full text-xs">
            {dadosTopClientes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTopClientes} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#475569" />
                  <YAxis dataKey="nome" type="category" stroke="#475569" width={100} />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Gasto Total']}
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="GastoTotal" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {dadosTopClientes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Registre pedidos concluídos para exibir o ranking de clientes.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos mais vendidos */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md col-span-1 lg:col-span-2 flex flex-col h-80 hover:border-slate-700/40 transition-all">
          <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
            <Compass size={15} className="text-emerald-400" />
            Top Produtos por Volume de Unidades Comercializadas
          </h4>
          <div className="flex-1 w-full text-xs">
            {dadosProdutosMaisVendidos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosProdutosMaisVendidos}>
                  <XAxis dataKey="nome" stroke="#475569" tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 15)}...` : v)} />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="Quantidade" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {dadosProdutosMaisVendidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[(index + 2) % CORES_PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Aguardando dados de pedidos concluídos.</div>
            )}
          </div>
        </div>

        {/* Produto com Maior Valor Unitário */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md col-span-1 flex flex-col justify-between hover:border-slate-700/40 transition-all">
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
              <DollarSign size={15} className="text-amber-500" />
              Produtos de Maior Valor Unitário
            </h4>
            <div className="space-y-3">
              {produtosMaiorValor.map((prod, idx) => (
                <div key={prod.id} className="flex flex-col border-b border-slate-850 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span className="truncate max-w-[140px]">{prod.nome}</span>
                    <span className="font-mono text-slate-300">R$ {prod.preco.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Estoque: {prod.estoque} un</span>
                    <span className="font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 text-[9px]">{prod.categoria || 'Sem cat'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 italic">
            <span>Base Geral cadastrada</span>
            <span className="font-mono font-bold text-slate-400">{produtos.length} produtos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Vendas por Estado */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col h-80 hover:border-slate-700/40 transition-all">
          <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
            <Landmark size={15} className="text-rose-450" />
            Distribuição de Vendas por Estado do Cliente (R$)
          </h4>
          <div className="flex-1 w-full text-xs">
            {dadosVendasPorEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVendasPorEstado}>
                  <XAxis dataKey="estado" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="Faturamento" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Registre clientes e vincule a pedidos para consolidar geopolíticamente.</div>
            )}
          </div>
        </div>

        {/* Distribuição de Vendas por Cidade */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col h-80 hover:border-slate-700/40 transition-all">
          <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-widest">
            <Landmark size={15} className="text-emerald-400" />
            Top 5 Cidades por Volume de Faturamento (R$)
          </h4>
          <div className="flex-1 w-full text-xs">
            {dadosVendasPorCidade.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosVendasPorCidade}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="Faturamento"
                    nameKey="cidade"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    fontSize={10}
                  >
                    {dadosVendasPorCidade.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Vendido']}
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Dados insuficientes para estruturar vendas por cidades.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
