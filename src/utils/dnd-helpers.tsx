import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { OrderWithDetails } from '../services/orderService';
import OrderCard from '../components/orders/OrderCard';

export const renderDraggableOrderItem = (
  order: OrderWithDetails,
  index: number,
  onClick: (order: OrderWithDetails) => void
) => {
  return (
    <Draggable key={order.id} draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
          }}
          onClick={() => onClick(order)}
        >
          <OrderCard order={order} status={order.status} />
        </div>
      )}
    </Draggable>
  );
};