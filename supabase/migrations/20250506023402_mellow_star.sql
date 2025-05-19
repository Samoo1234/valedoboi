/*
  # Create view for order details
  
  Creates a view that combines order information with customer and product details
  for easier querying and display.
*/

CREATE VIEW vw_pedidos_detalhados AS
SELECT 
  p.id,
  p.status,
  p.valor_total,
  p.metodo_pagamento,
  p.data_criacao,
  p.data_finalizacao,
  c.cpf_cnpj as cliente_cpf_cnpj,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  c.email as cliente_email,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ip.id,
        'quantidade', ip.quantidade,
        'peso_solicitado', ip.peso_solicitado,
        'peso_real', ip.peso_real,
        'preco_kg', ip.preco_kg,
        'valor_total', ip.valor_total,
        'produto', jsonb_build_object(
          'id', pr.id,
          'nome', pr.nome,
          'descricao', pr.descricao
        )
      )
    ) FILTER (WHERE ip.id IS NOT NULL),
    '[]'
  ) as itens
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_cpf_cnpj = c.cpf_cnpj
LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
LEFT JOIN produtos pr ON ip.produto_id = pr.id
GROUP BY p.id, c.cpf_cnpj;