import React, { useState, useEffect } from 'react';
import { Cliente, Produto, Pedido } from './types';
import { CLIENTES_INICIAIS, PRODUTOS_INICIAIS, PEDIDOS_INICIAIS } from './sampleData';

// Módulos Corporativos
import { CustomerModule } from './components/CustomerModule';
import { ProductModule } from './components/ProductModule';
import { OrderModule } from './components/OrderModule';
import { DashboardCharts } from './components/DashboardCharts';
import { DecisionSupportModule } from './components/DecisionSupportModule';
import { ReportsModule } from './components/ReportsModule';
import { SGBDConsoleModule } from './components/SGBDConsoleModule';

// Ícones Modernos
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BrainCircuit,
  FileBarChart,
  RefreshCw,
  Sparkles,
  Layers,
  Database,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'produtos' | 'pedidos' | 'decisao' | 'relatorios' | 'sgbd'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados principais com persistência em localStorage e NestJS SGBD
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<'local' | 'fullstack'>('local');

  // Carregar dados iniciais e reidratar do SGBD do NestJS ou localStorage
  useEffect(() => {
    const carregarConfiguracaoPersistencia = async () => {
      try {
        const resConn = await fetch('/api/status');
        if (resConn.ok) {
          const status = await resConn.json();
          if (status.status === 'online') {
            setPersistenceMode('fullstack');
            
            // Carregar dados do NestJS Backend
            const resData = await fetch('/api/data');
            if (resData.ok) {
              const data = await resData.json();
              if (data.clientes && data.produtos && data.pedidos) {
                setClientes(data.clientes);
                setProdutos(data.produtos);
                setPedidos(data.pedidos);
                localStorage.setItem('BI_CLIENTES', JSON.stringify(data.clientes));
                localStorage.setItem('BI_PRODUTOS', JSON.stringify(data.produtos));
                localStorage.setItem('BI_PEDIDOS', JSON.stringify(data.pedidos));
                return;
              }
            }
          }
        }
      } catch (err) {
        console.log('NestJS API offline ou indisponível temporariamente. Usando engine localStorage Local.');
      }

      // Fallback para localStorage
      const localClientes = localStorage.getItem('BI_CLIENTES');
      const localProdutos = localStorage.getItem('BI_PRODUTOS');
      const localPedidos = localStorage.getItem('BI_PEDIDOS');

      if (localClientes && localProdutos && localPedidos) {
        setClientes(JSON.parse(localClientes));
        setProdutos(JSON.parse(localProdutos));
        setPedidos(JSON.parse(localPedidos));
      } else {
        // Seed - Carregar amostras ricas
        redefinirDadosParaPadraoSilencioso();
      }
    };

    carregarConfiguracaoPersistencia();
  }, []);

  // Sincronizar localmente e enviar pro servidor NestJS se disponível
  const salvarNoDispositivo = async (novosCli: Cliente[], novosProd: Produto[], novosPed: Pedido[]) => {
    localStorage.setItem('BI_CLIENTES', JSON.stringify(novosCli));
    localStorage.setItem('BI_PRODUTOS', JSON.stringify(novosProd));
    localStorage.setItem('BI_PEDIDOS', JSON.stringify(novosPed));

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes: novosCli, produtos: novosProd, pedidos: novosPed })
      });
      if (res.ok) {
        setPersistenceMode('fullstack');
      }
    } catch (err) {
      console.log('Falha ao persistir dados no NestJS:', err);
    }
  };

  const dispararNotificacao = (mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 4500);
  };

  // Redefinir para dados de fábrica
  const redefinirDadosParaPadraoSilencioso = () => {
    setClientes(CLIENTES_INICIAIS);
    setProdutos(PRODUTOS_INICIAIS);
    setPedidos(PEDIDOS_INICIAIS);
    salvarNoDispositivo(CLIENTES_INICIAIS, PRODUTOS_INICIAIS, PEDIDOS_INICIAIS);
  };

  const handleResetDadosWithNotify = () => {
    redefinirDadosParaPadraoSilencioso();
    dispararNotificacao('Database corporativo redefinido com sucesso para amostras ricas de semente!');
  };

  // ==================== OPERAÇÕES DE CLIENTES ====================
  const handleAddCliente = (cli: Cliente) => {
    const novaLista = [...clientes, cli];
    setClientes(novaLista);
    salvarNoDispositivo(novaLista, produtos, pedidos);
    dispararNotificacao(`Cliente "${cli.nome}" cadastrado com sucesso.`);
  };

  const handleEditCliente = (cli: Cliente) => {
    const novaLista = clientes.map((c) => (c.id === cli.id ? cli : c));
    setClientes(novaLista);
    salvarNoDispositivo(novaLista, produtos, pedidos);
    dispararNotificacao(`Cliente "${cli.nome}" atualizado.`);
  };

  const handleDeleteCliente = (id: string) => {
    const novaListaCli = clientes.filter((c) => c.id !== id);
    // Também cascatear exclusão de pedidos simulado no frontend para consistência local
    const novaListaPed = pedidos.filter((p) => p.clienteId !== id);
    setClientes(novaListaCli);
    setPedidos(novaListaPed);
    salvarNoDispositivo(novaListaCli, produtos, novaListaPed);
    dispararNotificacao('Cliente e seus históricos excluídos com sucesso.', 'sucesso');
  };

  // ==================== OPERAÇÕES DE PRODUTOS ====================
  const handleAddProduto = (prod: Produto) => {
    const novaLista = [...produtos, prod];
    setProdutos(novaLista);
    salvarNoDispositivo(clientes, novaLista, pedidos);
    dispararNotificacao(`Produto "${prod.nome}" cadastrado com estoque inicial de ${prod.estoque} un.`);
  };

  const handleEditProduto = (prod: Produto) => {
    const novaLista = produtos.map((p) => (p.id === prod.id ? prod : p));
    setProdutos(novaLista);
    salvarNoDispositivo(clientes, novaLista, pedidos);
    dispararNotificacao(`Produto "${prod.nome}" atualizado.`);
  };

  const handleDeleteProduto = (id: string) => {
    const novaLista = produtos.filter((p) => p.id !== id);
    setProdutos(novaLista);
    salvarNoDispositivo(clientes, novaLista, pedidos);
    dispararNotificacao('Produto removido do portfólio comercial.');
  };

  // ==================== OPERAÇÕES DE PEDIDOS DO CLIENTE ====================
  const handleAddPedido = (ped: Pedido) => {
    const novaListaPed = [...pedidos, ped];

    // Atualização inteligente do inventário: Dedução do Estoque Físico se o pedido for 'concluido'
    let novaListaProd = [...produtos];
    if (ped.status === 'concluido') {
      novaListaProd = produtos.map((p) => {
        const totalAdquirido = ped.itens
          .filter((it) => it.produtoId === p.id)
          .reduce((sum, it) => sum + it.quantidade, 0);
        if (totalAdquirido > 0) {
          return {
            ...p,
            estoque: Math.max(0, p.estoque - totalAdquirido),
          };
        }
        return p;
      });
    }

    setPedidos(novaListaPed);
    setProdutos(novaListaProd);
    salvarNoDispositivo(clientes, novaListaProd, novaListaPed);
    dispararNotificacao(
      `Pedido ${ped.id} adicionado com sucesso. Valor total: R$ ${ped.valorTotal.toFixed(2)}. ${
        ped.status === 'concluido' ? 'Estoque reabastecido.' : 'Pendente de validação.'
      }`
    );
  };

  // Método estratégico extra: Toggle status de concluido <-> cancelado com estorno físico de estoque!
  const handleUpdateStatusPedido = (id: string, novoStatus: 'concluido' | 'cancelado') => {
    const pedidoOriginal = pedidos.find((p) => p.id === id);
    if (!pedidoOriginal) return;
    if (pedidoOriginal.status === novoStatus) return; // inalterado

    const novaListaPed = pedidos.map((p) => {
      if (p.id === id) {
        return { ...p, status: novoStatus };
      }
      return p;
    });

    // Reverter/Deduzir estoque de acordo com o sentido do estorno de forma robusta contra duplicidades
    const novaListaProd = produtos.map((p) => {
      const totalRelacionado = pedidoOriginal.itens
        .filter((it) => it.produtoId === p.id)
        .reduce((sum, it) => sum + it.quantidade, 0);
      if (totalRelacionado > 0) {
        if (novoStatus === 'concluido') {
          // Virou concluído: deduzir unidades do estoque
          return { ...p, estoque: Math.max(0, p.estoque - totalRelacionado) };
        } else if (novoStatus === 'cancelado') {
          // Virou cancelado: estornar (devolver) unidades ao estoque
          return { ...p, estoque: p.estoque + totalRelacionado };
        }
      }
      return p;
    });

    setPedidos(novaListaPed);
    setProdutos(novaListaProd);
    salvarNoDispositivo(clientes, novaListaProd, novaListaPed);
    dispararNotificacao(
      `Status do pedido ${id} alterado para "${novoStatus === 'concluido' ? 'Concluído' : 'Cancelado'}" — Estoque reajustado.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-300" id="main-application-shell">
      
      {/* Alerta de Notificação Flutuante */}
      <AnimatePresence>
        {notificacao && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-100 p-4 rounded-xl border shadow-xl text-xs font-semibold flex items-center gap-2 max-w-sm ${
              notificacao.tipo === 'sucesso'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/30 shadow-emerald-950/20'
                : 'bg-slate-900 text-red-400 border-red-500/30 shadow-red-950/20'
            }`}
          >
            <Sparkles size={14} className={notificacao.tipo === 'sucesso' ? 'text-emerald-400 shrink-0' : 'text-red-400 shrink-0'} />
            <span>{notificacao.mensagem}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Corporativo superior */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 p-4 px-6 flex justify-between items-center sticky top-0 z-40 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            <Layers size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 uppercase leading-none">
              BI Analítico Estratégico
              <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 tracking-normal p-1 px-1.5 rounded-sm lowercase font-bold font-mono">
                v2.1 LTS
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Sistema gerencial unificado de suporte e decisão estratégica • Bento Theme
            </p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-medium">
            <Database size={13} className={persistenceMode === 'fullstack' ? 'text-emerald-400' : 'text-slate-500'} />
            <span className={persistenceMode === 'fullstack' ? 'text-emerald-400' : 'text-slate-500'}>
              {persistenceMode === 'fullstack' ? 'Persistência DB Servidor Ativa' : 'Persistência Local Ativa'}
            </span>
          </div>
          
          <button
            onClick={handleResetDadosWithNotify}
            id="btn-factory-reset"
            className="text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 p-2 pr-3 pl-2 border border-slate-750 hover:border-slate-600 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            Preencher Base (Seed)
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 border border-slate-800 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Grid Central Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar Nav (Desktop) & Overlay Mobile Nav */}
        <aside
          className={`lg:w-64 bg-slate-900/40 text-slate-400 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 print:hidden ${
            isMobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 w-72 bg-slate-950' : 'hidden lg:flex'
          }`}
          id="visual-sidebar"
        >
          <div className="space-y-6">
            {/* Mobile Header Inside Menu */}
            {isMobileMenuOpen && (
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="text-white text-xs font-bold uppercase tracking-wide">Menu BI</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 border border-slate-800 bg-slate-900 hover:bg-slate-805 rounded text-slate-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Links de Tab */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
                Operacional
              </span>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-dashboard"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Gestão & Dashboards</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('clientes');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-clientes"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'clientes'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Users size={16} />
                <span>Cadastro de Clientes</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('produtos');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-produtos"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'produtos'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Package size={16} />
                <span>Cadastro de Produtos</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pedidos');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-pedidos"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'pedidos'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <ShoppingCart size={16} />
                <span>Pedidos & Vendas</span>
              </button>
            </div>

            {/* Estratégico AI */}
            <div className="space-y-1 pt-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
                Inteligência
              </span>
              <button
                onClick={() => {
                  setActiveTab('decisao');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-decisao"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'decisao'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <BrainCircuit size={16} className={activeTab === 'decisao' ? 'text-white' : 'text-indigo-400'} />
                <span>Random Forest Predictor</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('relatorios');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-relatorios"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'relatorios'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileBarChart size={16} className={activeTab === 'relatorios' ? 'text-white' : 'text-emerald-400'} />
                <span>Relatórios Consultivos</span>
              </button>
            </div>

            {/* Banco de Dados Acadêmico */}
            <div className="space-y-1 pt-4 border-t border-slate-800">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
                Banco de Dados
              </span>
              <button
                onClick={() => {
                  setActiveTab('sgbd');
                  setIsMobileMenuOpen(false);
                }}
                id="tab-sgbd"
                className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'sgbd'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Database size={16} className={activeTab === 'sgbd' ? 'text-white' : 'text-indigo-400'} />
                <span>SGBD SQL Console</span>
              </button>
            </div>
          </div>

          {/* Footer Area of Sidebar */}
          <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800 pt-4 mt-8 font-mono">
            <div>SGBD Persistente: <span className={persistenceMode === 'fullstack' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{persistenceMode === 'fullstack' ? 'Online' : 'Offline'}</span></div>
            <div className="text-[9px] text-slate-600 mt-1">© 2026 Inteligência de Negócios</div>
          </div>
        </aside>

        {/* Principal Screen Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 bg-slate-950">
          
          {/* Semente Quick Indicator if Empty */}
          {clientes.length === 0 && (
            <div className="p-4 bg-slate-900 border border-amber-500/30 text-slate-300 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg shadow-amber-950/10">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-amber-400" />
                <span>Base local vazia. Deseja carregar amostras corporativas realistas para teste imediato de previsões?</span>
              </div>
              <button
                onClick={handleResetDadosWithNotify}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1.5 px-4 text-[11px] font-bold cursor-pointer transition-all shadow-md shadow-indigo-500/25"
              >
                Carregar Amostras
              </button>
            </div>
          )}

          {/* Renderização Condicional Inteligente das Telas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="outline-none"
            >
              {activeTab === 'dashboard' && (
                <DashboardCharts pedidos={pedidos} clientes={clientes} produtos={produtos} />
              )}

              {activeTab === 'clientes' && (
                <CustomerModule
                  clientes={clientes}
                  onAddCliente={handleAddCliente}
                  onEditCliente={handleEditCliente}
                  onDeleteCliente={handleDeleteCliente}
                />
              )}

              {activeTab === 'produtos' && (
                <ProductModule
                  produtos={produtos}
                  onAddProduto={handleAddProduto}
                  onEditProduto={handleEditProduto}
                  onDeleteProduto={handleDeleteProduto}
                />
              )}

              {activeTab === 'pedidos' && (
                <OrderModule
                  pedidos={pedidos}
                  clientes={clientes}
                  produtos={produtos}
                  onAddPedido={handleAddPedido}
                  onUpdateStatusPedido={handleUpdateStatusPedido}
                />
              )}

              {activeTab === 'decisao' && (
                <DecisionSupportModule
                  clientes={clientes}
                  pedidos={pedidos}
                />
              )}

              {activeTab === 'relatorios' && (
                <ReportsModule
                  clientes={clientes}
                  produtos={produtos}
                  pedidos={pedidos}
                />
              )}

              {activeTab === 'sgbd' && (
                <SGBDConsoleModule
                  clientes={clientes}
                  produtos={produtos}
                  pedidos={pedidos}
                  persistenceMode={persistenceMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
