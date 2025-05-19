/*
  # Initial schema for butcher shop order management system

  1. New Tables
    - `produtos` (Products)
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `preco_kg` (numeric)
      - `descricao` (text, nullable)
      - `disponivel` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `clientes` (Customers)
      - `cpf_cnpj` (text, primary key)
      - `nome` (text)
      - `telefone` (text)
      - `email` (text, nullable)
      - `endereco` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pedidos` (Orders)
      - `id` (uuid, primary key)
      - `cliente_cpf_cnpj` (text, foreign key)
      - `status` (text)
      - `valor_total` (numeric)
      - `metodo_pagamento` (text, nullable)
      - `data_criacao` (timestamp)
      - `data_finalizacao` (timestamp, nullable)
    
    - `itens_pedido` (Order Items)
      - `id` (uuid, primary key)
      - `pedido_id` (uuid, foreign key)
      - `produto_id` (uuid, foreign key)
      - `quantidade` (numeric)
      - `peso_solicitado` (numeric, nullable)
      - `peso_real` (numeric, nullable)
      - `preco_kg` (numeric)
      - `valor_total` (numeric, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create produtos table
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text UNIQUE NOT NULL,
  preco_kg numeric(10,2) NOT NULL,
  descricao text,
  disponivel boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  cpf_cnpj text PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  endereco text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pedidos table
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_cpf_cnpj text REFERENCES clientes(cpf_cnpj),
  status text NOT NULL,
  valor_total numeric(10,2) NOT NULL,
  metodo_pagamento text,
  data_criacao timestamptz DEFAULT now(),
  data_finalizacao timestamptz
);

-- Create itens_pedido table
CREATE TABLE IF NOT EXISTS itens_pedido (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id uuid REFERENCES pedidos(id),
  produto_id uuid REFERENCES produtos(id),
  quantidade numeric(10,3) NOT NULL,
  peso_solicitado numeric(10,3),
  peso_real numeric(10,3),
  preco_kg numeric(10,2) NOT NULL,
  valor_total numeric(10,2)
);

-- Enable Row Level Security
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON produtos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON produtos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON clientes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON pedidos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON pedidos
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON itens_pedido
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON itens_pedido
  FOR ALL TO authenticated USING (true);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();