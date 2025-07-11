export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          password_hash: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          password_hash: string
          role: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf_cnpj: string
          created_at: string | null
          email: string | null
          endereco: string | null
          id: number
          nome: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          nome: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: number
          nome?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      historico_pedidos: {
        Row: {
          cliente_nome: string | null
          data_arquivamento: string | null
          data_criacao: string | null
          data_finalizacao: string | null
          id: string
          itens: Json | null
          metodo_pagamento: string | null
          pedido_id: string
          valor_total: number | null
        }
        Insert: {
          cliente_nome?: string | null
          data_arquivamento?: string | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          id?: string
          itens?: Json | null
          metodo_pagamento?: string | null
          pedido_id: string
          valor_total?: number | null
        }
        Update: {
          cliente_nome?: string | null
          data_arquivamento?: string | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          id?: string
          itens?: Json | null
          metodo_pagamento?: string | null
          pedido_id?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          id: string
          observacao_item: string | null
          pedido_id: string | null
          peso_real: number | null
          peso_solicitado: number | null
          preco_kg: number
          produto_id: string | null
          quantidade: number
          valor_total: number | null
        }
        Insert: {
          id?: string
          observacao_item?: string | null
          pedido_id?: string | null
          peso_real?: number | null
          peso_solicitado?: number | null
          preco_kg: number
          produto_id?: string | null
          quantidade: number
          valor_total?: number | null
        }
        Update: {
          id?: string
          observacao_item?: string | null
          pedido_id?: string | null
          peso_real?: number | null
          peso_solicitado?: number | null
          preco_kg?: number
          produto_id?: string | null
          quantidade?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "vw_pedidos_detalhados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_cpf_cnpj: string | null
          data_criacao: string | null
          data_finalizacao: string | null
          id: string
          metodo_pagamento: string | null
          observacao: string | null
          status: string
          valor_total: number | null
        }
        Insert: {
          cliente_cpf_cnpj?: string | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacao?: string | null
          status: string
          valor_total?: number | null
        }
        Update: {
          cliente_cpf_cnpj?: string | null
          data_criacao?: string | null
          data_finalizacao?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacao?: string | null
          status?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          created_at: string | null
          descricao: string | null
          disponivel: boolean | null
          id: string
          nome: string
          preco_kg: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          id?: string
          nome: string
          preco_kg: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          id?: string
          nome?: string
          preco_kg?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_emails: {
        Row: {
          email: string
          user_id: string
        }
        Insert: {
          email: string
          user_id: string
        }
        Update: {
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_pedidos_detalhados: {
        Row: {
          cliente_cpf_cnpj: string | null
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          data_criacao: string | null
          data_finalizacao: string | null
          id: string | null
          itens: Json | null
          metodo_pagamento: string | null
          observacao: string | null
          status: string | null
          valor_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_sales_dashboard: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_customer_cpf_cnpj?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
