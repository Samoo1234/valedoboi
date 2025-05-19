import { create } from 'zustand';
import { 
  OrderWithDetails, 
  OrderStatus, 
  getOrdersByStatus, 
  updateOrderStatus,
  updateOrderItemsAndStatus,
  UpdatedOrderItem,
  getOrderById // <--- Adicionar importação aqui
} from '../services/orderService';
import { printOrderComanda } from '../utils/printUtils';

interface OrderState {
  placedOrders: OrderWithDetails[];
  emSeparacaoOrders: OrderWithDetails[]; // Renamed from awaitingSeparationOrders
  // separatedOrders removed
  completedOrders: OrderWithDetails[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  moveOrder: (orderId: string, sourceStatus: OrderStatus, destinationStatus: OrderStatus) => Promise<void>;
  confirmOrderWeighingAndUpdate: (orderId: string, updatedItems: UpdatedOrderItem[], newStatus: OrderStatus) => Promise<void>;
  addOrUpdateRealtimeOrder: (order: OrderWithDetails) => void;
  removeRealtimeOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  placedOrders: [],
  emSeparacaoOrders: [], // Renamed from awaitingSeparationOrders
  // separatedOrders: [], removed
  completedOrders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const [placed, emSeparacao, completed] = await Promise.all([
        getOrdersByStatus('efetuado'),
        getOrdersByStatus('em_separacao'), // Changed from 'aguardando_separacao'
        // getOrdersByStatus('separado'), // Removed
        getOrdersByStatus('finalizado'),
      ]);

      set({
        placedOrders: placed,
        emSeparacaoOrders: emSeparacao, // Changed from awaitingSeparationOrders
        // separatedOrders: separated, // Removed
        completedOrders: completed,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar pedidos' 
      });
    }
  },

  confirmOrderWeighingAndUpdate: async (orderId, updatedItems, newStatus) => {
    const state = get();
    const orderToUpdate = [...state.placedOrders, ...state.emSeparacaoOrders, ...state.completedOrders].find(o => o.id === orderId);

    if (!orderToUpdate) {
      console.error(`Order with ID ${orderId} not found in store.`);
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    // 1. Calculate the new total order value
    const newOrderTotal = updatedItems.reduce((sum, item) => sum + item.calculatedItemTotal, 0);

    try {
      // 2. Call the service function to update DB
      // We pass updatedItems directly; the service will map them to DB fields.
      await updateOrderItemsAndStatus(orderId, updatedItems, newOrderTotal, newStatus);

      // 3. Update local state
      const updatedOrderWithNewItems: OrderWithDetails = {
        ...orderToUpdate,
        status: newStatus,
        valor_total: newOrderTotal, // Update the main order total
        itens: orderToUpdate.itens.map(originalItem => {
          const changedItem = updatedItems.find(ui => ui.id === originalItem.id); // Assuming originalItem.id maps to updatedItem.id
          if (changedItem) {
            const wqStr = changedItem.weighedQuantity.replace(',', '.');
            const parsedWeight = parseFloat(wqStr);
            const finalPesoReal = isNaN(parsedWeight) ? null : parsedWeight;

            return {
              ...originalItem,
              peso_real: finalPesoReal, 
              valor_total: changedItem.calculatedItemTotal,
              // Potentially update quantidade as well if weighedQuantity is the new source of truth
              // quantidade: finalPesoReal, // if finalPesoReal is not null
            };
          }
          return originalItem;
        }),
      };
      
      // Remove from old list and add to new list
      let currentSourceList: OrderWithDetails[] = [];
      switch (orderToUpdate.status) {
        case 'efetuado': currentSourceList = state.placedOrders; break;
        case 'em_separacao': currentSourceList = state.emSeparacaoOrders; break;
        case 'finalizado': currentSourceList = state.completedOrders; break; // Should not happen if UI prevents weighing finalized
      }
      const filteredSourceList = currentSourceList.filter(o => o.id !== orderId);

      let newPlacedOrders = orderToUpdate.status === 'efetuado' ? filteredSourceList : state.placedOrders;
      let newEmSeparacaoOrders = orderToUpdate.status === 'em_separacao' ? filteredSourceList : state.emSeparacaoOrders;
      let newCompletedOrders = orderToUpdate.status === 'finalizado' ? filteredSourceList : state.completedOrders;

      switch (newStatus) {
        case 'efetuado': newPlacedOrders = [updatedOrderWithNewItems, ...newPlacedOrders]; break;
        case 'em_separacao': newEmSeparacaoOrders = [updatedOrderWithNewItems, ...newEmSeparacaoOrders]; break;
        case 'finalizado': newCompletedOrders = [updatedOrderWithNewItems, ...newCompletedOrders]; break;
      }
      
      set({
        placedOrders: newPlacedOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
        emSeparacaoOrders: newEmSeparacaoOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
        completedOrders: newCompletedOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
        isLoading: false, // if you set it to true at the beginning
      });

      // Automatic printing logic
      if (newStatus === 'efetuado' && orderToUpdate.status !== 'efetuado') {
        printOrderComanda(updatedOrderWithNewItems); // Print Comanda for 'efetuado'
      }
      // A impressão do cupom para 'finalizado' agora é manual através do botão em OrderDetails

    } catch (error) {
      console.error('Erro ao confirmar pesagem e atualizar pedido:', error);
      // Optionally, re-fetch all orders to ensure UI consistency if update fails partially
      // get().fetchOrders(); 
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar pedido após pesagem', isLoading: false });
      throw error;
    }
  },

  moveOrder: async (orderId, sourceStatus, destinationStatus) => {
    // Adicionar validação para mover de em_separacao para finalizado
    if (sourceStatus === 'em_separacao' && destinationStatus === 'finalizado') {
      try {
        const orderDetails = await getOrderById(orderId);
        if (!orderDetails) {
          throw new Error(`Detalhes do pedido ${orderId} não encontrados para validação.`);
        }
        // Definir o tipo do item para o every
        type OrderItemType = OrderWithDetails['itens'][number];
        const allItemsWeighed = orderDetails.itens.every((item: OrderItemType) => item.peso_real !== null && item.peso_real !== undefined);
        if (!allItemsWeighed) {
          throw new Error("Para finalizar o pedido, todos os itens devem ser pesados. Por favor, registre o peso de cada item ou digite '0' se algum item estiver em falta.");
        }
      } catch (validationError) {
        console.error('Erro de validação ao mover para finalizado:', validationError);
        // Re-lança o erro para ser pego pelo chamador (OrderBoard) e exibir ao usuário
        throw validationError; 
      }
    }

    try {
      await updateOrderStatus(orderId, destinationStatus);
      
      const state = get();
      
      let sourceList: OrderWithDetails[] = [];
      switch (sourceStatus) {
        case 'efetuado':
          sourceList = state.placedOrders;
          break;
        case 'em_separacao': // Changed from 'aguardando_separacao'
          sourceList = state.emSeparacaoOrders;
          break;
        // case 'separado': removed
        //   sourceList = state.separatedOrders;
        //   break;
        case 'finalizado':
          sourceList = state.completedOrders;
          break;
      }
      
      const orderToMove = sourceList.find(order => order.id === orderId);
      
      if (!orderToMove) {
        throw new Error(`Pedido com ID ${orderId} não encontrado na lista ${sourceStatus}`);
      }
      
      const updatedOrder = {
        ...orderToMove,
        status: destinationStatus,
      };
      
      const updatedSourceList = sourceList.filter(order => order.id !== orderId);
      
      let updatedPlacedOrders = state.placedOrders;
      let updatedEmSeparacaoOrders = state.emSeparacaoOrders; // Renamed
      // let updatedSeparatedOrders = state.separatedOrders; // Removed
      let updatedCompletedOrders = state.completedOrders;
      
      switch (sourceStatus) {
        case 'efetuado':
          updatedPlacedOrders = updatedSourceList;
          break;
        case 'em_separacao': // Renamed
          updatedEmSeparacaoOrders = updatedSourceList;
          break;
        // case 'separado': removed
        //   updatedSeparatedOrders = updatedSourceList;
        //   break;
        case 'finalizado':
          updatedCompletedOrders = updatedSourceList;
          break;
      }
      
      switch (destinationStatus) {
        case 'efetuado':
          updatedPlacedOrders = [updatedOrder, ...updatedPlacedOrders];
          break;
        case 'em_separacao': // Renamed
          updatedEmSeparacaoOrders = [updatedOrder, ...updatedEmSeparacaoOrders];
          break;
        // case 'separado': removed
        //   updatedSeparatedOrders = [updatedOrder, ...updatedSeparatedOrders];
        //   break;
        case 'finalizado':
          updatedCompletedOrders = [updatedOrder, ...updatedCompletedOrders];
          break;
      }
      
      // Imprimir comanda automaticamente se o status de destino for 'efetuado' (e não era antes)
      if (destinationStatus === 'efetuado' && sourceStatus !== 'efetuado') {
        // A comanda será impressa pelo bloco mais abaixo ou pelo realtime/update do OrderBoard
      }
      // A impressão do cupom para 'finalizado' é manual

      set({
        placedOrders: updatedPlacedOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
        emSeparacaoOrders: updatedEmSeparacaoOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
        // separatedOrders: updatedSeparatedOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()), // Removed
        completedOrders: updatedCompletedOrders.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()),
      });

      // Automatic printing if moved to 'efetuado'
      if (destinationStatus === 'efetuado' && sourceStatus !== 'efetuado') {
        printOrderComanda(updatedOrder);
      }
      // A impressão do cupom para 'finalizado' é manual

    } catch (error) {
      console.error('Erro ao mover pedido:', error);
      get().fetchOrders();
      throw error;
    }
  },
  // ... (código existente de moveOrder, etc.)

  addOrUpdateRealtimeOrder: (order) => {
    const oldOrder = get().placedOrders.find(o => o.id === order.id) || 
                     get().emSeparacaoOrders.find(o => o.id === order.id) || 
                     get().completedOrders.find(o => o.id === order.id);
    const oldStatus = oldOrder?.status;

    set(state => {

      // Remove o pedido de todas as listas para evitar duplicatas caso ele mude de status
      let newPlaced = state.placedOrders.filter(o => o.id !== order.id);
      let newEmSeparacao = state.emSeparacaoOrders.filter(o => o.id !== order.id);
      let newCompleted = state.completedOrders.filter(o => o.id !== order.id);

      // Adiciona o pedido à lista correta baseada no seu status
      if (order.status === 'efetuado') {
        newPlaced = [order, ...newPlaced].sort((a,b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
      } else if (order.status === 'em_separacao') {
        newEmSeparacao = [order, ...newEmSeparacao].sort((a,b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
      } else if (order.status === 'finalizado') {
        newCompleted = [order, ...newCompleted].sort((a,b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
      }
      // Se o pedido tiver outro status ou for inválido, ele simplesmente não será adicionado a nenhuma lista visível.
      
      return {
        placedOrders: newPlaced,
        emSeparacaoOrders: newEmSeparacao,
        completedOrders: newCompleted,
      };
    });

    // Automatic printing logic for comanda after state update
    if (order.status === 'efetuado' && oldStatus !== 'efetuado') {
      printOrderComanda(order);
    }
    // A impressão do cupom para 'finalizado' é manual
  },

  removeRealtimeOrder: (orderId) => {
    set(state => {

      return {
        placedOrders: state.placedOrders.filter(o => o.id !== orderId),
        emSeparacaoOrders: state.emSeparacaoOrders.filter(o => o.id !== orderId),
        completedOrders: state.completedOrders.filter(o => o.id !== orderId),
      };
    });
  }
}));