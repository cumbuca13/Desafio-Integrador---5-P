# Plataforma de BI Analítico Estratégico com IA e Terminal SGBD Interativo

## 🛠️ Tecnologias Utilizadas

O ecossistema do projeto é moderno, componentizado e escalável:

- **Frontend (SPA)**:
  - **React 18** + **TypeScript**: Garantindo tipagem estática e componentização robusta.
  - **Vite**: Ferramenta de build de alta performance.
  - **Tailwind CSS**: Estilização altamente responsiva e moderna em tons escuros (*Cosmic Slate Theme*).
  - **Lucide React**: Biblioteca de ícones vetoriais dinâmicos de alta definição.
  - **Recharts**: Renderização de gráficos estatísticos (faturamento, funil e performance).
  - **Motion**: Adição de transições e micro-animações fluidas nas rotas e módulos do sistema.

- **Backend (Full-Stack Engine)**:
  - **Express**: Servidor de backend responsável por expor as APIs de coleta e persistência.
  - **tsx**: Execução dinâmica de arquivos TypeScript em modo de desenvolvimento.
  - **Esbuild**: Compilação e bundling do servidor para produção em um arquivo CJS autônomo (`dist/server.cjs`).
  - **SGBD Virtual / JSON-Server**: Sistema físico de armazenamento de arquivos em disco para persistência elástica dos dados corporativos em `./data/db.json`.

---

## 🚀 Como Executar o Projeto Localmente

Siga os seguintes passos para rodar a aplicação em seu ambiente local:

### 1. Pré-requisitos
Certifique-se de possuir o **Node.js** (versão 18 ou superior) e o **npm** instalados em sua máquina.

### 2. Instalar Dependências
No diretório raiz do projeto, execute o comando para instalar as dependências de desenvolvimento e produção:
```bash
npm install
```

### 3. Execução em Modo de Desenvolvimento
Para iniciar o servidor Express integrado ao Vite na porta `3000`:
```bash
npm run dev
```
Abra o navegador e acesse: [http://localhost:3000](http://localhost:3000).

### 4. Compilação para Produção
Para criar a build otimizada da aplicação Web e empacotar o backend Node de forma unificada:
```bash
npm run build
```

### 5. Execução em Produção
Após realizar o build, você pode rodar o aplicativo de forma standalone e isolada através do comando:
```bash
npm start
```

---

## 💡 Principais Módulos e Pontos Fortes do Sistema

### 1. Dashboard e Inteligência de Negócios (BI)
- **KPIs Estratégicos**: Exibição de cards em tempo real de faturamento bruto total, novos clientes cadastrados, nível de estoque de produtos físicos e ticket-médio das faturas.
- **Gráficos Avançados**: Acompanhamento do funil de conversão de compras, receita mensal consolidada e ranqueamento de volume de vendas por categoria de produto.
- **Auditoria de Logs**: Feed histórico em tempo real registrando adições, remoções e estornos das transações da organização.

### 2. Módulo de Suporte à Decisão (Ciência de Dados & Inteligência Artificial)
- **Previsão de Churn com Random Forest**: Modelo interativo que simula uma floresta de decisão avaliando o perfil de engajamento do cliente de maneira dinâmica através de árvores estrututuradas.
- **Mapeamento de Importância de Features (Split Tracer)**: Gráfico do percentual de contribuição das variáveis (tempo de relacionamento, ticket-médio, volume e variedade de itens adquiridos) baseado nos splits da floresta estatística sob simulação.
- **Matriz de Alocação de Retenção de Portfólio**: Compilação de clientes de forma dinâmica dividindo-os inteligentemente em *Fidelizados*, *Instáveis* e *Sobr Risco de Churn (Inativos)*, otimizando as tomadas de decisões do time analítico.

### 3. SGBD Virtual & Terminal SQL Interativo (Banco de Dados Acadêmico)
- **Consultas Relacionais Reais**: Desenvolvemos um Interpretador/Compilador de SQL em TypeScript (`/src/utils/sqlEngine.ts`) específico para fins educacionais.
- **Suporte Declarativo**: O console permite escrever comandos como:
  - Projeções de colunas com apelidos (`SELECT id, nome AS cliente FROM clientes`).
  - Junções de tabelas com chaves estrangeiras (`SELECT * FROM clientes JOIN pedidos ON clientes.id = pedidos.clienteId`).
  - Filtragens avançadas com operadores relacionais, lógicos e busca por padrões (`WHERE status = 'concluido' AND valorTotal > 1500 OR nome LIKE '%Carlos%'`).
  - Agrupamentos analíticos enriquecidos com funções agregadoras nativas (`SELECT categoria, COUNT(*), SUM(valorTotal), AVG(valorTotal) GROUP BY categoria`).
  - Ordenações e limite de tuplas (`ORDER BY valorTotal DESC LIMIT 5`).
- **Diagrama Entidade-Relacionamento (DER)**: Esquematização visual integrada contendo chaves primárias (`PK`), estrangeiras (`FK`) e tipos de dados das tabelas lógicas:
  - `tb_clientes` (Informações cadastrais)
  - `tb_produtos` (Catálogo e almoxarifado de mercadorias)
  - `tb_pedidos` (Transações corporativas)
  - `tb_itens_pedido` (Tabela pivot/ligação física N:M detalhando itens de cada fatura)

### 4. Engenharia de Persistência Híbrida e Resiliência
- **Sincronização de Estado**: Qualquer modificação (inserção de novos clientes, criação de itens, alteração de faturamento ou alteração de status/estorno de pedidos) atualiza de forma síncrona o estado local do cliente.
- **Persistência de Dados**: O sistema gerencia caminhos híbridos:
  - Se rodar de forma full-stack (servidor ativo), as mutações executam um lote atômico persistido permanentemente no arquivo `./data/db.json` em disco.
  - Se o servidor estiver offline, o sistema ativa imediatamente o fallback para o `localStorage` do navegador, não interrompendo a experiência de uso.

---
