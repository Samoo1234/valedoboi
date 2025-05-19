import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Beef, Key, Mail } from 'lucide-react';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { loginUser } from '../services/userService';
import { useAuthStore } from '../stores/authStore';

type LoginFormData = {
  login: string;
  password: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    
    try {
      // Verificar se é um email ou username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.login);
      
      let loginValue = data.login;
      
      // Se for username, gerar email fictício
      if (!isEmail) {
        const sanitizedUsername = data.login.toLowerCase().replace(/[^a-z0-9_]/g, '');
        loginValue = `${sanitizedUsername}@acougue.com`;
      }
      
                        const userData = await loginUser(loginValue, data.password);
            if (userData.user) {
        const username = userData.user.email?.split('@')[0] || 'usuario';
        login(username, 'usuario');
                navigate('/');
      } else {
        console.error('Login - Falha na autenticação');
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Falha ao fazer login';
      setLoginError(
        message.includes('Invalid login credentials')
          ? 'E-mail/Usuário ou senha incorretos'
          : message
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center">
            <Beef className="h-12 w-12 text-red-800" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Açougue Express</h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar a plataforma de gerenciamento
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {loginError && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
              {loginError}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="E-mail ou Nome de Usuário"
              type="text"
              leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
              fullWidth
              {...register('login', { 
                required: 'E-mail ou nome de usuário é obrigatório',
                validate: (value) => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                  const isUsername = /^[a-zA-Z0-9_]{3,}$/.test(value);
                  
                  if (!isEmail && !isUsername) {
                    return 'Digite um e-mail válido ou nome de usuário com 3+ caracteres';
                  }
                  return true;
                }
              })}
              error={errors.login?.message}
            />
            
            <Input
              label="Senha"
              type="password"
              leftIcon={<Key className="h-5 w-5 text-gray-400" />}
              fullWidth
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter pelo menos 6 caracteres'
                }
              })}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;