/*
  # Seed test data
  
  1. Changes
    - Add test products if they don't exist
    - Add test customer
    - Add test order with items
    
  2. Notes
    - Uses IF NOT EXISTS checks to prevent duplicate key violations
    - Handles existing data gracefully
*/

-- Inserir produtos de teste apenas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Alcatra') THEN
    INSERT INTO produtos (nome, preco_kg, descricao, disponivel)
    VALUES ('Alcatra', 69.90, 'Corte bovino premium', true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Filé Mignon') THEN
    INSERT INTO produtos (nome, preco_kg, descricao, disponivel)
    VALUES ('Filé Mignon', 99.90, 'Corte bovino macio', true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Costela') THEN
    INSERT INTO produtos (nome, preco_kg, descricao, disponivel)
    VALUES ('Costela', 49.90, 'Costela bovina', true);
  END IF;
END $$;

-- Inserir cliente de teste
INSERT INTO clientes (cpf_cnpj, nome, telefone, email)
VALUES ('12345678900', 'Ana Ferreira', '11999999999', 'ana@email.com')
ON CONFLICT (cpf_cnpj) DO NOTHING;

-- Inserir pedido de teste
WITH novo_pedido AS (
  INSERT INTO pedidos (cliente_cpf_cnpj, status, valor_total, metodo_pagamento)
  VALUES ('12345678900', 'completed', 459.40, 'dinheiro')
  RETURNING id
)
INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_kg, valor_total)
SELECT 
  novo_pedido.id,
  p.id,
  CASE 
    WHEN p.nome = 'Alcatra' THEN 3
    WHEN p.nome = 'Filé Mignon' THEN 2
    ELSE 1
  END as quantidade,
  p.preco_kg,
  CASE 
    WHEN p.nome = 'Alcatra' THEN 3 * p.preco_kg
    WHEN p.nome = 'Filé Mignon' THEN 2 * p.preco_kg
    ELSE 1 * p.preco_kg
  END as valor_total
FROM novo_pedido, produtos p
WHERE p.nome IN ('Alcatra', 'Filé Mignon', 'Costela');