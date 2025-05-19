import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import OrderCard from './OrderCard';
import { OrderWithDetails, OrderStatus } from '../../services/orderService';

interface OrderColumnProps {
  id: OrderStatus; // Changed from string to OrderStatus for type safety
  title: string;
  orders: OrderWithDetails[];
  onOrderClick: (order: OrderWithDetails, columnId: OrderStatus) => void;
}

// Define a type for the style properties
interface HeaderStyle {
  headerBg: string;
  titleText: string;
  badgeBg: string;
  badgeText: string;
}

// Map status IDs to Tailwind CSS classes for header, title, and badge
const statusToHeaderStyle: Record<OrderStatus, HeaderStyle> = {
  efetuado: {
    headerBg: 'bg-yellow-400',
    titleText: 'text-yellow-900',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
  },
  em_separacao: { // Renamed from aguardando_separacao
    headerBg: 'bg-blue-500',
    titleText: 'text-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
  },
  // separado entry removed
  finalizado: {
    headerBg: 'bg-green-500',
    titleText: 'text-white',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
  },
};

const OrderColumn: React.FC<OrderColumnProps> = ({ 
  id, 
  title, 
  orders,
  onOrderClick
}) => {
  const headerStyle = statusToHeaderStyle[id] || statusToHeaderStyle.efetuado; // Fallback to 'efetuado' style

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 w-full h-[70vh] flex flex-col shadow-sm`}>
      <div className={`p-3 border-b border-gray-200 rounded-t-lg ${headerStyle.headerBg}`}>
        <h3 className={`text-lg font-semibold flex items-center ${headerStyle.titleText}`}>
          {title}
          <span className={`ml-2 text-sm font-medium px-2.5 py-0.5 rounded-full ${headerStyle.badgeBg} ${headerStyle.badgeText}`}>
            {orders.length}
          </span>
        </h3>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 flex-1 overflow-y-auto transition-colors duration-150 ${
              snapshot.isDraggingOver ? 'bg-opacity-80 bg-gray-100' : 'bg-gray-50' // Adjusted draggingOver style for better visibility with new header colors
            }`}
          >
            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg m-2 bg-white">
                <p className="text-gray-500">Sem pedidos</p>
              </div>
            ) : (
              orders.map((order, index) => (
                <Draggable key={order.id} draggableId={order.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <OrderCard 
                        order={order} 
                        onClick={(clickedOrder) => onOrderClick(clickedOrder, id)}
                        isDragging={snapshot.isDragging}
                        status={id} // Pass the column's status ID to OrderCard
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default OrderColumn;