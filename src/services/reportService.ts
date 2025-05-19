import { supabase } from './supabaseClient';
// import { Customer } from '../types/supabase.types'; // Remover importação por enquanto

// Interface local para resultado da busca de cliente (para autocomplete)
interface CustomerSearchResult {
  nome: string;
  cpf_cnpj: string;
}

// Interface para um item dentro do pedido (baseado na estrutura do JSON da view)
export interface ReportOrderItemData {
  id: number | string; // ID do item_pedido
  quantidade: number;
  peso_solicitado?: number | null;
  peso_real?: number | null;
  preco_kg?: number | string | null; // Pode ser string ou number
  valor_total: number | string; // Valor total do item, pode ser string
  observacao_item?: string | null;
  produto: {
    id: number | string; // ID do produto
    nome: string;
    preco_kg?: number | string | null;
  };
}

// Interface para os dados de pedido que precisamos no relatório
export interface ReportOrderData {
  id: string; // ID do pedido
  data_criacao: string;
  valor_total: number; // Valor total DO PEDIDO
  itens: ReportOrderItemData[]; // Array de itens do pedido
  // Adicione outros campos se necessário, como status
}

/**
 * Busca clientes pelo nome (case-insensitive).
 * Retorna apenas nome e cpf_cnpj para o autocomplete.
 */
export const searchCustomersByName = async (searchTerm: string): Promise<CustomerSearchResult[]> => {
  if (!searchTerm || searchTerm.trim().length < 3) { // Evita buscas com termo muito curto
    return [];
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('nome, cpf_cnpj')
    .ilike('nome', `%${searchTerm}%`) // Busca case-insensitive
    .limit(10); // Limita o número de sugestões

  if (error) {
    console.error('Erro ao buscar clientes por nome:', error);
    throw new Error('Não foi possível buscar os clientes.');
  }

  return data || [];
};

/**
 * Busca pedidos de um cliente específico (pelo CPF/CNPJ) dentro de um intervalo de datas.
 */
export const getOrdersByCpfCnpjAndDateRange = async (
  cpfCnpj: string,
  startDate: string,
  endDate: string
): Promise<ReportOrderData[]> => {
  // Adiciona a hora inicial e final para garantir a inclusão completa do dia
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;



  const { data, error } = await supabase
    .from('vw_pedidos_detalhados') // <-- BUSCAR DA VIEW
    .select('id, data_criacao, valor_total, itens') // <-- SELECIONAR COLUNAS DA VIEW (incluindo itens JSON)
    .eq('cliente_cpf_cnpj', cpfCnpj)
    .gte('data_criacao', startDateTime) // Maior ou igual a startDate
    .lte('data_criacao', endDateTime)   // Menor ou igual a endDate
    .order('data_criacao', { ascending: false }); // Ordena pelos mais recentes

  if (error) {
    throw new Error('Não foi possível buscar os pedidos detalhados do cliente.');
  }

  // Supabase já deve retornar 'itens' como array de objetos.
  // Apenas garantir que valor_total (do pedido) seja number.
  const formattedData = (data || []).map(order => ({
    ...order,
    valor_total: parseFloat(order.valor_total || '0'),
    // Opcional: Poderíamos parsear valores dentro de `itens` aqui se necessário
    // itens: order.itens.map(item => ({ ...item, valor_total: parseFloat(item.valor_total || '0') }))
  }));



  return formattedData;
};
