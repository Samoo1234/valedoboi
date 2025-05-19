import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';

export type Order = Database['public']['Tables']['pedidos']['Row'];
export type InsertOrder = Database['public']['Tables']['pedidos']['Insert'];
export type UpdateOrder = Database['public']['Tables']['pedidos']['Update'];
export type OrderItem = Database['public']['Tables']['itens_pedido']['Row'];
export type InsertOrderItem = Database['public']['Tables']['itens_pedido']['Insert'];

export type OrderStatus = 'efetuado' | 'em_separacao' | 'finalizado';

// Type for items coming from the weighing modal, used in store and passed to service
export interface UpdatedOrderItem {
  id: string; // This is the itens_pedido.id
  // produto_id: string; // Not strictly needed for update if id is unique item id
  weighedQuantity: string; 
  calculatedItemTotal: number;
  // We might not need other fields like produto.nome or preco_kg for the update operation itself,
  // as we are primarily updating weights and totals based on the item's ID.
}

export type OrderWithDetails = {
  id: string;
  status: OrderStatus;
  valor_total: number;
  metodo_pagamento: string | null;
  data_criacao: string;
  data_finalizacao: string | null;
  cliente_cpf_cnpj: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  observacao: string | null;
  itens: Array<{
    id: string;
    quantidade: number;
    peso_solicitado: number | null;
    peso_real: number | null;
    preco_kg: number;
    valor_total: number;
    observacao_item: string | null;
    produto: {
      id: string;
      nome: string;
      preco_kg: number;
      unidade_medida: string;
    };
  }>;
};

export const getOrders = async (): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('vw_pedidos_detalhados')
    .select('*')
    .order('data_criacao', { ascending: false });
  
  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
  
  return data || [];
};

export const getOrdersByStatus = async (status: OrderStatus): Promise<OrderWithDetails[]> => {
  const { data, error } = await supabase
    .from('vw_pedidos_detalhados')
    .select('*')
    .eq('status', status)
    .order('data_criacao', { ascending: false });
  
  if (error) {
    console.error(`Error fetching orders with status ${status}:`, error);
    throw error;
  }
  
  return data || [];
};

export const getOrderById = async (id: string): Promise<OrderWithDetails | null> => {
  const { data, error } = await supabase
    .from('vw_pedidos_detalhados')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createOrder = async (
  order: InsertOrder, 
  orderItems: InsertOrderItem[]
): Promise<Order> => {
  const { data, error } = await supabase
    .from('pedidos')
    .insert(order)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  
  const itemsWithOrderId = orderItems.map(item => ({
    ...item,
    pedido_id: data.id
  }));
  
  const { error: itemsError } = await supabase
    .from('itens_pedido')
    .insert(itemsWithOrderId);
  
  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw itemsError;
  }
  
  return data;
};

export const updateOrderStatus = async (
  id: string, 
  status: OrderStatus
): Promise<Order> => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating order status for id ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const updateOrderItemsAndStatus = async (
  orderId: string,
  updatedItems: UpdatedOrderItem[],
  newOrderTotal: number,
  newStatus: OrderStatus
): Promise<void> => {
  // 1. Update individual order items (itens_pedido table)
  const itemUpdatesPromises = updatedItems.map(item => {
    const wqStr = item.weighedQuantity.replace(',', '.');
    const parsedWeight = parseFloat(wqStr);
    const finalPesoReal = isNaN(parsedWeight) ? null : parsedWeight;

    return supabase
      .from('itens_pedido')
      .update({
        peso_real: finalPesoReal,
        valor_total: item.calculatedItemTotal,
      })
      .eq('id', item.id); // Assuming item.id is the PK of itens_pedido
  });

  const itemUpdateResults = await Promise.all(itemUpdatesPromises);
  itemUpdateResults.forEach(result => {
    if (result.error) {
      console.error('Error updating order item:', result.error);
      // In a real app, you might want to collect all errors or handle rollback
      throw new Error(`Failed to update item: ${result.error.message}`);
    }
  });

  // 2. Update the main order (pedidos table)
  const { error: orderUpdateError } = await supabase
    .from('pedidos')
    .update({
      valor_total: newOrderTotal,
      status: newStatus,
    })
    .eq('id', orderId);

  if (orderUpdateError) {
    console.error('Error updating order:', orderUpdateError);
    throw new Error(`Failed to update order: ${orderUpdateError.message}`);
  }
  // No return value needed if successful, void is fine.
};

export const deleteOrder = async (id: string): Promise<void> => {
  const { error: itemsError } = await supabase
    .from('itens_pedido')
    .delete()
    .eq('pedido_id', id);
  
  if (itemsError) {
    console.error(`Error deleting order items for order id ${id}:`, itemsError);
    throw itemsError;
  }
  
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting order with id ${id}:`, error);
    throw error;
  }
};