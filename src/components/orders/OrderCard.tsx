import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { OrderWithDetails, OrderStatus } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer } from 'lucide-react';
import { printOrderCupom, printOrderComanda } from '../../utils/printUtils';

interface OrderCardProps {
  order: OrderWithDetails;
  onClick?: (order: OrderWithDetails) => void;
  isDragging?: boolean;
  status: OrderStatus;
}

// Map status IDs to Tailwind CSS classes for the left border
const statusToBorderColor: Record<OrderStatus, string> = {
  efetuado: 'border-l-yellow-400',
  em_separacao: 'border-l-blue-500', // Renamed from aguardando_separacao
  // separado entry removed
  finalizado: 'border-l-green-500',
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, isDragging, status }) => {
  const { id, cliente_nome, itens, valor_total, data_criacao } = order;
  
  // Ensure itens is an array, defaulting to empty if not.
  const orderItems = Array.isArray(itens) ? itens : [];
  const borderColorClass = statusToBorderColor[status] || statusToBorderColor.efetuado; // Fallback to efetuado's border color

  const handlePrintOrder = (event: React.MouseEvent, orderToPrint: OrderWithDetails) => {
    event.stopPropagation(); // Impede que o onClick do card (abrir modal) seja acionado
    if (status === 'efetuado') {
      printOrderComanda(orderToPrint);
    } else {
      printOrderCupom(orderToPrint);
    }
  };

  return (
    <Card 
      className={`
        mb-3 transition-all duration-200 
        border-l-4 ${borderColorClass} bg-white 
        ${isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'} 
      `}
      // onClick will be handled to open modal if status is 'aguardando_separacao'
      // For other cases, it might be a general onClick or nothing if not draggable.
      onClick={() => {
        if (onClick) {
          onClick(order);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{cliente_nome}</h3>
            <span className="text-sm text-red-600">#{id.substring(0, 4)}</span>
          </div>
          {/* Botão de Imprimir Cupom */} 
          <button 
            onClick={(e) => handlePrintOrder(e, order)}
            className="p-1 text-gray-500 hover:text-primary focus:outline-none"
            aria-label="Imprimir Pedido"
          >
            <Printer size={18} />
          </button>
        </div>

        <div className="space-y-2 mt-3">
          {orderItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between text-sm">
              <div className="flex-1">
                <div className="flex items-baseline">
                  <span className="font-medium text-gray-900">
                    {(item.peso_real !== null ? item.peso_real : item.peso_solicitado !== null ? item.peso_solicitado : item.quantidade)}kg 
                  </span>
                  <span className="ml-1 text-gray-600">
                    {item.produto.nome}
                  </span>
                </div>
                {/* Price per KG - show only if status is not 'efetuado' */}
                {status !== 'efetuado' && (
                  <div className="text-xs text-gray-500">
                    {formatCurrency(item.preco_kg)}/kg
                  </div>
                )}
              </div>
              {/* Item Total - show only if status is not 'efetuado' */}
              {status !== 'efetuado' && (
                <div className="text-right text-gray-900 font-medium">
                  {formatCurrency(item.valor_total || 0)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall Order Total - show only if status is not 'efetuado' */}
        {status !== 'efetuado' && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="font-medium text-gray-700">Valor Total:</span>
            <span className="font-bold text-primary text-lg">
              {formatCurrency(valor_total)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;