import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { OrderWithDetails } from '../../services/orderService';

interface MoveToSeparacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails | null;
  onConfirmMove: (orderId: string) => void;
}

export const MoveToSeparacaoModal: React.FC<MoveToSeparacaoModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmMove,
}) => {
  if (!order) return null;

  const handleConfirm = () => {
    onConfirmMove(order.id);
    onClose(); // Close modal after action
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Movimentação"
      size="sm"
    >
      <div className="p-4">
        <p className="text-gray-700 mb-6">
          Deseja mover o pedido <span className="font-semibold text-primary">#{order.id.substring(0, 4)}</span> de <span className="font-semibold text-primary">{order.cliente_nome}</span> para "Em Separação"?
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Mover para Em Separação
          </Button>
        </div>
      </div>
    </Modal>
  );
};
