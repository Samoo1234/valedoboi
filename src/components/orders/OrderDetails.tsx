import React from 'react';
import { Phone, Mail, ShoppingBag, CalendarClock, CheckCircle, Printer } from 'lucide-react';
import { OrderWithDetails, OrderStatus } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../ui/Button';
import { useOrderStore } from '../../store/orderStore';
import { printOrderCupom } from '../../utils/printUtils';

interface OrderDetailsProps {
  order: OrderWithDetails;
  onClose: () => void;
  // onOrderUpdate is likely not needed if OrderBoard consumes store directly for lists
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose }) => {
  const { moveOrder } = useOrderStore();

  const handleMoveToFinalizado = async () => {
    if (!order) return;
    try {
      await moveOrder(order.id, order.status, 'finalizado');
      onClose();
    } catch (error) {
      console.error("Error moving order to finalizado:", error);
      // Handle error (e.g., show a notification to the user)
    }
  };

  const handlePrint = () => {
    if (!order) return; 
    printOrderCupom(order); 
  };

  return (
    <div id="orderDetailsPrintContent" className="space-y-6 max-h-[500px] overflow-y-auto p-1"> 
      <div>
        <h3 className="text-xl font-semibold mb-2">Informações do Pedido</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID do Pedido</p>
            <p className="font-medium">#{order.id.substring(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data</p>
            <div className="flex items-center">
              <CalendarClock size={16} className="mr-1 text-gray-500" />
              <p>{formatDate(order.data_criacao)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-primary flex items-center">
              {formatCurrency(order.valor_total)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-b border-gray-200 py-4">
        <h3 className="text-xl font-semibold mb-3">Cliente</h3>
        <div className="space-y-2">
          <p className="font-medium text-lg">{order.cliente_nome}</p>
          <div className="flex items-center text-gray-700">
            <Phone size={16} className="mr-2" />
            <p>{order.cliente_telefone}</p>
          </div>
          {order.cliente_email && (
            <div className="flex items-center text-gray-700">
              <Mail size={16} className="mr-2" />
              <p>{order.cliente_email}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Itens do Pedido</h3>
        <div className="space-y-3"> 
          {order.itens.map((item) => {
            const displayWeight = item.peso_real !== null ? item.peso_real : item.peso_solicitado !== null ? item.peso_solicitado : item.quantidade;
            const itemSubtotal = item.preco_kg * displayWeight; // Corrected: displayWeight is already a number

            return (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <ShoppingBag size={18} className="mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">{item.produto.nome}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.preco_kg)} × {displayWeight}kg
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(itemSubtotal)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-2 no-print"> 
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="mr-2"
          >
            Fechar
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint} 
            Icon={Printer}
            className="mr-2"
          >
            Imprimir
          </Button>
        {order.status !== 'finalizado' && (
          <Button 
            onClick={handleMoveToFinalizado} 
            variant="primary" 
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle size={16} className="mr-2" /> 
            Mover para Finalizado
          </Button>
        )}
      </div>
    </div>
  );
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const statusConfigMap: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    efetuado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pedido Efetuado' },
    em_separacao: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Separação' },
    finalizado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Finalizado' },
  };
  const currentConfig = statusConfigMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${currentConfig.bg} ${currentConfig.text}`}>
      {currentConfig.label}
    </span>
  );
}

export default OrderDetails;