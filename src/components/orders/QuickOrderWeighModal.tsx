import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { OrderWithDetails, OrderStatus } from '../../services/orderService'; 
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast'; // Importar toast

// Get the type of a single item from OrderWithDetails.itens
// This ensures WeighedModalItem is based on the structure of items passed in the 'order' prop
type OrderDetailItem = OrderWithDetails['itens'][number];

interface WeighedModalItem extends OrderDetailItem {
  weighedQuantity: string; 
  calculatedItemTotal: number;
}

interface QuickOrderWeighModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails | null;
  // Passes back all items with their new weighed quantities and calculated totals
  onConfirmWeighing: (orderId: string, updatedItems: WeighedModalItem[], newStatus: OrderStatus) => void;
  // For simpler status changes like reverting
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export const QuickOrderWeighModal: React.FC<QuickOrderWeighModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmWeighing,
  onStatusChange,
}) => {
  const [currentItems, setCurrentItems] = useState<WeighedModalItem[]>([]);
  const [currentOrderTotal, setCurrentOrderTotal] = useState(0);
  const [areAllItemsProcessed, setAreAllItemsProcessed] = useState(false);

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
        weighedQuantity: '0', // Inicializar com 0
        calculatedItemTotal: 0, // Inicializar com 0
      }));
      setCurrentItems(initialItems);
      setCurrentOrderTotal(initialItems.reduce((sum, currentItem) => sum + currentItem.calculatedItemTotal, 0));
    } else {
      setCurrentItems([]);
      setCurrentOrderTotal(0);
    }
  }, [order]);

  // Check if all items are processed (have a valid weight)
  useEffect(() => {
    if (!currentItems || currentItems.length === 0) {
      setAreAllItemsProcessed(false);
      return;
    }
    const allProcessed = currentItems.every(item => {
      const weight = parseFloat(item.weighedQuantity.replace(',', '.'));
      return !isNaN(weight); // Includes 0, excludes empty strings or non-numeric
    });
    setAreAllItemsProcessed(allProcessed);
  }, [currentItems]);

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
      if (!areAllItemsProcessed) { 
        toast.error("Por favor, preencha o peso para todos os itens. Digite '0' para os itens em falta.");
        return;
      }
      let nextStatus: OrderStatus = 'em_separacao'; // Default next status
      if (order.status === 'efetuado') {
        nextStatus = 'em_separacao';
      } else if (order.status === 'em_separacao') {
        nextStatus = 'finalizado';
      }
      onConfirmWeighing(order.id, currentItems, nextStatus);
    }
  };

  const handleRevert = () => {
    if (order && order.status === 'em_separacao') { // Only allow revert if in em_separacao
      onStatusChange(order.id, 'efetuado');
    }
  };

  if (!order) return null;

  const getConfirmButtonText = () => {
    if (order.status === 'efetuado') {
      return 'Confirmar Pesagem e Mover para Em Separação';
    }
    if (order.status === 'em_separacao') {
      return 'Confirmar Pesagem e Mover para Finalizado';
    }
    return 'Confirmar Pesagem'; // Fallback
  };
  
  const canConfirm = order.status === 'efetuado' || order.status === 'em_separacao';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pesar Pedido #${order.id.substring(0, 4)}`}
      titleClassName="font-bold text-gray-900"
      size="lg"
    >
      <div className="p-4 md:p-6 flex flex-col max-h-[650px]">
        <div className="pr-2 flex-grow overflow-y-auto">
          {currentItems.map(item => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-x-4 gap-y-2 p-3 bg-gray-50 rounded-lg mb-2">
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

        <div className="flex flex-col md:flex-row justify-start items-center pt-4 border-t border-gray-200 mt-auto">
          <span className="text-base md:text-lg font-bold text-gray-800 mr-2">Valor Total do Pedido:</span>
          <span className="text-base md:text-lg font-bold text-primary flex items-center">
            {formatCurrency(currentOrderTotal)}
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-4 mt-2 space-y-2 md:space-y-0 md:space-x-3">
          {order.status === 'em_separacao' ? (
            <Button variant="outline" onClick={handleRevert} className="w-full md:w-auto" size="sm">
              Reverter para Pedido Efetuado
            </Button>
          ) : (
            <div className="w-full md:w-auto" /> /* Placeholder to maintain layout */
          )}
          {canConfirm && (
            <Button 
              onClick={handleConfirm} 
              className="w-full md:w-auto" 
              size="sm"
              disabled={order.status === 'em_separacao' && !areAllItemsProcessed}
              title={order.status === 'em_separacao' && !areAllItemsProcessed ? 'Pese todos os itens ou informe 0 para itens faltantes.' : getConfirmButtonText()}
            >
              {getConfirmButtonText()}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
