import { OrderWithDetails } from '../services/orderService';

// Semáforo para a impressão do Cupom Fiscal/Finalizado
let isCupomPrintingSemaphore = false;
// Semáforo para a impressão da Comanda de Produção
let isComandaPrintingSemaphore = false;

// Função para gerar o HTML do Cupom Fiscal/Finalizado
const generateCupomHtml = (orderToPrint: OrderWithDetails): string => {
  return `
  <html>
  <head>
    <title>Cupom de Pedido</title>
    <style>
      body {
        font-family: 'Courier New', Courier, monospace;
        width: 300px; /* Largura comum para impressoras térmicas */
        margin: 0;
        padding: 5px;
        font-size: 10px;
      }
      .header, .footer {
        text-align: center;
        margin-bottom: 10px;
      }
      .info-pedido, .itens-pedido, .totais {
        margin-bottom: 10px;
      }
      .info-pedido p, .itens-pedido p, .totais p {
        margin: 2px 0;
      }
      .itens-pedido table {
        width: 100%;
        border-collapse: collapse;
      }
      .itens-pedido th, .itens-pedido td {
        border-bottom: 1px dashed #ccc;
        padding: 2px 5px; /* Added horizontal padding */
        text-align: left;
        font-size: 10px;
      }
      .itens-pedido th:last-child, .itens-pedido td:last-child {
        text-align: right;
        font-size: 10px;
      }
      .totais hr {
        border: none;
        border-top: 1px dashed #ccc;
        margin: 5px 0;
        font-size: 10px;
      }
      .bold {
        font-weight: bold;
        font-size: 10px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <p class="bold">AÇOUGUE EXPRESS</p>
      <p>Rua das Palmeiras, 123 - Centro</p>
      <p>Tel: (99) 99999-9999</p>
      <p>CNPJ: 12.345.678/0001-99</p>
      <p>-------------------------------</p>
      <p class="bold">CUPOM NÃO FISCAL</p>
      <p>-------------------------------</p>
    </div>

    <div class="info-pedido">
      <p>Pedido: #${orderToPrint.id.substring(0, 8)}</p>
      <p>Data: ${new Date(orderToPrint.data_criacao).toLocaleString('pt-BR')}</p>
      <p>Cliente: ${orderToPrint.cliente_nome || 'Não informado'}</p>
      ${orderToPrint.cliente_cpf_cnpj ? `<p>CPF/CNPJ: ${orderToPrint.cliente_cpf_cnpj}</p>` : ''}
    </div>

    <div class="itens-pedido">
      <p class="bold">ITENS DO PEDIDO:</p>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtde/Peso</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${orderToPrint.itens.map(item => `
            <tr>
              <td>${item.produto.nome}</td>
              <td>${item.peso_real ? `${item.peso_real.toFixed(3)}kg` : (item.quantidade || 'N/A')}</td>
              <td>R$${item.preco_kg?.toFixed(2) || 'N/A'}</td>
              <td>R$${item.valor_total?.toFixed(2) || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="totais">
      <p>-------------------------------</p>
      <p>Valor Total: <span class="bold">R$${(orderToPrint.itens.reduce((acc, item) => acc + (item.valor_total || 0), 0)).toFixed(2)}</span></p>
      ${orderToPrint.metodo_pagamento ? `<p>Pagamento: ${orderToPrint.metodo_pagamento}</p>` : ''}
      <p>-------------------------------</p>
    </div>

    <div class="footer">
      <p>Obrigado pela preferência!</p>
      <p>Volte Sempre!</p>
    </div>
  </body>
  </html>
  `;
};

// Função para gerar o HTML da Comanda de Produção
const generateComandaHtml = (orderToPrint: OrderWithDetails): string => {
  return `
  <html>
  <head>
    <title>Comanda de Produção</title>
    <style>
      body {
        font-family: 'Courier New', Courier, monospace; /* Monospaced font for better alignment */
        width: 280px; /* Adjust as needed */
        margin: 0 auto;
        padding: 10px;
        font-size: 10px; /* Smaller font for more content */
        line-height: 1.4;
      }
      .center-text {
        text-align: center;
      }
      .bold {
        font-weight: bold;
      }
      .divider {
        margin-top: 5px;
        margin-bottom: 5px;
      }
      .item-table {
        width: 100%;
        margin-top: 5px; 
        font-size: 10px;
      }
      .item-table th, .item-table td {
        text-align: left;
        padding: 2px 0;
        font-size: 10px;
      }
      .item-table .col-produto {
        width: 70%; /* Adjust as needed */
      }
      .item-table .col-qtde {
        width: 30%; /* Adjust as needed */
        text-align: right;
        font-size: 10px;
      }
      .observacoes-pedido {
        margin-top: 10px;
        padding-top: 5px;
        border-top: 1px dashed #000;
        font-size: 10px;
      }
    </style>
  </head>
  <body>
    <div class="divider center-text">-------------------------------</div>
    <div class="center-text bold">PEDIDO #${orderToPrint.id.toUpperCase().substring(0, 8)}</div>
    <div class="divider center-text">-------------------------------</div>
    <div>Data: ${new Date(orderToPrint.data_criacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
    <div>Cliente: ${orderToPrint.cliente_nome || 'N/A'}</div>
    
    <div class="bold" style="margin-top: 10px;">ITENS DO PEDIDO:</div>
    <table class="item-table">
      <thead>
        <tr>
          <th class="col-produto">Produto</th>
          <th class="col-qtde">Qtde/Peso</th>
        </tr>
      </thead>
      <tbody>
        ${orderToPrint.itens.map(item => `
          <tr>
            <td class="col-produto">${item.produto.nome}</td>
            <td class="col-qtde">${item.peso_real ? `${item.peso_real.toFixed(3)}` : (item.quantidade || 'N/A')}${item.produto.unidade_medida === 'KG' && item.peso_real ? '' : (item.produto.unidade_medida === 'UN' ? ' UN' : '')}</td>
          </tr>
          ${item.observacao_item ? `<tr><td colspan="2" style="font-size:10px; padding-left: 10px;">Obs: ${item.observacao_item}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>

    ${orderToPrint.observacao ? `
    <div class="observacoes-pedido">
      <span class="bold">Observações do Pedido:</span> ${orderToPrint.observacao}
    </div>` : ''}

  </body>
  </html>
  `;
};

// Função principal para imprimir o Cupom Fiscal/Finalizado
export const printOrderCupom = (orderToPrint: OrderWithDetails): void => {

  if (!orderToPrint || !orderToPrint.itens || orderToPrint.itens.length === 0 || !orderToPrint.cliente_nome) {
    console.warn('[PrintUtils_Cupom] Dados incompletos para impressão de cupom:', orderToPrint);
    return;
  }

  const cupomHtml = generateCupomHtml(orderToPrint);


  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'Cupom de Impressão');

  iframe.onload = function() {

    if (isCupomPrintingSemaphore) {

      if (iframe.src && iframe.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframe.src);
      }
      setTimeout(() => {
        if (iframe.parentNode === document.body) {
          document.body.removeChild(iframe);
        }
      }, 500);
      return;
    }
    
    if (iframe.contentWindow) {
      isCupomPrintingSemaphore = true;

      iframe.contentWindow.focus(); 
      iframe.contentWindow.print();
      
      setTimeout(() => {

        if (iframe.src && iframe.src.startsWith('blob:')) {
          URL.revokeObjectURL(iframe.src);
        }
        if (iframe.parentNode === document.body) {
          document.body.removeChild(iframe);
        }
        isCupomPrintingSemaphore = false; 

      }, 1000);
    } else {
      console.error('[PrintUtils_Cupom] iframe.onload: contentWindow é nulo.');
      if (iframe.src && iframe.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframe.src); 
      }
      isCupomPrintingSemaphore = false; 
    }
  };
  

  try {
    const blob = new Blob([cupomHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

  } catch (error) {
    console.error('[PrintUtils_Cupom] Erro ao criar Blob URL ou definir src do iframe:', error);
    if (iframe.parentNode === document.body) { document.body.removeChild(iframe); }
  }

};

// Função principal para imprimir a Comanda de Produção
export const printOrderComanda = (orderToPrint: OrderWithDetails): void => {

  if (!orderToPrint || !orderToPrint.itens || orderToPrint.itens.length === 0) {
    console.warn('[PrintUtils_Comanda] Dados incompletos para impressão de comanda (sem itens?):', orderToPrint);
    return;
  }

  const comandaHtml = generateComandaHtml(orderToPrint);


  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'Comanda de Impressão');

  iframe.onload = function() {

    if (isComandaPrintingSemaphore) {

      if (iframe.src && iframe.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframe.src);
      }
      setTimeout(() => {
        if (iframe.parentNode === document.body) {
          document.body.removeChild(iframe);
        }
      }, 500);
      return;
    }
    
    if (iframe.contentWindow) {
      isComandaPrintingSemaphore = true;

      iframe.contentWindow.focus(); 
      iframe.contentWindow.print();
      
      setTimeout(() => {

        if (iframe.src && iframe.src.startsWith('blob:')) {
          URL.revokeObjectURL(iframe.src);
        }
        if (iframe.parentNode === document.body) {
          document.body.removeChild(iframe);
        }
        isComandaPrintingSemaphore = false; 

      }, 1000);
    } else {
      console.error('[PrintUtils_Comanda] iframe.onload: contentWindow é nulo.');
      if (iframe.src && iframe.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframe.src); 
      }
      isComandaPrintingSemaphore = false; 
    }
  };


  try {
    const blob = new Blob([comandaHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

  } catch (error) {
    console.error('[PrintUtils_Comanda] Erro ao criar Blob URL ou definir src do iframe:', error);
    if (iframe.parentNode === document.body) { document.body.removeChild(iframe); }
  }

};
