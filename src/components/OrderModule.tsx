import React, { useState } from 'react';
import { Cliente, Produto, Pedido, ItemPedido } from '../types';
import { ShoppingCart, Search, Plus, Trash2, Check, X, Calendar, User, ShoppingBag, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderModuleProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  produtos: Produto[];
  onAddPedido: (pedido: Pedido) => void;
  onUpdateStatusPedido: (id: string, status: 'concluido' | 'cancelado') => void;
}

export function OrderModule({
  pedidos,
  clientes,
  produtos,
  onAddPedido,
  onUpdateStatusPedido,
}: OrderModuleProps) {
  // Filtros de listagem
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'concluido' | 'cancelado'>('todos');

  // Controle de diálogo de criação
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Campos do formulário
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  const [categoriaPedido, setCategoriaPedido] = useState('Venda Padrão');
  const [statusPedido, setStatusPedido] = useState<'concluido' | 'cancelado'>('concluido');
  const [itensCarrinho, setItensCarrinho] = useState<{ produtoId: string; quantidade: number }[]>([
    { produtoId: '', quantidade: 1 }
  ]);

  // Erros no form de criação
  const [erros, setErros] = useState<Record<string, string>>({});

  const abrirFormulario = () => {
    setClienteSelecionadoId(clientes[0]?.id || '');
    setCategoriaPedido('Venda Geral');
    setStatusPedido('concluido');
    setItensCarrinho([{ produtoId: produtos[0]?.id || '', quantidade: 1 }]);
    setErros({});
    setIsFormOpen(true);
  };

  const fecharFormulario = () => {
    setIsFormOpen(false);
  };

  // Funções do carrinho temporário
  const adicionarLinhaItem = () => {
    setItensCarrinho([...itensCarrinho, { produtoId: produtos[0]?.id || '', quantidade: 1 }]);
  };

  const removerLinhaItem = (index: number) => {
    if (itensCarrinho.length === 1) return; // manter ao menos um
    const novos = [...itensCarrinho];
    novos.splice(index, 1);
    setItensCarrinho(novos);
  };

  const atualizarItemCarrinho = (index: number, campo: 'produtoId' | 'quantidade', valor: string | number) => {
    const novos = [...itensCarrinho];
    if (campo === 'produtoId') {
      novos[index].produtoId = valor as string;
    } else {
      novos[index].quantidade = Math.max(1, Number(valor));
    }
    setItensCarrinho(novos);
  };

  // Calcular valor total pré-submissão
  const calcularTotalRascunho = () => {
    return itensCarrinho.reduce((total, item) => {
      const prod = produtos.find((p) => p.id === item.produtoId);
      if (!prod) return total;
      return total + prod.preco * item.quantidade;
    }, 0);
  };

  const salvarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros: Record<string, string> = {};

    if (!clienteSelecionadoId) {
      novosErros.cliente = 'Selecione um cliente para prosseguir.';
    }

    // Validar se há itens duplicados na seleção ou sem estoque
    const idsPreenchidos = itensCarrinho.map((it) => it.produtoId).filter(Boolean);
    if (idsPreenchidos.length === 0) {
      novosErros.itens = 'Adicione pelo menos um produto ao pedido.';
    }

    const estoqueErros: string[] = [];
    const itensValidados: ItemPedido[] = [];

    itensCarrinho.forEach((item, idx) => {
      if (!item.produtoId) {
        estoqueErros.push(`A linha ${idx + 1} está sem produto selecionado.`);
        return;
      }
      const prod = produtos.find((p) => p.id === item.produtoId);
      if (!prod) {
        estoqueErros.push(`Produto selecionado na linha ${idx + 1} não foi localizado.`);
        return;
      }

      // Se for pedido concluído, verificar limites de estoque físico
      if (statusPedido === 'concluido' && prod.estoque < item.quantidade) {
        estoqueErros.push(
          `Estoque insuficiente para "${prod.nome}". Disponível: ${prod.estoque} un, Requerido: ${item.quantidade} un.`
        );
      }

      itensValidados.push({
        produtoId: prod.id,
        nomeProduto: prod.nome,
        quantidade: item.quantidade,
        precoUnitario: prod.preco,
      });
    });

    if (estoqueErros.length > 0) {
      novosErros.itens = estoqueErros.join(' | ');
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const clienteObj = clientes.find((c) => c.id === clienteSelecionadoId);

    // Gerar ID sequencial para o Pedido
    const proximoIdNum = pedidos.reduce((max, p) => {
      const num = parseInt(p.id.replace('ped-', ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0) + 1;

    const novoPedido: Pedido = {
      id: `ped-${proximoIdNum}`,
      clienteId: clienteObj!.id,
      nomeCliente: clienteObj!.nome,
      itens: itensValidados,
      data: new Date().toISOString().split('T')[0],
      valorTotal: calcularTotalRascunho(),
      categoria: categoriaPedido,
      status: statusPedido,
    };

    onAddPedido(novoPedido);
    fecharFormulario();
  };

  // Filtrar pedidos cadastrados
  const pedidosFiltrados = pedidos.filter((p) => {
    const correspondeCliente = p.nomeCliente.toLowerCase().includes(busca.toLowerCase()) || 
                              p.id.toLowerCase().includes(busca.toLowerCase());
    const correspondeStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return correspondeCliente && correspondeStatus;
  });

  return (
    <div id="order-module" className="space-y-6">
      {/* Barra de Filtros e Cadastro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" id="icon-search-ord" />
            <input
              type="text"
              id="input-busca-pedido"
              placeholder="Buscar por ID ou Nome do Cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-800 bg-slate-950 rounded-lg text-sm text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            id="select-filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="border border-slate-800 rounded-lg text-sm px-3 py-2 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="todos" className="bg-slate-905">Todos Status</option>
            <option value="concluido" className="bg-slate-905">Concluídos</option>
            <option value="cancelado" className="bg-slate-905">Cancelados</option>
          </select>
        </div>

        <button
          onClick={abrirFormulario}
          id="btn-novo-pedido"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-500/15 self-stretch md:self-auto cursor-pointer"
        >
          <ShoppingCart size={16} />
          Criar Novo Pedido
        </button>
      </div>

      {/* Grid de cartões de pedidos */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table-pedidos">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="p-4 w-28">Nº Pedido</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Produtos Adquiridos</th>
                <th className="p-4">Data / Categoria</th>
                <th className="p-4">Total</th>
                <th className="p-4 w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {pedidosFiltrados.length > 0 ? (
                [...pedidosFiltrados].sort((a,b) => b.data.localeCompare(a.data)).map((ped) => (
                  <tr key={ped.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{ped.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white flex items-center gap-1">
                        <User size={13} className="text-slate-500 shrink-0" />
                        {ped.nomeCliente}
                      </div>
                      <div className="text-[11px] text-slate-500">ID Cliente: {ped.clienteId}</div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {ped.itens.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <span className="font-bold text-indigo-400 font-mono bg-slate-950 border border-slate-850 rounded-sm px-1.5 text-[10px]">
                              {it.quantidade}x
                            </span>
                            <span className="truncate max-w-[180px]">{it.nomeProduto}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-300 font-mono text-xs">
                        <Calendar size={13} className="text-slate-500 shrink-0" />
                        {ped.data}
                      </div>
                      {ped.categoria && (
                        <span className="mt-1 inline-block text-[10px] bg-slate-950 text-indigo-300 font-medium px-2.5 py-0.5 rounded-sm border border-slate-800">
                          {ped.categoria}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-white font-mono text-sm">
                      R$ {ped.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center text-xs font-semibold rounded-full px-2.5 py-1 w-24 ${
                            ped.status === 'concluido'
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                              : 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                          }`}
                        >
                          {ped.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                        </span>
                        
                        {/* Botão de toggle de status estratégico */}
                        <button
                          onClick={() => {
                            const novoSt = ped.status === 'concluido' ? 'cancelado' : 'concluido';
                            onUpdateStatusPedido(ped.id, novoSt);
                          }}
                          id={`toggle-status-${ped.id}`}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-medium cursor-pointer self-start transition-all"
                        >
                          Alterar p/ {ped.status === 'concluido' ? 'Cancelado' : 'Concluído'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    Nenhum pedido lançado corresponde ao filtro aplicado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Pedido */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-8 shadow-slate-950/80"
              id="pedido-dialog-card"
            >
              {/* Header */}
              <div className="bg-slate-950 border-b border-slate-800 p-4 px-6 flex justify-between items-center">
                <h3 className="font-semibold text-white text-base flex items-center gap-2" id="pedido-dialog-title">
                  <ShoppingBag size={18} className="text-indigo-400" />
                  Emitir Novo Pedido de Venda
                </h3>
                <button
                  onClick={fecharFormulario}
                  className="p-1 border border-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={salvarPedido} className="p-6 space-y-5" id="form-pedido-cadastro">
                {/* Selecionar Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Cliente Comprador</label>
                  <select
                    id="select-ped-cliente"
                    value={clienteSelecionadoId}
                    onChange={(e) => setClienteSelecionadoId(e.target.value)}
                    className="w-full border border-slate-800 rounded-lg text-sm p-2 px-3 bg-slate-950 text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 cursor-pointer"
                  >
                    <option value="" className="bg-slate-905">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-955">
                        {c.nome} ({c.id} - {c.cidade}/{c.estado})
                      </option>
                    ))}
                  </select>
                  {erros.cliente && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.cliente}</span>}
                </div>

                {/* Linha de Categoria e Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Categoria do Pedido</label>
                    <input
                      type="text"
                      id="input-ped-categoria"
                      value={categoriaPedido}
                      onChange={(e) => setCategoriaPedido(e.target.value)}
                      placeholder="Ex: SaaS / Integração"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status Inicial</label>
                    <select
                      id="select-ped-status"
                      value={statusPedido}
                      onChange={(e) => setStatusPedido(e.target.value as any)}
                      className="w-full border border-slate-800 rounded-lg text-sm p-2 px-3 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
                    >
                      <option value="concluido" className="bg-slate-955 text-emerald-400 font-medium">Concluído (Deduz estoque físico)</option>
                      <option value="cancelado" className="bg-slate-955 text-rose-400 font-medium">Cancelado (Sem deduzir estoque)</option>
                    </select>
                  </div>
                </div>

                {/* Itens do Pedido (Adição de Produto Multipla!) */}
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">Itens da Cesta</span>
                    <button
                      type="button"
                      onClick={adicionarLinhaItem}
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <Plus size={12} />
                      Adicionar Item
                    </button>
                  </div>

                  {itensCarrinho.map((item, idx) => {
                    const prodSelecionado = produtos.find((p) => p.id === item.produtoId);
                    const subtotal = prodSelecionado ? prodSelecionado.preco * item.quantidade : 0;

                    return (
                      <div key={idx} className="flex gap-3 items-center bg-slate-950 p-2 rounded-lg border border-slate-800/80 shadow-2xs">
                        <div className="flex-1">
                          <select
                            value={item.produtoId}
                            onChange={(e) => atualizarItemCarrinho(idx, 'produtoId', e.target.value)}
                            className="w-full bg-slate-900/60 text-white text-xs border border-slate-800 rounded-md p-1.5 focus:outline-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-955 text-slate-600">Selecione o produto...</option>
                            {produtos.map((p) => (
                              <option key={p.id} value={p.id} className="bg-slate-955">
                                {p.nome} (R$ {p.preco.toFixed(2)}) — Est: {p.estoque}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => atualizarItemCarrinho(idx, 'quantidade', e.target.value)}
                            className="w-full text-center text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-white rounded-md p-1.5"
                          />
                        </div>
                        <div className="w-24 text-right font-mono text-xs font-bold text-slate-300 pr-1 shrink-0">
                          R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <button
                          type="button"
                          onClick={() => removerLinhaItem(idx)}
                          disabled={itensCarrinho.length === 1}
                          className="text-slate-500 hover:text-red-400 disabled:opacity-20 disabled:hover:text-slate-500 cursor-pointer p-1 rounded hover:bg-slate-900"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}

                  {erros.itens && <span className="text-red-400 text-xs mt-1 block font-medium leading-relaxed">{erros.itens}</span>}
                </div>

                {/* Subtotal da Cesta */}
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex justify-between items-center font-mono">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Valor Total do Pedido</span>
                  <span className="text-lg font-bold text-white">
                    R$ {calcularTotalRascunho().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Rodapé */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={fecharFormulario}
                    className="p-2 px-4 text-xs font-medium border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg cursor-pointer"
                  >
                    Encerrar
                  </button>
                  <button
                    type="submit"
                    className="p-2 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/15 cursor-pointer"
                  >
                    <Check size={14} />
                    Concluir e Lançar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
