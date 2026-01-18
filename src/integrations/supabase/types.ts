export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          assessor_id: string
          client_id: string | null
          created_at: string
          dismissed: boolean
          id: string
          lead_id: string | null
          message: string
          read: boolean
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          assessor_id: string
          client_id?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          lead_id?: string | null
          message: string
          read?: boolean
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          assessor_id?: string
          client_id?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          lead_id?: string | null
          message?: string
          read?: boolean
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          account_number: string | null
          active: boolean
          assessor_id: string
          birth_date: string | null
          campaign_id: string | null
          cnpj: string | null
          company_name: string | null
          converted_from_lead_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          name: string
          observations: string | null
          origin_id: string | null
          partner_id: string | null
          patrimony: number | null
          phone: string | null
          profile: Database["public"]["Enums"]["investor_profile"] | null
          responsible_birth_date: string | null
          responsible_cpf: string | null
          responsible_name: string | null
          responsible_position: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          state: string | null
          trade_name: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          active?: boolean
          assessor_id: string
          birth_date?: string | null
          campaign_id?: string | null
          cnpj?: string | null
          company_name?: string | null
          converted_from_lead_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          name: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          patrimony?: number | null
          phone?: string | null
          profile?: Database["public"]["Enums"]["investor_profile"] | null
          responsible_birth_date?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          responsible_position?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          state?: string | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          active?: boolean
          assessor_id?: string
          birth_date?: string | null
          campaign_id?: string | null
          cnpj?: string | null
          company_name?: string | null
          converted_from_lead_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          name?: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          patrimony?: number | null
          phone?: string | null
          profile?: Database["public"]["Enums"]["investor_profile"] | null
          responsible_birth_date?: string | null
          responsible_cpf?: string | null
          responsible_name?: string | null
          responsible_position?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          state?: string | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_converted_from_lead_id_fkey"
            columns: ["converted_from_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          asset_id: string
          client_id: string
          created_at: string
          date: string
          id: string
          lots_traded: number
          lots_zeroed: number
          platform_id: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          client_id: string
          created_at?: string
          date: string
          id?: string
          lots_traded?: number
          lots_zeroed?: number
          platform_id: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          lots_traded?: number
          lots_zeroed?: number
          platform_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          assessor_id: string | null
          created_at: string
          date: string
          id: string
          total_clients: number
          total_clients_pf: number
          total_clients_pj: number
          total_leads: number
          total_lots_traded: number
          total_lots_zeroed: number
          total_revenue: number
        }
        Insert: {
          assessor_id?: string | null
          created_at?: string
          date: string
          id?: string
          total_clients?: number
          total_clients_pf?: number
          total_clients_pj?: number
          total_leads?: number
          total_lots_traded?: number
          total_lots_zeroed?: number
          total_revenue?: number
        }
        Update: {
          assessor_id?: string | null
          created_at?: string
          date?: string
          id?: string
          total_clients?: number
          total_clients_pf?: number
          total_clients_pj?: number
          total_leads?: number
          total_lots_traded?: number
          total_lots_zeroed?: number
          total_revenue?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          assessor_id: string | null
          created_at: string
          id: string
          is_office_goal: boolean
          month: number
          target_value: number
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          assessor_id?: string | null
          created_at?: string
          id?: string
          is_office_goal?: boolean
          month: number
          target_value: number
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          assessor_id?: string | null
          created_at?: string
          id?: string
          is_office_goal?: boolean
          month?: number
          target_value?: number
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      interactions: {
        Row: {
          client_id: string | null
          completed_at: string | null
          content: string
          created_at: string
          id: string
          lead_id: string | null
          scheduled_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
          scheduled_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          scheduled_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assessor_id: string
          campaign_id: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          id: string
          loss_reason_id: string | null
          name: string
          observations: string | null
          origin_id: string | null
          partner_id: string | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessor_id: string
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loss_reason_id?: string | null
          name: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessor_id?: string
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loss_reason_id?: string | null
          name?: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_loss_reason_id_fkey"
            columns: ["loss_reason_id"]
            isOneToOne: false
            referencedRelation: "loss_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_reasons: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      origins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          payment_date: string | null
          reference_month: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_date?: string | null
          reference_month: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_date?: string | null
          reference_month?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          commission_percentage: number
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: Database["public"]["Enums"]["partner_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          commission_percentage?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: Database["public"]["Enums"]["partner_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          commission_percentage?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["partner_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_costs: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          platform_id: string
          updated_at: string
          value: number
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          id?: string
          platform_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          platform_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_costs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_costs_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          bank_share: number
          client_id: string
          created_at: string
          date: string
          gross_revenue: number
          id: string
          our_share: number
          product_id: string
          subproduct_id: string | null
          taxes: number
          updated_at: string
        }
        Insert: {
          bank_share?: number
          client_id: string
          created_at?: string
          date: string
          gross_revenue?: number
          id?: string
          our_share?: number
          product_id: string
          subproduct_id?: string | null
          taxes?: number
          updated_at?: string
        }
        Update: {
          bank_share?: number
          client_id?: string
          created_at?: string
          date?: string
          gross_revenue?: number
          id?: string
          our_share?: number
          product_id?: string
          subproduct_id?: string | null
          taxes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_subproduct_id_fkey"
            columns: ["subproduct_id"]
            isOneToOne: false
            referencedRelation: "subproducts"
            referencedColumns: ["id"]
          },
        ]
      }
      subproducts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          product_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          product_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subproducts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_assessor_filter: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_socio: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_type: "aniversario" | "inativo" | "follow_up" | "cross_selling"
      app_role: "socio" | "assessor"
      client_type: "pf" | "pj"
      investor_profile: "conservador" | "moderado" | "arrojado" | "agressivo"
      lead_status:
        | "novo"
        | "em_contato"
        | "troca_assessoria"
        | "convertido"
        | "perdido"
      marital_status:
        | "solteiro"
        | "casado"
        | "divorciado"
        | "viuvo"
        | "uniao_estavel"
      partner_type: "parceiro" | "influenciador"
      sex: "masculino" | "feminino" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_type: ["aniversario", "inativo", "follow_up", "cross_selling"],
      app_role: ["socio", "assessor"],
      client_type: ["pf", "pj"],
      investor_profile: ["conservador", "moderado", "arrojado", "agressivo"],
      lead_status: [
        "novo",
        "em_contato",
        "troca_assessoria",
        "convertido",
        "perdido",
      ],
      marital_status: [
        "solteiro",
        "casado",
        "divorciado",
        "viuvo",
        "uniao_estavel",
      ],
      partner_type: ["parceiro", "influenciador"],
      sex: ["masculino", "feminino", "outro"],
    },
  },
} as const
