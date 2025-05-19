import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';

export type Customer = Database['public']['Tables']['clientes']['Row'];
export type InsertCustomer = Database['public']['Tables']['clientes']['Insert'];
export type UpdateCustomer = Database['public']['Tables']['clientes']['Update'];

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome');
  
  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
  
  return data || [];
};

export const getCustomerById = async (cpf_cnpj: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cpf_cnpj', cpf_cnpj)
    .single();
  
  if (error) {
    console.error(`Error fetching customer with CPF/CNPJ ${cpf_cnpj}:`, error);
    throw error;
  }
  
  return data;
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .or(`nome.ilike.*${query}*,email.ilike.*${query}*,telefone.ilike.*${query}*,cpf_cnpj.ilike.*${query}*`)
    .order('nome');
  
  if (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
  
  return data || [];
};

export const createCustomer = async (customer: InsertCustomer): Promise<Customer> => {
  const { data, error } = await supabase
    .from('clientes')
    .insert(customer)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
  
  return data;
};

export const updateCustomer = async (cpf_cnpj: string, customer: UpdateCustomer): Promise<Customer> => {
  const { data, error } = await supabase
    .from('clientes')
    .update(customer)
    .eq('cpf_cnpj', cpf_cnpj)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating customer with CPF/CNPJ ${cpf_cnpj}:`, error);
    throw error;
  }
  
  return data;
};

export const deleteCustomer = async (cpf_cnpj: string): Promise<void> => {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('cpf_cnpj', cpf_cnpj);
  
  if (error) {
    console.error(`Error deleting customer with CPF/CNPJ ${cpf_cnpj}:`, error);
    throw error;
  }
};