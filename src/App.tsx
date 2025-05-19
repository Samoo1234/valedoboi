import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import OrderBoard from './pages/OrderBoard';
import AdminProducts from './pages/AdminProducts';
import AdminCustomers from './pages/AdminCustomers';
import CustomerOrdersReportPage from './pages/CustomerOrdersReportPage'; // Nova página
import SalesDashboardPage from './pages/SalesDashboardPage'; // Dashboard de Vendas
import Login from './pages/Login';
import { PrivateRoute } from './components/PrivateRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
// import DebugLogView from './components/DebugLogView'; // Import DebugLogView

const App: React.FC = () => {

  // Adiciona fallback para erros críticos
  const [criticalError, setCriticalError] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Configuração do Supabase incompleta');
      setCriticalError('Configuração do Supabase incompleta. Verifique as variáveis de ambiente.');
    }
  }, []);

  // Renderização de erro crítico
  if (criticalError) {
    return (
      <div className='text-center text-red-500 p-8'>
        <h1 className='text-3xl font-bold mb-4'>Erro Crítico</h1>
        <p>{criticalError}</p>
        <p className='mt-4'>Por favor, verifique suas configurações de ambiente.</p>
      </div>
    );
  }

  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'white',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: 'red',
              secondary: 'white',
            },
          },
        }}
      />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrderBoard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/reports/customer-orders" element={<CustomerOrdersReportPage />} /> {/* Nova rota */}
            <Route path="/sales-dashboard" element={<SalesDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;