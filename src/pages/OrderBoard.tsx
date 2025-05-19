import React, { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import OrderColumn from '../components/orders/OrderColumn';
import OrderDetails from '../components/orders/OrderDetails';
import { QuickOrderWeighModal } from '../components/orders/QuickOrderWeighModal';
import { MoveToSeparacaoModal } from '../components/orders/MoveToSeparacaoModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { OrderWithDetails, OrderStatus, getOrderById } from '../services/orderService'; // Importar getOrderById
import { useOrderStore } from '../store/orderStore';
import { supabase } from '../supabase/client';
import { printOrderComanda } from '../utils/printUtils';
import { toast } from 'react-hot-toast'; // Importar toast

const statusToTitle: Record<OrderStatus, string> = {
  efetuado: 'Pedido Efetuado',
  em_separacao: 'Em Separação', // Renamed and title updated
  // separado: 'Separado', // Removed
  finalizado: 'Finalizado',
};

const OrderBoard: React.FC = () => {
  const { 
    placedOrders, 
    emSeparacaoOrders, // Renamed from awaitingSeparationOrders
    // separatedOrders, // Removed
    completedOrders,
    isLoading, 
    error, 
    fetchOrders, 
    moveOrder,
    confirmOrderWeighingAndUpdate, // Import the new action
    addOrUpdateRealtimeOrder, // Adicionar nova ação
    removeRealtimeOrder       // Adicionar nova ação
  } = useOrderStore();
  
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [orderToWeigh, setOrderToWeigh] = useState<OrderWithDetails | null>(null); // State for order to weigh
  const [orderToMoveToSeparacao, setOrderToMoveToSeparacao] = useState<OrderWithDetails | null>(null); // State for moving to separacao
  const [isWeighingModalOpen, setIsWeighingModalOpen] = useState(false); // State for weighing modal visibility
  const [isMoveToSeparacaoModalOpen, setIsMoveToSeparacaoModalOpen] = useState(false); // State for new modal
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-realtime-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' }, 
        async (payload) => { 

          if (payload.eventType === 'INSERT') {
            const newOrderFromPayload = payload.new as Partial<OrderWithDetails>; 
            if (newOrderFromPayload && newOrderFromPayload.id) {
              try {
                // Para INSERT, apenas buscamos os detalhes e atualizamos o store.
                // A impressão será tratada no evento UPDATE quando o status mudar para 'efetuado'/'finalizado'.
                const fullOrder = await getOrderById(newOrderFromPayload.id);
                if (fullOrder) { 
                  addOrUpdateRealtimeOrder(fullOrder); 
                } else {
                  // Se não conseguir buscar detalhes, ao menos tenta adicionar o que veio no payload
                  addOrUpdateRealtimeOrder(newOrderFromPayload as OrderWithDetails); // Cast, pois pode não ter todos os detalhes
                }
              } catch (error) {
                console.error(`[Realtime Board] INSERT: Erro ao buscar detalhes para o pedido ${newOrderFromPayload.id}:`, error);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrderFromPayload = payload.new as Partial<OrderWithDetails>; 
            const oldOrderFromPayload = payload.old as Partial<OrderWithDetails>; 
            
            if (updatedOrderFromPayload && updatedOrderFromPayload.id) {
              try {
                // Sempre buscar os detalhes completos do pedido em um UPDATE
                const fullOrder = await getOrderById(updatedOrderFromPayload.id);

                if (fullOrder) {
                  addOrUpdateRealtimeOrder(fullOrder); // Atualiza o store com dados completos

                  const newStatus = fullOrder.status; // Usa o status do fullOrder
                  const oldStatus = oldOrderFromPayload?.status;

                  // Imprimir comanda SE E SOMENTE SE o status MUDOU PARA 'efetuado'
                  // E o status anterior NÃO ERA 'efetuado'
                  const shouldPrintComanda = 
                    newStatus === 'efetuado' && oldStatus !== 'efetuado';

                  if (shouldPrintComanda) {
                    if (fullOrder.itens && fullOrder.itens.length > 0 && fullOrder.cliente_nome) { 
                      printOrderComanda(fullOrder);
                    } else {
                      console.warn(`[Realtime Board] UPDATE: Tentativa de impressão de comanda, mas detalhes incompletos para ${fullOrder.id}.`);
                    }
                  }
                  // A impressão do cupom para 'finalizado' foi removida e será manual
                } else {
                  // Fallback: se não conseguiu buscar fullOrder, atualiza com o payload (pode ser parcial)
                  console.warn(`[Realtime Board] UPDATE: Não foi possível buscar detalhes completos para ${updatedOrderFromPayload.id}. Usando payload.`);
                  addOrUpdateRealtimeOrder(updatedOrderFromPayload as OrderWithDetails);
                }
              } catch (error) {
                console.error(`[Realtime Board] UPDATE: Erro ao processar atualização para o pedido ${updatedOrderFromPayload.id}:`, error);
                // Fallback em caso de erro na busca, atualiza com payload para refletir mudança de status visualmente
                addOrUpdateRealtimeOrder(updatedOrderFromPayload as OrderWithDetails);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Partial<OrderWithDetails>; 
            if (deletedOrder && deletedOrder.id) {
              removeRealtimeOrder(deletedOrder.id); 
            }
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  // Adicionando addOrUpdateRealtimeOrder e removeRealtimeOrder como dependências 
  // para garantir que o useEffect reaja se essas funções mudarem (embora improvável com Zustand padrão)
  }, [addOrUpdateRealtimeOrder, removeRealtimeOrder]);


  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      await moveOrder(
        draggableId,
        source.droppableId as OrderStatus,
        destination.droppableId as OrderStatus
      );
    } catch (error: any) {
      console.error('Erro ao mover pedido:', error);
      // Mostrar a mensagem específica do erro quando disponível
      if (error && typeof error.message === 'string') {
        toast.error(error.message);
      } else {
        toast.error('Ocorreu um erro ao tentar mover o pedido.');
      }
      // A store já deve reverter/recarregar os pedidos em caso de erro na moveOrder,
      // mas um fetchOrders aqui pode ser uma garantia adicional se a store não o fizer.
      // fetchOrders(); // Descomente se necessário, mas a store já faz isso.
    } 
  };
  const handleOrderClick = (order: OrderWithDetails, columnStatus: OrderStatus) => {
    if (columnStatus === 'efetuado') {
      setOrderToMoveToSeparacao(order);
      setIsMoveToSeparacaoModalOpen(true);
      setSelectedOrder(null);
      setOrderToWeigh(null);
      setIsWeighingModalOpen(false);
    } else if (columnStatus === 'em_separacao') { 
      setOrderToWeigh(order);
      setIsWeighingModalOpen(true);
      setSelectedOrder(null);
      setOrderToMoveToSeparacao(null);
      setIsMoveToSeparacaoModalOpen(false);
    } else if (columnStatus === 'finalizado') { // For 'finalizado', open details
      setSelectedOrder(order);
      setOrderToWeigh(null);
      setIsWeighingModalOpen(false);
      setOrderToMoveToSeparacao(null);
      setIsMoveToSeparacaoModalOpen(false);
    } else { // Fallback for any other status or if no specific action
      setSelectedOrder(null); 
      setOrderToWeigh(null);
      setIsWeighingModalOpen(false);
      setOrderToMoveToSeparacao(null);
      setIsMoveToSeparacaoModalOpen(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  return (
    <Layout title="Gerenciamento de Pedidos">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Arraste e solte os pedidos entre as colunas para atualizar seu status.
        </p>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          Icon={RefreshCw}
        >
          Atualizar
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          Erro ao carregar pedidos: {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <OrderColumn 
                id="efetuado"
                title={statusToTitle.efetuado}
                orders={placedOrders}
                onOrderClick={handleOrderClick}
              />
            </div>
            <div>
              <OrderColumn 
                id="em_separacao"
                title={statusToTitle.em_separacao}
                orders={emSeparacaoOrders}
                onOrderClick={handleOrderClick}
              />
            </div>
            <div>
              <OrderColumn 
                id="finalizado"
                title={statusToTitle.finalizado}
                orders={completedOrders}
                onOrderClick={handleOrderClick}
              />
            </div>
          </div>
        </DragDropContext>
      )}
      
      <Modal
        isOpen={!!selectedOrder}
        onClose={closeOrderDetails}
        title="Detalhes do Pedido"
        size="lg"
      >
        {selectedOrder && (
          <OrderDetails 
            order={selectedOrder} 
            onClose={closeOrderDetails} 
          />
        )}
      </Modal>

      {/* Weighing Modal */}
      {orderToWeigh && (
        <QuickOrderWeighModal
          isOpen={isWeighingModalOpen}
          onClose={() => {
            setIsWeighingModalOpen(false);
            setOrderToWeigh(null);
          }}
          order={orderToWeigh}
          onConfirmWeighing={(orderId, updatedItems, newStatus) => {
            confirmOrderWeighingAndUpdate(orderId, updatedItems, newStatus)
              .then(() => {
                setIsWeighingModalOpen(false);
                setOrderToWeigh(null);
                // Optionally, re-fetch or rely on store to update UI
              })
              .catch(err => {
                console.error("Failed to confirm weighing and update order:", err);
                // Handle error in UI, e.g., show a notification
                // For now, modal remains open or closes depending on desired UX for error
              });
          }}
          onStatusChange={(orderId, newStatus) => {
            // TODO: Integrate with useOrderStore to update status

            // Example: updateOrderStatus(orderId, newStatus);
            // For now, we will just close the modal and assume a successful update for UI purposes.
            const currentOrder = emSeparacaoOrders.find(o => o.id === orderId) || placedOrders.find(o => o.id === orderId) ; // find in relevant lists, removed separatedOrders
            if (currentOrder && currentOrder.status !== newStatus) {
                moveOrder(orderId, currentOrder.status, newStatus);
            }
            setIsWeighingModalOpen(false);
            setOrderToWeigh(null);
          }}
        />
      )}

      {/* Modal to move from Efetuado to Em Separação */}
      {orderToMoveToSeparacao && (
        <MoveToSeparacaoModal
          isOpen={isMoveToSeparacaoModalOpen}
          onClose={() => {
            setIsMoveToSeparacaoModalOpen(false);
            setOrderToMoveToSeparacao(null);
          }}
          order={orderToMoveToSeparacao}
          onConfirmMove={(orderId) => {
            moveOrder(orderId, 'efetuado', 'em_separacao');
            // No need to manually close, modal does it internally after onConfirmMove call
          }}
        />
      )}

    </Layout>
  );
};

export default OrderBoard;