import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please add them to .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// Verificação adicional de segurança
const isValidServiceKey = (key: string) => {
  // Verifica se a chave tem o formato esperado de um JWT
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return key && jwtRegex.test(key) && key !== supabaseAnonKey;
};

if (!supabaseServiceKey) {
  console.error('VITE_SUPABASE_SERVICE_KEY não configurada. Operações administrativas não funcionarão.');
}

if (supabaseServiceKey && !isValidServiceKey(supabaseServiceKey)) {
  console.error('VITE_SUPABASE_SERVICE_KEY inválida. Verifique a chave no painel do Supabase.');
}

export const supabaseAdmin = supabaseServiceKey && isValidServiceKey(supabaseServiceKey)
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null;