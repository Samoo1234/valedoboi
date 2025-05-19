/*
  # Create detailed orders view
  
  1. New View
    - `vw_pedidos_detalhados`: Combines orders with customer details and items
      - Includes order information (id, status, total, etc)
      - Includes customer details (name, phone, email)
      - Includes order items as a JSON array
      
  2. Purpose
    - Provides a denormalized view of orders for easier querying
    - Aggregates order items into a JSON structure
    - Simplifies frontend data fetching
*/

CREATE OR REPLACE VIEW vw_pedidos_detalhados AS
SELECT 
    p.id,
    p.status,
    p.valor_total,
    p.metodo_pagamento,
    p.data_criacao,
    p.data_finalizacao,
    p.cliente_cpf_cnpj,
    c.nome as cliente_nome,
    c.telefone as cliente_telefone,
    c.email as cliente_email,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', i.id,
                'quantidade', i.quantidade,
                'peso_solicitado', i.peso_solicitado,
                'peso_real', i.peso_real,
                'preco_kg', i.preco_kg,
                'valor_total', i.valor_total,
                'produto', jsonb_build_object(
                    'id', pr.id,
                    'nome', pr.nome,
                    'preco_kg', pr.preco_kg
                )
            )
        )
        FROM itens_pedido i
        LEFT JOIN produtos pr ON i.produto_id = pr.id
        WHERE i.pedido_id = p.id
    ) as itens
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_cpf_cnpj = c.cpf_cnpj;