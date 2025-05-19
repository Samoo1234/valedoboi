import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';

export type Product = Database['public']['Tables']['produtos']['Row'];
export type InsertProduct = Database['public']['Tables']['produtos']['Insert'];
export type UpdateProduct = Database['public']['Tables']['produtos']['Update'];

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome');
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data || [];
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
  
  return data;
};

export const createProduct = async (product: InsertProduct): Promise<Product> => {
  const { data, error } = await supabase
    .from('produtos')
    .insert(product)
    .select()
    .single();
  
  if (error) {
    console.error('[productService] Error creating product:', error); // Mantido log de erro do serviço
    throw error;
  }
  return data;
};

export const updateProduct = async (id: string, product: UpdateProduct): Promise<Product> => {
  const { data, error } = await supabase
    .from('produtos')
    .update(product)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`[productService] Error updating product with id ${id}:`, error); // Mantido log de erro do serviço
    throw error;
  }
  return data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw error;
  }
};