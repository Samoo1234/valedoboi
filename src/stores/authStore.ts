import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/client';

interface User {
  username: string;
  role: string;
  email?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, role: string, email?: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username, role, email) => set({ 
        isAuthenticated: true, 
        user: { username, role, email } 
      }),
      logout: async () => {
        try {
                    
          // Verifica se há sessão ativa
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
                        set({ 
              isAuthenticated: false, 
              user: null 
            });
            return;
          }
          
          // Timeout para garantir que o logout não fique travado
          const logoutPromise = new Promise(async (resolve, reject) => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Erro detalhado ao fazer logout:', error);
                reject(error);
              } else {
                resolve(true);
              }
            } catch (err) {
              console.error('Exceção durante o logout:', err);
              reject(err);
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout de logout')), 10000)
          );
          
          await Promise.race([logoutPromise, timeoutPromise]);
          

          set({ 
            isAuthenticated: false, 
            user: null 
          });
          

        } catch (error) {
          console.error('Erro final ao fazer logout:', error);
          
          // Limpa o estado mesmo em caso de erro
          set({ 
            isAuthenticated: false, 
            user: null 
          });
          
          throw error; // Propaga o erro para ser tratado no componente
        }
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);
