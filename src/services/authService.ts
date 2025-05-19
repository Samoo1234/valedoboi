import { supabase } from '../supabase/client';

import { loginUser } from './userService';

export const signIn = async (username: string, password: string) => {
  const loginResult = await loginUser(username, password);

  return {
    session: loginResult.session || null,
    user: loginResult.user || null,
  };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
};