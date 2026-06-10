/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'reflect-metadata';
import { Injectable, Controller, Get, Post, Body, Module, Inject } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Dados padrão iniciais (Seed corporativa) para hidratar o SGBD caso o arquivo não exista
const CLIENTES_PADRAO = [
  { id: 'c-1', nome: 'Carlos Eduardo Santos', email: 'carlos.eduardo@empresa.com', cidade: 'São Paulo', estado: 'SP', pais: 'Brasil', dataCadastro: '2025-10-15' },
  { id: 'c-2', nome: 'Mariana Silva Costa', email: 'mariana.costa@gmail.com', cidade: 'Rio de Janeiro', estado: 'RJ', pais: 'Brasil', dataCadastro: '2025-11-01' },
  { id: 'c-3', nome: 'Beatriz Vasconcelos Reis', email: 'beatriz.reis@outlook.com', cidade: 'Belo Horizonte', estado: 'MG', pais: 'Brasil', dataCadastro: '2025-06-20' },
  { id: 'c-4', nome: 'Roberto Azevedo Lima', email: 'roberto.lima@uol.com.br', cidade: 'Porto Alegre', estado: 'RS', pais: 'Brasil', dataCadastro: '2025-02-10' },
  { id: 'c-5', nome: 'Fernanda de Oliveira', email: 'fernanda.oliveira@empresa.com', cidade: 'Curitiba', estado: 'PR', pais: 'Brasil', dataCadastro: '2025-12-05' },
  { id: 'c-6', nome: 'John MacPherson Doe', email: 'john.doe@globalcorp.com', cidade: 'Miami', estado: 'FL', pais: 'Estados Unidos', dataCadastro: '2025-08-11' },
  { id: 'c-7', nome: 'Isabela Souza Campos', email: 'isabela.campos@bol.com.br', cidade: 'Salvador', estado: 'BA', pais: 'Brasil', dataCadastro: '2026-01-20' },
  { id: 'c-8', nome: 'Thiago Mendonça', email: 'thiago.mendonca@yahoo.com', cidade: 'Goiânia', estado: 'GO', pais: 'Brasil', dataCadastro: '2026-02-15' },
  { id: 'c-9', nome: 'Ana Julia Nogueira', email: 'ana.julia@empresa.com', cidade: 'Recife', estado: 'PE', pais: 'Brasil', dataCadastro: '2026-03-10' },
  { id: 'c-10', nome: 'Lucas Martins Prado', email: 'lucas.prado@gmail.com', cidade: 'São Paulo', estado: 'SP', pais: 'Brasil', dataCadastro: '2026-04-01' }
];

const PRODUTOS_PADRAO = [
  { id: 'p-1', nome: 'Licença Software SaaS Pro - Anual', preco: 2500.00, estoque: 150, categoria: 'SaaS / Assinatura' },
  { id: 'p-2', nome: 'Mentoria Executiva em BI e Analytics', preco: 4500.00, estoque: 20, categoria: 'Treinamentos e Serviços' },
  { id: 'p-3', nome: 'Configuração de Servidores em Nuvem Cloud', preco: 1800.00, estoque: 45, categoria: 'Infraestrutura' },
  { id: 'p-4', nome: 'API Gateway Connector Customizado', preco: 950.00, estoque: 200, categoria: 'SaaS / Assinatura' },
  { id: 'p-5', nome: 'Monitor de Atividade em Tempo Real Enterprise', preco: 1200.00, estoque: 80, categoria: 'Software Desktop' },
  { id: 'p-6', nome: 'Suporte Técnico Premium 24/7 SLA 2h', preco: 3000.00, estoque: 100, categoria: 'Treinamentos e Serviços' },
  { id: 'p-7', nome: 'Módulo de Backup e Recuperação em Nuvem', preco: 850.00, estoque: 120, categoria: 'Infraestrutura' },
  { id: 'p-8', nome: 'Painel Dashboard Interativo Customizado', preco: 3500.00, estoque: 35, categoria: 'Treinamentos e Serviços' }
];

const PEDIDOS_PADRAO = [
  {
    id: 'ped-1',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [{ produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }],
    data: '2026-06-05',
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'concluido'
  },
  {
    id: 'ped-2',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [{ produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 2, precoUnitario: 950.00 }],
    data: '2026-03-12',
    valorTotal: 1900.00,
    categoria: 'Integração',
    status: 'concluido'
  },
  {
    id: 'ped-3',
    clienteId: 'c-1',
    nomeCliente: 'Carlos Eduardo Santos',
    itens: [{ produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }],
    data: '2025-11-20',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },
  {
    id: 'ped-4',
    clienteId: 'c-2',
    nomeCliente: 'Mariana Silva Costa',
    itens: [{ produtoId: 'p-2', nomeProduto: 'Mentoria Executiva em BI e Analytics', quantidade: 1, precoUnitario: 4500.00 }],
    data: '2026-05-18',
    valorTotal: 4500.00,
    categoria: 'Treinamento',
    status: 'concluido'
  },
  {
    id: 'ped-5',
    clienteId: 'c-2',
    nomeCliente: 'Mariana Silva Costa',
    itens: [{ produtoId: 'p-5', nomeProduto: 'Monitor de Atividade em Tempo Real Enterprise', quantidade: 1, precoUnitario: 1200.00 }],
    data: '2026-01-15',
    valorTotal: 1200.00,
    categoria: 'Software',
    status: 'concluido'
  },
  {
    id: 'ped-6',
    clienteId: 'c-3',
    nomeCliente: 'Beatriz Vasconcelos Reis',
    itens: [{ produtoId: 'p-3', nomeProduto: 'Configuração de Servidores em Nuvem Cloud', quantidade: 1, precoUnitario: 1800.00 }],
    data: '2025-07-01',
    valorTotal: 1800.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },
  {
    id: 'ped-7',
    clienteId: 'c-3',
    nomeCliente: 'Beatriz Vasconcelos Reis',
    itens: [{ produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }],
    data: '2025-08-15',
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'cancelado'
  },
  {
    id: 'ped-8',
    clienteId: 'c-4',
    nomeCliente: 'Roberto Azevedo Lima',
    itens: [{ produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 1, precoUnitario: 950.00 }],
    data: '2025-03-22',
    valorTotal: 950.00,
    categoria: 'Integração',
    status: 'concluido'
  },
  {
    id: 'ped-9',
    clienteId: 'c-5',
    nomeCliente: 'Fernanda de Oliveira',
    itens: [
      { produtoId: 'p-2', nomeProduto: 'Mentoria Executiva em BI e Analytics', quantidade: 2, precoUnitario: 4500.00 },
      { produtoId: 'p-8', nomeProduto: 'Painel Dashboard Interativo Customizado', quantidade: 1, precoUnitario: 3500.00 }
    ],
    data: '2026-06-01',
    valorTotal: 12500.00,
    categoria: 'Plano Estratégico',
    status: 'concluido'
  },
  {
    id: 'ped-10',
    clienteId: 'c-5',
    nomeCliente: 'Fernanda de Oliveira',
    itens: [{ produtoId: 'p-1', nomeProduto: 'Licença Software SaaS Pro - Anual', quantidade: 1, precoUnitario: 2500.00 }],
    data: '2026-01-20',
    valorTotal: 2500.00,
    categoria: 'Empresarial',
    status: 'concluido'
  },
  {
    id: 'ped-11',
    clienteId: 'c-6',
    nomeCliente: 'John MacPherson Doe',
    itens: [{ produtoId: 'p-3', nomeProduto: 'Configuração de Servidores em Nuvem Cloud', quantidade: 2, precoUnitario: 1800.00 }],
    data: '2026-04-10',
    valorTotal: 3600.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  },
  {
    id: 'ped-12',
    clienteId: 'c-7',
    nomeCliente: 'Isabela Souza Campos',
    itens: [{ produtoId: 'p-5', nomeProduto: 'Monitor de Atividade em Tempo Real Enterprise', quantidade: 1, precoUnitario: 1200.00 }],
    data: '2026-02-10',
    valorTotal: 1200.00,
    categoria: 'Software',
    status: 'concluido'
  },
  {
    id: 'ped-13',
    clienteId: 'c-7',
    nomeCliente: 'Isabela Souza Campos',
    itens: [{ produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }],
    data: '2026-02-28',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'cancelado'
  },
  {
    id: 'ped-14',
    clienteId: 'c-8',
    nomeCliente: 'Thiago Mendonça',
    itens: [{ produtoId: 'p-4', nomeProduto: 'API Gateway Connector Customizado', quantidade: 3, precoUnitario: 950.00 }],
    data: '2026-03-15',
    valorTotal: 2850.00,
    categoria: 'Integração',
    status: 'concluido'
  },
  {
    id: 'ped-15',
    clienteId: 'c-9',
    nomeCliente: 'Ana Julia Nogueira',
    itens: [{ produtoId: 'p-7', nomeProduto: 'Módulo de Backup e Recuperação em Nuvem', quantidade: 1, precoUnitario: 850.00 }],
    data: '2026-04-18',
    valorTotal: 850.00,
    categoria: 'Infraestrutura',
    status: 'concluido'
  }
];

@Injectable()
export class DataService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly dataFile = path.join(this.dataDir, 'db.json');

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.dataFile)) {
      const defaultData = {
        clientes: CLIENTES_PADRAO,
        produtos: PRODUTOS_PADRAO,
        pedidos: PEDIDOS_PADRAO
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2), 'utf-8');
      console.log('Banco de dados inicializado em ' + this.dataFile);
    }
  }

  readDatabase() {
    try {
      this.initDatabase();
      const raw = fs.readFileSync(this.dataFile, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Erro lendo db.json:', err);
      return { clientes: CLIENTES_PADRAO, produtos: PRODUTOS_PADRAO, pedidos: PEDIDOS_PADRAO };
    }
  }

  writeDatabase(data: any) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Erro gravando db.json:', err);
      return false;
    }
  }
}

@Controller('api')
export class DataController {
  constructor(@Inject(DataService) private readonly dataService: DataService) {}

  @Get('data')
  getData() {
    return this.dataService.readDatabase();
  }

  @Post('data')
  saveData(@Body() body: any) {
    const { clientes, produtos, pedidos } = body;
    
    console.log('[SGBD SINC API] Recebida requisição de sincronização (POST /api/data):');
    console.log(` -> Clientes recebidos: ${clientes?.length ?? 0}`);
    console.log(` -> Produtos recebidos: ${produtos?.length ?? 0}`);
    console.log(` -> Pedidos recebidos: ${pedidos?.length ?? 0}`);
    
    if (!Array.isArray(clientes) || !Array.isArray(produtos) || !Array.isArray(pedidos)) {
      console.warn('[SGBD SINC API] Erro: Corpo da requisição com formato de arrays inválido.');
      return { error: 'Formato inválido dos arrays do SGBD de persistência.' };
    }

    const success = this.dataService.writeDatabase({ clientes, produtos, pedidos });
    
    if (success) {
      console.log('[SGBD SINC API] Dados gravados com sucesso no arquivo local /data/db.json!');
      return { ok: true, message: 'Dados gravados com sucesso física e permanentemente no SGBD servidor.' };
    } else {
      console.error('[SGBD SINC API] Erro crítico ao tentar gravar /data/db.json.');
      throw new Error('Erro de E/S gravando o banco de dados no disco do servidor.');
    }
  }

  @Get('status')
  getStatus() {
    return { status: 'online', mode: 'fullstack', engine: 'NestJS Framework / SQLite Virtual JSON SGBD' };
  }
}

@Module({
  controllers: [DataController],
  providers: [DataService],
})
export class AppModule {}

async function startServer() {
  try {
    console.log('[NestJS Bootstrap] Iniciando processo de criação da aplicação...');
    // Desativando o body parser padrão do NestJS para evitar dupla decodificação e permitir o limite de 20mb de forma limpa
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
    console.log('[NestJS Bootstrap] Aplicação Nest criada com sucesso.');
    
    // Limites aumentados para uploads e sincronização de dados grandes
    app.use(express.json({ limit: '20mb' }));
    app.use(express.urlencoded({ extended: true, limit: '20mb' }));

    const expressInstance = app.getHttpAdapter().getInstance();

    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      expressInstance.use((req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        vite.middlewares(req, res, next);
      });
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      console.log('[NestJS Bootstrap] Configurando arquivos estáticos de produção a partir de:', distPath);
      expressInstance.use(express.static(distPath));
      expressInstance.get('*all', (req: Request, res: Response, next: any) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    console.log(`[NestJS Bootstrap] Tentando escutar na porta ${PORT} com host 0.0.0.0...`);
    await app.listen(PORT, '0.0.0.0');
    console.log(`[NestJS Full-Stack Server] SGBD persistente ativo na porta http://localhost:${PORT}`);
  } catch (err) {
    console.error('[NestJS Bootstrap FATAL ERROR]', err);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('[NestJS Top-Level Hook FATAL ERROR]', err);
  process.exit(1);
});
