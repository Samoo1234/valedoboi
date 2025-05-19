import React from 'react';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  // Update document title if provided
  React.useEffect(() => {
    if (title) {
      document.title = `${title} | Açougue Express`;
    } else {
      document.title = 'Açougue Express';
    }
  }, [title]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="print:hidden"> { /* Div para ocultar Navbar na impressão */ }
        <Navbar />
      </div>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-4 print:hidden"> {/* Ocultar na impressão */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm">© {new Date().getFullYear()} Açougue Express. Todos os direitos reservados.</p>
        </div>
      </footer>
      <Toaster position="top-right" /> {/* Adicionar Toaster global aqui */}
    </div>
  );
};

export default Layout;