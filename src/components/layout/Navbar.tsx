import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Beef, User, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../supabase/client';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogouting, setIsLogouting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    if (isLogouting) {
            return;
    }
    
    const toastId = toast.loading('Fazendo logout...');
    
    try {
      setIsLogouting(true);
                  
      // Verifica se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
            
      if (!session) {
                throw new Error('Sem sessão ativa');
      }
      
      // Timeout para garantir que a UI não fique travada
      const logoutPromise = new Promise(async (resolve, reject) => {
        try {
                    const { error } = await supabase.auth.signOut();
                    
          if (error) {
                        reject(error);
          } else {
            resolve(true);
          }
        } catch (err) {
                    reject(err);
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
                    reject(new Error('Timeout de logout'));
        }, 10000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
            logout();
      
            toast.dismiss(toastId);
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Navbar - Erro ao fazer logout:', error);
      toast.dismiss(toastId);
      toast.error(`Não foi possível fazer logout: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Força navegação para login em caso de erro
      navigate('/login');
    } finally {
            setIsLogouting(false);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-red-800 to-red-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <Beef className="h-8 w-8 mr-2" />
                <span className="font-bold text-xl">Açougue Express</span>
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <NavLink to="/" isActive={location.pathname === '/'}>
                Dashboard
              </NavLink>
              <NavLink to="/orders" isActive={location.pathname === '/orders'}>
                Pedidos
              </NavLink>
              
              {user && (
                <div className="relative">
                  <button
                    className="flex items-center text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                    onClick={toggleDropdown}
                  >
                    Admin
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link
                        to="/admin/products"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Produtos
                      </Link>
                      <Link
                        to="/admin/customers"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Clientes
                      </Link>
                      <Link
                        to="/reports/customer-orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Relatório de Pedidos
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user && (
              <span className="text-white mr-4">{user.username}</span>
            )}
            {user ? (
              <Button
                variant="ghost"
                className="text-white hover:text-red-200"
                onClick={handleLogout}
                Icon={LogOut}
                disabled={isLogouting}
              >
                {isLogouting ? 'Saindo...' : 'Sair'}
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-white hover:text-red-200"
                  Icon={User}
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              className="text-white p-2 rounded-md hover:bg-red-700 focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="sm:hidden pb-3 pt-2">
          <div className="space-y-1 px-4">
            <MobileNavLink to="/" isActive={location.pathname === '/'} onClick={toggleMenu}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink to="/orders" isActive={location.pathname === '/orders'} onClick={toggleMenu}>
              Pedidos
            </MobileNavLink>
            
            {user && (
              <>
                <div className="px-3 py-2 font-medium text-white border-b border-red-700">
                  Admin
                </div>
                <MobileNavLink 
                  to="/admin/products" 
                  isActive={location.pathname === '/admin/products'} 
                  onClick={toggleMenu}
                >
                  Produtos
                </MobileNavLink>
                <MobileNavLink 
                  to="/admin/customers" 
                  isActive={location.pathname === '/admin/customers'} 
                  onClick={toggleMenu}
                >
                  Clientes
                </MobileNavLink>
                <MobileNavLink 
                  to="/reports/customer-orders" 
                  isActive={location.pathname === '/reports/customer-orders'} 
                  onClick={toggleMenu}
                >
                  Relatório de Pedidos
                </MobileNavLink>
                <MobileNavLink 
                  to="/admin/users" 
                  isActive={location.pathname === '/admin/users'} 
                  onClick={toggleMenu}
                >
                  Gerenciamento de Usuários
                </MobileNavLink>
              </>
            )}
            
            {user && user.email && (
              <div className="px-3 py-2 text-sm text-white">
                {user.email}
              </div>
            )}
            {user ? (
              <button
                className="w-full flex items-center px-3 py-2 text-white hover:bg-red-700 rounded-md font-medium"
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </button>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center px-3 py-2 text-white hover:bg-red-700 rounded-md font-medium"
                onClick={toggleMenu}
              >
                <User className="h-5 w-5 mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, isActive, children }) => (
  <Link
    to={to}
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-red-700 text-white' : 'text-white hover:bg-red-700 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, isActive, children, onClick }) => (
  <Link
    to={to}
    className={`block px-3 py-2 rounded-md text-base font-medium ${
      isActive ? 'bg-red-700 text-white' : 'text-white hover:bg-red-700 hover:text-white'
    }`}
    onClick={onClick}
  >
    {children}
  </Link>
);

export default Navbar;