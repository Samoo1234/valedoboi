import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { OrderWithDetails, OrderStatus } from '../../services/orderService'; 
import { formatCurrency } from '../../utils/formatters';

// Get the type of a single item from OrderWithDetails.itens
// This ensures WeighedModalItem is based on the structure of items passed in the 'order' prop
type OrderDetailItem = OrderWithDetails['itens'][number];

interface WeighedModalItem extends OrderDetailItem {
  weighedQuantity: string; 
  calculatedItemTotal: number;
}

interface OrderWeighingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails | null;
  // Passes back all items with their new weighed quantities and calculated totals
  onConfirmWeighing: (orderId: string, updatedItems: WeighedModalItem[], newStatus: OrderStatus) => void;
  // For simpler status changes like reverting
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderWeighingModal: React.FC<OrderWeighingModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmWeighing,
  onStatusChange,
}) => {
  const [currentItems, setCurrentItems] = useState<WeighedModalItem[]>([]);
  const [currentOrderTotal, setCurrentOrderTotal] = useState(0);

  useEffect(() => {
    if (order && order.itens) {
      const safeItens: OrderDetailItem[] = Array.isArray(order.itens) ? order.itens : [];
      const initialItems: WeighedModalItem[] = safeItens.map(item => ({
        id: item.id,
        quantidade: item.quantidade,
        peso_solicitado: item.peso_solicitado,
        peso_real: item.peso_real,
        preco_kg: item.preco_kg,
        valor_total: item.valor_total,
        observacao_item: item.observacao_item, // Added observacao_item
        produto: item.produto,
        weighedQuantity: (item.peso_real !== null && item.peso_real !== undefined)
          ? item.peso_real.toString()
          : (item.peso_solicitado !== null && item.peso_solicitado !== undefined)
            ? item.peso_solicitado.toString()
            : item.quantidade.toString(),
        calculatedItemTotal: item.valor_total || 0, // Initialize with original item total
      }));
      setCurrentItems(initialItems);
      // Recalculate total based on potentially pre-filled weighed quantities if logic changes
      setCurrentOrderTotal(initialItems.reduce((sum, currentItem) => sum + currentItem.calculatedItemTotal, 0));
    } else {
      setCurrentItems([]);
      setCurrentOrderTotal(0);
    }
  }, [order]);

  const handleItemWeightChange = (itemId: string, newWeightStr: string) => {
    const newItems = currentItems.map(item => {
      if (item.id === itemId) {
        const newWeightNum = parseFloat(newWeightStr);
        const calculatedTotal = !isNaN(newWeightNum) && newWeightNum >= 0
                                ? newWeightNum * item.preco_kg
                                : 0;
        return { ...item, weighedQuantity: newWeightStr, calculatedItemTotal: calculatedTotal };
      }
      return item;
    });
    setCurrentItems(newItems);
    setCurrentOrderTotal(newItems.reduce((sum, item) => sum + item.calculatedItemTotal, 0));
  };

  const handleConfirm = () => {
    if (order) {
      let nextStatus: OrderStatus = 'em_separacao'; // Default next status
      if (order.status === 'efetuado') {
        nextStatus = 'em_separacao';
      } else if (order.status === 'em_separacao') {
        nextStatus = 'finalizado';
      }
      // If order.status is already 'finalizado', this button might be hidden or disabled
      // For now, it will try to move to 'finalizado' again if not handled by UI
      onConfirmWeighing(order.id, currentItems, nextStatus);
    }
  };

  const handleRevert = () => {
    if (order && order.status === 'em_separacao') { // Only allow revert if in em_separacao
      onStatusChange(order.id, 'efetuado');
    }
    // If order.status is 'finalizado', revert logic might be different or disallowed
  };

  if (!order) return null;

  const getConfirmButtonText = () => {
    if (order.status === 'efetuado') {
      return 'Confirmar Pesagem e Mover para Em Separação';
    }
    if (order.status === 'em_separacao') {
      return 'Confirmar Pesagem e Mover para Finalizado';
    }
    return 'Confirmar Pesagem'; // Fallback, though this button might be hidden for 'finalizado'
  };

  // Determine if the confirm button should be visible/active
  const canConfirm = order.status === 'efetuado' || order.status === 'em_separacao';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pesar Pedido #${order.id.substring(0, 4)} - ${order.cliente_nome}`}
    >
      <div className="p-4 md:p-6 max-h-[calc(100vh-150px)] overflow-y-auto"> 
        <div className="space-y-3 mb-6 pr-2">
          {currentItems.map(item => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2 py-2 border-b border-gray-100 last:border-b-0">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-800">{item.produto.nome}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.preco_kg)}/kg</p>
              </div>
              <Input
                type="number"
                value={item.weighedQuantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemWeightChange(item.id, e.target.value)}
                className="text-sm w-full md:w-auto"
                placeholder="Peso (kg)"
                step="0.001"
              />
              <p className="text-sm text-gray-700 text-right font-medium md:col-start-4">
                {formatCurrency(item.calculatedItemTotal)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-end items-center mb-6 pt-4 border-t border-gray-200 space-y-2 md:space-y-0 md:space-x-2">
          <span className="text-base md:text-lg font-semibold text-gray-800">Valor Total do Pedido:</span>
          <span className="text-base md:text-lg font-bold text-primary">
            {formatCurrency(currentOrderTotal)}
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between space-y-3 md:space-y-0">
          {order.status === 'em_separacao' && (
            <Button variant="outline" onClick={handleRevert} className="w-full md:w-auto">
              Reverter para Pedido Efetuado
            </Button>
          )}
          {/* Placeholder for the left side if revert button is not shown to maintain layout if needed */}
          {order.status !== 'em_separacao' && <div className="w-full md:w-auto"></div>} 

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <Button variant="ghost" onClick={onClose} className="w-full md:w-auto">Cancelar</Button>
            {canConfirm && (
              <Button onClick={handleConfirm} className="w-full md:w-auto">
                {getConfirmButtonText()}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
