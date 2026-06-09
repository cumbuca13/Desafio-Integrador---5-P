import React, { useState } from 'react';
import { Cliente } from '../types';
import { UserPlus, Search, Edit2, Trash2, Check, AlertTriangle, MapPin, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerModuleProps {
  clientes: Cliente[];
  onAddCliente: (cliente: Cliente) => void;
  onEditCliente: (cliente: Cliente) => void;
  onDeleteCliente: (id: string) => void;
}

export function CustomerModule({
  clientes,
  onAddCliente,
  onEditCliente,
  onDeleteCliente,
}: CustomerModuleProps) {
  // Estados para Filtros
  const [busca, setBusca] = useState('');
  const [filtroPais, setFiltroPais] = useState('Todos');

  // Estados do Formulário (Novo / Edição)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);

  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [pais, setPais] = useState('Brasil');

  // Estados de Erro de Validação
  const [erros, setErros] = useState<Record<string, string>>({});

  // Lista de países únicos para filtro
  const paisesUnicos = Array.from(new Set(clientes.map((c) => c.pais)));

  const abrirFormulario = (cliente?: Cliente) => {
    if (cliente) {
      setEditandoCliente(cliente);
      setId(cliente.id);
      setNome(cliente.nome);
      setEmail(cliente.email);
      setCidade(cliente.cidade);
      setEstado(cliente.estado);
      setPais(cliente.pais);
    } else {
      setEditandoCliente(null);
      // Gerar ID sequencial sugestivo
      const proximoIdNum = clientes.reduce((max, c) => {
        const num = parseInt(c.id.replace('c-', ''));
        return isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;
      setId(`c-${proximoIdNum}`);
      setNome('');
      setEmail('');
      setCidade('');
      setEstado('');
      setPais('Brasil');
    }
    setErros({});
    setIsFormOpen(true);
  };

  const fecharFormulario = () => {
    setIsFormOpen(false);
    setEditandoCliente(null);
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório.';
    }

    if (!email.trim()) {
      novosErros.email = 'E-mail é obrigatório.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        novosErros.email = 'Insira um formato de e-mail válido.';
      }
    }

    if (!cidade.trim()) {
      novosErros.cidade = 'Cidade é obrigatória.';
    }

    if (!estado.trim() || estado.trim().length > 3) {
      novosErros.estado = 'Preencha com o estado (Ex: SP, RJ).';
    }

    if (!pais.trim()) {
      novosErros.pais = 'País é obrigatório.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const salvarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const clienteDados: Cliente = {
      id: id.trim() || `c-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim(),
      cidade: cidade.trim(),
      estado: estado.trim().toUpperCase(),
      pais: pais.trim(),
      dataCadastro: editandoCliente ? editandoCliente.dataCadastro : new Date().toISOString().split('T')[0],
    };

    if (editandoCliente) {
      onEditCliente(clienteDados);
    } else {
      // Verificar se ID já existe
      if (clientes.some((c) => c.id === clienteDados.id)) {
        setErros({ id: 'Já existe um cliente cadastrado com este ID.' });
        return;
      }
      onAddCliente(clienteDados);
    }
    fecharFormulario();
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter((c) => {
    const bateBusca =
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase()) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase());
    const batePais = filtroPais === 'Todos' || c.pais === filtroPais;
    return bateBusca && batePais;
  });

  return (
    <div id="customer-module" className="space-y-6">
      {/* Topo bar com buscas e botão cadastrar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" id="icon-search-cus" />
            <input
              type="text"
              id="input-busca-cliente"
              placeholder="Buscar por nome, e-mail ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-800 bg-slate-950 rounded-lg text-sm text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            id="select-filtro-pais"
            value={filtroPais}
            onChange={(e) => setFiltroPais(e.target.value)}
            className="border border-slate-800 rounded-lg text-sm px-3 py-2 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos" className="bg-slate-905">Todos os Países</option>
            {paisesUnicos.map((p) => (
              <option key={p} value={p} className="bg-slate-905">
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => abrirFormulario()}
          id="btn-novo-cliente"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-500/15 self-stretch md:self-auto cursor-pointer"
        >
          <UserPlus size={16} />
          Cadastrar Cliente
        </button>
      </div>

      {/* Tabela de listagem */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table-clientes">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Localização</th>
                <th className="p-4 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500 font-bold">{cliente.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{cliente.nome}</div>
                      <div className="text-xs text-slate-500">Cadastrado em {cliente.dataCadastro}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail size={14} className="text-slate-500" />
                        <span className="truncate max-w-[200px]">{cliente.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin size={14} className="text-slate-500 shrink-0" />
                        <span>
                          {cliente.cidade} - {cliente.estado}, {cliente.pais}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirFormulario(cliente)}
                          id={`btn-edit-${cliente.id}`}
                          title="Editar Cliente"
                          className="p-1 px-1.5 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir o cliente ${cliente.nome}? Isso removerá seus históricos na visualização local atual.`)) {
                              onDeleteCliente(cliente.id);
                            }
                          }}
                          id={`btn-del-${cliente.id}`}
                          title="Excluir Cliente"
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
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    Nenhum cliente cadastrado correspondendo aos filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diálogo Modal de Cadastro / Edição */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden shadow-slate-950/80"
              id="cliente-dialog-card"
            >
              {/* Header */}
              <div className="bg-slate-950 border-b border-slate-800 p-4 px-6 flex justify-between items-center">
                <h3 className="font-semibold text-white text-base" id="cliente-dialog-title">
                  {editandoCliente ? `Editar Cliente: ${editandoCliente.nome}` : 'Cadastrar Novo Cliente'}
                </h3>
                <button
                  onClick={fecharFormulario}
                  className="p-1 border border-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Corpo formulário */}
              <form onSubmit={salvarCliente} className="p-6 space-y-4" id="form-cliente-cadastro">
                {/* ID (Sempre gerado ou estático na edição) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">ID Identificador</label>
                  <input
                    type="text"
                    id="input-cli-id"
                    value={id}
                    onChange={(e) => !editandoCliente && setId(e.target.value)}
                    disabled={editandoCliente !== null}
                    placeholder="Ex: c-11"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 disabled:text-slate-600 disabled:border-slate-850 font-mono"
                  />
                  {erros.id && <span className="text-red-400 text-xs mt-1 block">{erros.id}</span>}
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    id="input-cli-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                     placeholder="Ex: Ana Souza de Azevedo"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                  {erros.nome && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.nome}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Correio Eletrônico (E-mail)</label>
                  <input
                    type="text"
                    id="input-cli-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: ana.souza@provedor.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                  {erros.email && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.email}</span>}
                </div>

                {/* Grid Localização (Cidade / Estado) */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Cidade</label>
                    <input
                      type="text"
                      id="input-cli-cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Ex: Campinas"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    />
                    {erros.cidade && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.cidade}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estado</label>
                    <input
                      type="text"
                      id="input-cli-estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 text-center uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-semibold"
                    />
                    {erros.estado && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.estado}</span>}
                  </div>
                </div>

                {/* País */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">País</label>
                  <input
                    type="text"
                    id="input-cli-pais"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="Ex: Brasil"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg text-sm p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                  {erros.pais && <span className="text-red-400 text-xs mt-1 block font-medium">{erros.pais}</span>}
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
                    id="btn-sub-cliente"
                    className="p-2 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/15 cursor-pointer"
                  >
                    <Check size={14} />
                    Confirmar Cadastro
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
