import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryBase extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ocorreu um erro inesperado</h1>
          <p className="text-red-500 mb-4">
            {this.state.error?.message || 'Algo deu errado. Por favor, tente novamente.'}
          </p>
          <ErrorRedirectButton />
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorRedirectButton: React.FC = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <button 
      onClick={handleRedirect} 
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Voltar para Login
    </button>
  );
};

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return <ErrorBoundaryBase>{children}</ErrorBoundaryBase>;
};
