import { supabase } from '../services/supabaseClient';

export async function loginUser(username: string, password: string) {
  try {
    // Autenticar usuário via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username, // Supabase usa email para login
      password: password,
    });

    if (error) {
      console.error('Erro de autenticação:', error);
      return { user: null, session: null, error: true, message: error.message };
    }

    // Retornar informações do usuário e sessão do Supabase
    return {
      user: data.user,
      session: data.session,
      error: false,
    };
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    return { user: null, session: null, error: true, message: 'Erro inesperado no login' };
  }
}
