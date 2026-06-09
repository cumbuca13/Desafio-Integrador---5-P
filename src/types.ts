export interface Cliente {
  id: string;
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  pais: string;
  dataCadastro: string;
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  categoria?: string; // Categoria do produto (opcional)
}

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string; // Armazenado para consistência de histórico
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  nomeCliente: string; // Armazenado para facilitar visualização
  itens: ItemPedido[];
  data: string; // Formato ISO YYYY-MM-DD
  valorTotal: number;
  categoria?: string; // Um pedido pode estar associado a uma categoria de venda/estratégia
  status: 'concluido' | 'cancelado';
}

// Interfaces para o Modelo de Machine Learning (Random Forest)
export interface ClienteFeatures {
  clienteId: string;
  totalGasto: number;         // LTV parcial
  frequenciaCompras: number;  // total de pedidos concluidos
  recenciaDias: number;       // dias desde a última compra
  ticketMedio: number;        // totalGasto / frequencia
  taxaCancelamentoPedidos: number; // pedidos cancelados / total pedidos
  itensDiferentes: number;    // variedade de produtos comprados
}

export interface MLResult {
  clienteId: string;
  nomeCliente: string;
  churnRisk: number;          // 0 a 100 (%) - Propensão de Churn
  buyPropensity: number;      // 0 a 100 (%) - Propensão à Compra
  classificacao: 'Alto Risco' | 'Medio Risco' | 'Fidelizado' | 'Novo / Inativo';
  fatorPrincipalChurn: string;
  fatorPrincipalCompra: string;
  features: ClienteFeatures;
}
