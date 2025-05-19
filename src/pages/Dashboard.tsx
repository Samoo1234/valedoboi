import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beef, ShoppingCart, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/Card';
import { getProducts } from '../services/productService';
import { getCustomers } from '../services/customerService';
import { OrderWithDetails, getOrders } from '../services/orderService';
import Button from '../components/ui/Button';
import OrderCard from '../components/orders/OrderCard';
import Modal from '../components/ui/Modal';
import OrderDetails from '../components/orders/OrderDetails';
import { formatCurrency } from '../utils/formatters';

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  colorClass?: string;
  onClick?: () => void;
}

const DashboardStat: React.FC<DashboardStatProps> = ({
  title,
  value,
  icon,
  trend,
  colorClass = 'bg-blue-500',
  onClick,
}) => (
  <Card className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {trend !== undefined && (
            <div className="mt-1 flex items-center">
              <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-500 ml-1">em relação ao mês passado</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClass} text-white`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [products, customers, orders] = await Promise.all([
          getProducts(),
          getCustomers(),
          getOrders(),
        ]);

        setProductCount(products.length);
        setCustomerCount(customers.length);
        setRecentOrders(orders.slice(0, 5));

        // Calculate total sales from all orders
        const total = orders.reduce((sum, order) => sum + order.valor_total, 0);
        setTotalSales(total);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOrderClick = (order: OrderWithDetails) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            title="Total de Vendas"
            value={formatCurrency(totalSales)}
            icon={<TrendingUp size={24} />}
            trend={12} // Trend estático, ajustar se necessário
            colorClass="bg-emerald-500"
            onClick={() => navigate('/sales-dashboard')}
          />
          <DashboardStat
            title="Pedidos"
            value={recentOrders.length}
            icon={<ShoppingCart size={24} />}
            trend={8}
            colorClass="bg-red-700"
            onClick={() => navigate('/orders')}
          />
          <DashboardStat
            title="Produtos"
            value={productCount}
            icon={<Beef size={24} />}
            colorClass="bg-amber-600"
            onClick={() => navigate('/admin/products')}
          />
          <DashboardStat
            title="Clientes"
            value={customerCount}
            icon={<Users size={24} />}
            trend={15}
            colorClass="bg-indigo-500"
            onClick={() => navigate('/admin/customers')}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium">Pedidos Recentes</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  Icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate('/orders')}
                >
                  Ver todos
                </Button>
              </div>
              <CardContent className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="py-6 text-center">Carregando...</div>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="py-2">
                      <OrderCard order={order} status={order.status} onClick={handleOrderClick} />
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    Nenhum pedido encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card>
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium">Ações Rápidas</h2>
              </div>
              <CardContent className="p-4 space-y-3">
                <Button
                  fullWidth
                  className="justify-start"
                  onClick={() => navigate('/orders')}
                >
                  <ShoppingCart className="mr-2" size={18} />
                  Gerenciar Pedidos
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  className="justify-start"
                  onClick={() => navigate('/admin/products')}
                >
                  <Beef className="mr-2" size={18} />
                  Gerenciar Produtos
                </Button>
                <Button
                  fullWidth
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('/admin/customers')}
                >
                  <Users className="mr-2" size={18} />
                  Gerenciar Clientes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={closeOrderDetails}
        title="Detalhes do Pedido"
        size="lg"
      >
        {selectedOrder && <OrderDetails order={selectedOrder} onClose={closeOrderDetails} />}
      </Modal>
    </Layout>
  );
};

export default Dashboard;