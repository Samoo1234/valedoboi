export interface UserListResponse {
  data: Array<{
    id: string;
    user_id: string;
    email: string;
    role: 'admin' | 'atendente';
    full_name?: string;
    created_at: string;
    raw_user_meta_data?: Record<string, any>;
  }>;
  error: boolean;
  message?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'atendente';
    full_name?: string;
  } | null;
  error: boolean;
  message?: string;
}

export interface CreateUserResponse {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'atendente';
    full_name?: string;
  } | null;
  error: boolean;
  message?: string;
}
