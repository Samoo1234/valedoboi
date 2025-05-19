export interface UserListResponse {
  data: SupabaseUserData[];
  error: boolean;
  message?: string;
}

export interface SupabaseUserData {
  user_id: string;
  role: 'admin' | 'atendente';
  id?: string;
  email?: string;
  created_at?: string;
  raw_user_meta_data?: any;
}
