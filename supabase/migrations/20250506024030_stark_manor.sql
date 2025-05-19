/*
  # Update orders view

  Updates the vw_pedidos_detalhados view to include all necessary fields for the order card display.

  1. Changes
    - Simplified the view structure
    - Added missing fields
    - Improved JSON aggregation for order items
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
    COALESCE(
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
                ) ORDER BY i.id
            )
            FROM itens_pedido i
            LEFT JOIN produtos pr ON i.produto_id = pr.id
            WHERE i.pedido_id = p.id
        ),
        '[]'::jsonb
    ) as itens
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_cpf_cnpj = c.cpf_cnpj
ORDER BY p.data_criacao DESC;