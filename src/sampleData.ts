import { Cliente, Produto, Pedido } from './types';

export const CLIENTES_INICIAIS: Cliente[] = [
  {
    id: 'c-1',
    nome: 'Carlos Eduardo Santos',
    email: 'carlos.eduardo@empresa.com',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    dataCadastro: '2025-10-15',
  },
  {
    id: 'c-2',
    nome: 'Mariana Silva Costa',
    email: 'mariana.costa@gmail.com',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    pais: 'Brasil',
    dataCadastro: '2025-11-01',
  },
  {
    id: 'c-3',
    nome: 'Beatriz Vasconcelos Reis',
    email: 'beatriz.reis@outlook.com',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    pais: 'Brasil',
    dataCadastro: '2025-06-20',
  },
  {
    id: 'c-4',
    nome: 'Roberto Azevedo Lima',
    email: 'roberto.lima@uol.com.br',
    cidade: 'Porto Alegre',
    estado: 'RS',
    pais: 'Brasil',
    dataCadastro: '2025-02-10',
  },
  {
    id: 'c-5',
    nome: 'Fernanda de Oliveira',
    email: 'fernanda.oliveira@empresa.com',
    cidade: 'Curitiba',
    estado: 'PR',
    pais: 'Brasil',
    dataCadastro: '2025-12-05',
  },
  {
    id: 'c-6',
    nome: 'John MacPherson Doe',
    email: 'john.doe@globalcorp.com',
    cidade: 'Miami',
    estado: 'FL',
    pais: 'Estados Unidos',
    dataCadastro: '2025-08-11',
  },
  {
    id: 'c-7',
    nome: 'Isabela Souza Campos',
    email: 'isabela.campos@bol.com.br',
    cidade: 'Salvador',
    estado: 'BA',
    pais: 'Brasil',
    dataCadastro: '2026-01-20',
  },
  {
    id: 'c-8',
    nome: 'Thiago Mendonça',
    email: 'thiago.mendonca@yahoo.com',
    cidade: 'Goiânia',
    estado: 'GO',
    pais: 'Brasil',
    dataCadastro: '2026-02-15',
  },
  {
    id: 'c-9',
    nome: 'Ana Julia Nogueira',
    email: 'ana.julia@empresa.com',
    cidade: 'Recife',
    estado: 'PE',
    pais: 'Brasil',
    dataCadastro: '2026-03-10',
  },
  {
    id: 'c-10',
    nome: 'Lucas Martins Prado',
    email: 'lucas.prado@gmail.com',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    dataCadastro: '2026-04-01',
  }
];

export const PRODUTOS_INICIAIS: Produto[] = [
  {
    id: 'p-1',
    nome: 'Licença Software SaaS Pro - Anual',
    preco: 2500.00,
    estoque: 150,
    categoria: 'SaaS / Assinatura',
  },
  {
    id: 'p-2',
    nome: 'Mentoria Executiva em BI e Analytics',
    preco: 4500.00,
    estoque: 20,
    categoria: 'Treinamentos e Serviços',
  },
  {
    id: 'p-3',
    nome: 'Configuração de Servidores em Nuvem Cloud',
    preco: 1800.00,
    estoque: 45,
    categoria: 'Infraestrutura',
  },
  {
    id: 'p-4',
    nome: 'API Gateway Connector Customizado',
    preco: 950.00,
    estoque: 200,
    categoria: 'SaaS / Assinatura',
  },
  {
    id: 'p-5',
    nome: 'Monitor de Atividade em Tempo Real Enterprise',
    preco: 1200.00,
    estoque: 80,
    categoria: 'Software Desktop',
  },
  {
    id: 'p-6',
    nome: 'Suporte Técnico Premium 24/7 SLA 2h',
    preco: 3000.00,
    estoque: 100,
    categoria: 'Treinamentos e Serviços',
  },
  {
    id: 'p-7',
    nome: 'Módulo de Backup e Recuperação em Nuvem',
    preco: 850.00,
    estoque: 120,
    categoria: 'Infraestrutura',
  },
  {
    id: 'p-8',
    nome: 'Painel Dashboard Interativo Customizado',
    preco: 3500.00,
    estoque: 35,
    categoria: 'Treinamentos e Serviços',
  }
];

export const PEDIDOS_INICIAIS: Pedido[] = [
  // Carlos Eduardo Santos (c-1): Altamente Ativo, fidelizado, comprou agora em junho
  {
    id: 'ped-1',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [
      { produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }
    ],
    data: '2026-06-05', // extremamente recente (3 dias atrás)
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'concluido'
  },
  {
    id: 'ped-2',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [
      { produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 2, precoUnitario: 950.00 }
    ],
    data: '2026-03-12',
    valorTotal: 1900.00,
    categoria: 'Integração',
    status: 'concluido'
  },
  {
    id: 'ped-3',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [
      { produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }
    ],
    data: '2025-11-20',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },

  // Mariana Silva Costa (c-2): Ativa recente, comprou em maio
  {
    id: 'ped-4',
    clienteId: 'c-2',
    nomeCliente: 'Mariana Silva Costa',
    itens: [
      { produtoId: 'p-2', nomeProduto: 'Mentoria Executiva em BI e Analytics', quantidade: 1, precoUnitario: 4500.00 }
    ],
    data: '2026-05-18', // recente (3 semanas atrás)
    valorTotal: 4500.00,
    categoria: 'Treinamento',
    status: 'concluido'
  },
  {
    id: 'ped-5',
    clienteId: 'c-2',
    nomeCliente: 'Mariana Silva Costa',
    itens: [
      { produtoId: 'p-5', nomeProduto: 'Monitor de Atividade em Tempo Real Enterprise', quantidade: 1, precoUnitario: 1200.00 }
    ],
    data: '2026-01-15',
    valorTotal: 1200.00,
    categoria: 'Software',
    status: 'concluido'
  },

  // Beatriz Vasconcelos Reis (c-3): Alto Churn canônico (comprou faz tempo no ano passado, nada recente, histórico de canelamentos)
  {
    id: 'ped-6',
    clienteId: 'c-3',
    nomeCliente: 'Beatriz Vasconcelos Reis',
    itens: [
      { produtoId: 'p-3', nomeProduto: 'Configuração de Servidores em Nuvem Cloud', quantidade: 1, precoUnitario: 1800.00 }
    ],
    data: '2025-07-01', // recência > 300 dias!
    valorTotal: 1800.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },
  {
    id: 'ped-7',
    clienteId: 'c-3',
    nomeCliente: 'Beatriz Vasconcelos Reis',
    itens: [
      { produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }
    ],
    data: '2025-08-15',
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'cancelado' // cancelado!
  },

  // Roberto Azevedo Lima (c-4): Elevado churn (última compra em 2025)
  {
    id: 'ped-8',
    clienteId: 'c-4',
    nomeCliente: 'Roberto Azevedo Lima',
    itens: [
      { produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 1, precoUnitario: 950.00 }
    ],
    data: '2025-03-22', // muito antigo
    valorTotal: 950.00,
    categoria: 'Integração',
    status: 'concluido'
  },

  // Fernanda de Oliveira (c-5): Super compradora / ticket médio gigantesco
  {
    id: 'ped-9',
    clienteId: 'c-5',
    nomeCliente: 'Fernanda de Oliveira',
    itens: [
      { produtoId: 'p-2', nomeProduto: 'Mentoria Executiva em BI e Analytics', quantidade: 2, precoUnitario: 4500.00 },
      { produtoId: 'p-8', nomeProduto: 'Painel Dashboard Interativo Customizado', quantidade: 1, precoUnitario: 3500.00 }
    ],
    data: '2026-06-01', // super recente
    valorTotal: 12500.00,
    categoria: 'Plano Estratégico',
    status: 'concluido'
  },
  {
    id: 'ped-10',
    clienteId: 'c-5',
    nomeCliente: 'Fernanda de Oliveira',
    itens: [
      { produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }
    ],
    data: '2026-01-20',
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'concluido'
  },

  // John MacPherson Doe (c-6): Internacional, comprou em abril de 2026
  {
    id: 'ped-11',
    clienteId: 'c-6',
    nomeCliente: 'John MacPherson Doe',
    itens: [
      { produtoId: 'p-3', nomeProduto: 'Configuração de Servidores em Nuvem Cloud', quantidade: 2, precoUnitario: 1800.00 }
    ],
    data: '2026-04-10', // recencia ~59 dias
    valorTotal: 3600.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },

  // Isabela Souza Campos (c-7): Novo cliente do norte/nordeste
  {
    id: 'ped-12',
    clienteId: 'c-7',
    nomeCliente: 'Isabela Souza Campos',
    itens: [
      { produtoId: 'p-5', nomeProduto: 'Monitor de Atividade em Tempo Real Enterprise', quantidade: 1, precoUnitario: 1200.00 }
    ],
    data: '2026-02-10', // recencia ~120 dias
    valorTotal: 1200.00,
    categoria: 'Software',
    status: 'concluido'
  },
  {
    id: 'ped-13',
    clienteId: 'c-7',
    nomeCliente: 'Isabela Souza Campos',
    itens: [
      { produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }
    ],
    data: '2026-02-28',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'cancelado' // cancelou!
  },

  // Thiago Mendonça (c-8): Compra recente em março
  {
    id: 'ped-14',
    clienteId: 'c-8',
    nomeCliente: 'Thiago Mendonça',
    itens: [
      { produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 3, precoUnitario: 950.00 }
    ],
    data: '2026-03-15',
    valorTotal: 2850.00,
    categoria: 'Integração',
    status: 'concluido'
  },

  // Ana Julia Nogueira (c-9): Novo cliente, última em abril
  {
    id: 'ped-15',
    clienteId: 'c-9',
    nomeCliente: 'Ana Julia Nogueira',
    itens: [
      { produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }
    ],
    data: '2026-04-18',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  }

  // Lucas Martins Prado (c-10): Novo, sem pedidos ainda de forma intencional (para demonstrar scores iniciais!)
];
