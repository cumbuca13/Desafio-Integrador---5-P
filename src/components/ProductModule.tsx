import React, { useState } from 'react';
import { Produto } from '../types';
import { Plus, Search, Edit2, Trash2, Check, Package, X, DollarSign, Archive, Tags } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductModuleProps {
  produtos: Produto[];
  onAddProduto: (produto: Produto) => void;
  onEditProduto: (produto: Produto) => void;
  onDeleteProduto: (id: string) => void;
}

export function ProductModule({
  produtos,
  onAddProduto,
  onEditProduto,
  onDeleteProduto,
}: ProductModuleProps) {
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // Formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null);

  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState(0);
  const [estoque, setEstoque] = useState(0);
  const [categoria, setCategoria] = useState('');

  // Erros
  const [erros, setErros] = useState<Record<string, string>>({});

  // Categorias únicas existentes para filtros
  const categoriasUnicas = Array.from(
    new Set(produtos.map((p) => p.categoria || 'Sem categoria'))
  );

  const abrirFormulario = (produto?: Produto) => {
    if (produto) {
      setEditandoProduto(produto);
      setId(produto.id);
      setNome(produto.nome);
      setPreco(produto.preco);
      setEstoque(produto.estoque);
      setCategoria(produto.categoria || '');
    } else {
      setEditandoProduto(null);
      const proximoIdNum = produtos.reduce((max, p) => {
        const num = parseInt(p.id.replace('p-', ''));
        return isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;
      setId(`p-${proximoIdNum}`);
      setNome('');
      setPreco(0);
      setEstoque(0);
      setCategoria('');
    }
    setErros({});
    setIsFormOpen(true);
  };

  const fecharFormulario = () => {
    setIsFormOpen(false);
    setEditandoProduto(null);
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!nome.trim()) {
      novosErros.nome = 'Nome do produto é obrigatório.';
    }

    if (isNaN(preco) || preco <= 0) {
      novosErros.preco = 'Preço deve ser um número estritamente positivo (maior que zero).';
    }

    if (isNaN(estoque) || estoque < 0) {
      novosErros.estoque = 'Quantidade de estoque não pode ser negativa.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const produtoDados: Produto = {
      id: id.trim() || `p-${Date.now()}`,
      nome: nome.trim(),
      preco: Number(preco),
      estoque: Math.round(Number(estoque)),
      categoria: categoria.trim() ? categoria.trim() : undefined,
    };

    if (editandoProduto) {
      onEditProduto(produtoDados);
    } else {
      if (produtos.some((p) => p.id === produtoDados.id)) {
        setErros({ id: 'Já existe um produto com este ID cadastrado.' });
        return;
      }
      onAddProduto(produtoDados);
    }
    fecharFormulario();
  };

  // Filtragem
  const produtosFiltrados = produtos.filter((p) => {
    const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const catProduto = p.categoria || 'Sem categoria';
    const bateCategoria = filtroCategoria === 'Todas' || catProduto === filtroCategoria;
    return bateBusca && bateCategoria;
  });

  // Estatísticas de Gestão ricas
  const totalProdutosUnicos = produtos.length;
  const totalItensEstoque = produtos.reduce((acc, p) => acc + p.estoque, 0);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0);
  const semEstoqueNum = produtos.filter((p) => p.estoque === 0).length;

  return (
    <div id="product-module" className="space-y-6">
      {/* 4 Cards de Resumo Executivo para Gestores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-950/50 text-blue-400 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase font-sans">Cadastrados</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{totalProdutosUnicos}</div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/50 text-indigo-400 rounded-lg">
            <Archive size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase font-sans">Peças em Estoque</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{totalItensEstoque}</div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase font-sans">Valor do Estoque</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 py-5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${semEstoqueNum > 0 ? 'bg-rose-950/40 text-rose-400' : 'bg-slate-950 text-slate-600'}`}>
            <Archive size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase font-sans">Fora de Estoque</div>
            <div className={`text-xl font-bold mt-0.5 font-mono ${semEstoqueNum > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {semEstoqueNum}
            </div>
          </div>
        </div>
      </div>

      {/* Caixa de Pesquisas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" id="icon-search-prod" />
            <input
              type="text"
              id="input-busca-produto"
              placeholder="Buscar por nome do produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-800 bg-slate-950 rounded-lg text-sm text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            id="select-filtro-categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-slate-800 rounded-lg text-sm px-3 py-2 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="Todas" className="bg-slate-905">Todas as Categorias</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-905">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => abrirFormulario()}
          id="btn-novo-produto"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-500/15 self-stretch md:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Cadastrar Produto
        </button>
      </div>

      {/* Listagem */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table-produtos">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">Produto</th>
                <th className="p-4">Preço Unitário</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/20 transition-all">
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{prod.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{prod.nome}</div>
                    </td>
                    <td className="p-4 font-semibold text-white font-mono">
                      R$ {prod.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                          prod.estoque === 0
                            ? 'bg-rose-950/50 text-rose-400'
                            : prod.estoque <= 10
                            ? 'bg-amber-950/50 text-amber-400'
                            : 'bg-emerald-950/50 text-emerald-400'
                        }`}
                      >
                        {prod.estoque} un
                      </span>
                    </td>
                    <td className="p-4">
                      {prod.categoria ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-950 text-indigo-300 px-2.5 py-1 rounded-md border border-slate-800">
                          <Tags size={10} className="text-slate-500" />
                          {prod.categoria}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Sem categoria</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirFormulario(prod)}
                          id={`btn-edit-prod-${prod.id}`}
                          title="Editar Produto"
                          className="p-1 px-1.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o produto ${prod.nome}?`)) {
                              onDeleteProduto(prod.id);
                            }
                          }}
                          id={`btn-del-prod-${prod.id}`}
                          title="Excluir Produto"
                          className="p-1 px-1.5 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/25 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    Nenhum produto cadastrado que atenda aos filtros desejados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro de Produto */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md overflow-hidden shadow-slate-950/80"
              id="produto-dialog-card"
            >
              {/* Header */}
              <div className="bg-slate-950 border-b border-slate-800 p-4 px-6 flex justify-between items-center">
                <h3 className="font-semibold text-white text-base" id="produto-dialog-title">
                  {editandoProduto ? `Editar Produto: ${editandoProduto.nome}` : 'Cadastrar Novo Produto'}
                </h3>
                <button
                  onClick={fecharFormulario}
                  className="p-1 border border-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={salvarProduto} className="p-6 space-y-4" id="form-produto-cadastro">
                {/* ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Código Identificador (ID)</label>
                  <input
                    type="text"
                    id="input-prod-id"
                    value={id}
                    onChange={(e) => !editandoProduto && setId(e.target.value)}
                    disabled={editandoProduto !== null}
                    placeholder="Ex: p-9"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 disabled:text-slate-600 disabled:border-slate-850 font-mono"
                  />
                  {erros.id && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.id}</span>}
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome do Produto</label>
                  <input
                    type="text"
                    id="input-prod-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Assinatura Enterprise Cloud"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                  {erros.nome && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.nome}</span>}
                </div>

                {/* Grid Preço e Estoque */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="input-prod-preco"
                      value={preco || ''}
                      onChange={(e) => setPreco(parseFloat(e.target.value))}
                      placeholder="Ex: 1450.50"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-mono"
                    />
                    {erros.preco && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.preco}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Qtd em Estoque</label>
                    <input
                      type="number"
                      id="input-prod-estoque"
                      value={estoque ?? ''}
                      onChange={(e) => setEstoque(parseInt(e.target.value))}
                      placeholder="Ex: 25"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-mono"
                    />
                    {erros.estoque && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.estoque}</span>}
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Categoria (Opcional)</label>
                  <input
                    type="text"
                    id="input-prod-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: SaaS / Assinatura, Infraestrutura"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Deixe em branco se o produto não pertencer a nenhuma categoria específica.
                  </p>
                </div>

                {/* Footer Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={fecharFormulario}
                    className="p-2 px-4 text-xs font-medium border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="btn-sub-produto"
                    className="p-2 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/15 cursor-pointer"
                  >
                    <Check size={14} />
                    Confirmar Produto
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
