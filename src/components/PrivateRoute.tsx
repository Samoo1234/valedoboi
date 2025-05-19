import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../supabase/client';
import LoadingScreen from './LoadingScreen';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
        const checkSession = async () => {
      try {
                const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Atualiza o estado de autenticação
          const username = session.user.email?.split('@')[0] || 'usuario';
                    login(username, 'usuario', session.user.email);
        } else {
                    logout();
        }
      } catch (error) {
        console.error('PrivateRoute - Erro ao verificar sessão:', error);
        logout();
      } finally {
                setIsLoading(false);
      }
    };

    checkSession();

    // Adiciona listener para mudanças de sessão
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
                if (event === 'SIGNED_IN') {
          const username = session?.user.email?.split('@')[0] || 'usuario';
                    login(username, 'usuario', session?.user.email);
        } else if (event === 'SIGNED_OUT') {
                    logout();
        }
      }
    );

    // Limpa subscription
    return () => {
            subscription.unsubscribe();
    };
  }, [login, logout]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
