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
      assessor_badges: {
        Row: {
          badge_emoji: string
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          period: string | null
          user_id: string
        }
        Insert: {
          badge_emoji: string
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          period?: string | null
          user_id: string
        }
        Update: {
          badge_emoji?: string
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          period?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assessor_points: {
        Row: {
          action_type: string
          description: string | null
          earned_at: string
          id: string
          points: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          description?: string | null
          earned_at?: string
          id?: string
          points: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          points?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assessor_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          id: string
          last_activity_date: string | null
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          streak_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      churn_events: {
        Row: {
          action_taken: string | null
          churn_probability: number
          client_id: string
          id: string
          outcome: string | null
          predicted_at: string
          resolved_at: string | null
          risk_factors: Json
        }
        Insert: {
          action_taken?: string | null
          churn_probability: number
          client_id: string
          id?: string
          outcome?: string | null
          predicted_at?: string
          resolved_at?: string | null
          risk_factors?: Json
        }
        Update: {
          action_taken?: string | null
          churn_probability?: number
          client_id?: string
          id?: string
          outcome?: string | null
          predicted_at?: string
          resolved_at?: string | null
          risk_factors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "churn_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_account_mappings: {
        Row: {
          account_number: string
          client_id: string
          created_at: string | null
          id: string
          merged_at: string | null
          original_client_name: string | null
        }
        Insert: {
          account_number: string
          client_id: string
          created_at?: string | null
          id?: string
          merged_at?: string | null
          original_client_name?: string | null
        }
        Update: {
          account_number?: string
          client_id?: string
          created_at?: string | null
          id?: string
          merged_at?: string | null
          original_client_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_account_mappings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_scores: {
        Row: {
          calculated_at: string
          classification: Database["public"]["Enums"]["risk_classification"]
          client_id: string
          components: Json
          created_at: string
          id: string
          score: number
        }
        Insert: {
          calculated_at?: string
          classification: Database["public"]["Enums"]["risk_classification"]
          client_id: string
          components?: Json
          created_at?: string
          id?: string
          score: number
        }
        Update: {
          calculated_at?: string
          classification?: Database["public"]["Enums"]["risk_classification"]
          client_id?: string
          components?: Json
          created_at?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_health_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_lifecycle: {
        Row: {
          changed_at: string
          changed_by: string | null
          client_id: string
          id: string
          previous_stage:
            | Database["public"]["Enums"]["client_lifecycle_stage"]
            | null
          reason: string | null
          stage: Database["public"]["Enums"]["client_lifecycle_stage"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          client_id: string
          id?: string
          previous_stage?:
            | Database["public"]["Enums"]["client_lifecycle_stage"]
            | null
          reason?: string | null
          stage: Database["public"]["Enums"]["client_lifecycle_stage"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          client_id?: string
          id?: string
          previous_stage?:
            | Database["public"]["Enums"]["client_lifecycle_stage"]
            | null
          reason?: string | null
          stage?: Database["public"]["Enums"]["client_lifecycle_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "client_lifecycle_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      influencer_campaigns: {
        Row: {
          accounts_opened: number | null
          actual_cost: number | null
          budget: number | null
          campaign_type: string
          contracts_generated: number | null
          created_at: string
          end_date: string | null
          id: string
          influencer_id: string
          leads_generated: number | null
          name: string
          notes: string | null
          revenue_generated: number | null
          start_date: string | null
          status: string
          tracking_code: string | null
        }
        Insert: {
          accounts_opened?: number | null
          actual_cost?: number | null
          budget?: number | null
          campaign_type: string
          contracts_generated?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          influencer_id: string
          leads_generated?: number | null
          name: string
          notes?: string | null
          revenue_generated?: number | null
          start_date?: string | null
          status?: string
          tracking_code?: string | null
        }
        Update: {
          accounts_opened?: number | null
          actual_cost?: number | null
          budget?: number | null
          campaign_type?: string
          contracts_generated?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          influencer_id?: string
          leads_generated?: number | null
          name?: string
          notes?: string | null
          revenue_generated?: number | null
          start_date?: string | null
          status?: string
          tracking_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_campaigns_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_negotiations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          influencer_id: string
          interaction_type: string
          next_action: string | null
          next_action_date: string | null
          outcome: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          influencer_id: string
          interaction_type: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          influencer_id?: string
          interaction_type?: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_negotiations_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_profiles: {
        Row: {
          assigned_to: string | null
          audience_profile: string | null
          content_style: string | null
          created_at: string
          email: string | null
          engagement_rate: number | null
          estimated_cpl: number | null
          estimated_reach: number | null
          id: string
          instagram_followers: number | null
          instagram_handle: string | null
          monthly_cost_estimate: number | null
          name: string
          niche: string[] | null
          notes: string | null
          partner_id: string | null
          phone: string | null
          proposed_commission: number | null
          proposed_model: string | null
          qualification_score: number | null
          source: string | null
          stage: Database["public"]["Enums"]["influencer_stage"]
          tiktok_followers: number | null
          tiktok_handle: string | null
          twitter_followers: number | null
          twitter_handle: string | null
          updated_at: string
          youtube_channel: string | null
          youtube_subscribers: number | null
        }
        Insert: {
          assigned_to?: string | null
          audience_profile?: string | null
          content_style?: string | null
          created_at?: string
          email?: string | null
          engagement_rate?: number | null
          estimated_cpl?: number | null
          estimated_reach?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          monthly_cost_estimate?: number | null
          name: string
          niche?: string[] | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          proposed_commission?: number | null
          proposed_model?: string | null
          qualification_score?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["influencer_stage"]
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          youtube_channel?: string | null
          youtube_subscribers?: number | null
        }
        Update: {
          assigned_to?: string | null
          audience_profile?: string | null
          content_style?: string | null
          created_at?: string
          email?: string | null
          engagement_rate?: number | null
          estimated_cpl?: number | null
          estimated_reach?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          monthly_cost_estimate?: number | null
          name?: string
          niche?: string[] | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          proposed_commission?: number | null
          proposed_model?: string | null
          qualification_score?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["influencer_stage"]
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          youtube_channel?: string | null
          youtube_subscribers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
          client_id: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          id: string
          loss_reason_id: string | null
          lost_at: string | null
          name: string
          observations: string | null
          origin_id: string | null
          partner_id: string | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          target_product_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessor_id: string
          campaign_id?: string | null
          client_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loss_reason_id?: string | null
          lost_at?: string | null
          name: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          target_product_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessor_id?: string
          campaign_id?: string | null
          client_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          loss_reason_id?: string | null
          lost_at?: string | null
          name?: string
          observations?: string | null
          origin_id?: string | null
          partner_id?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          target_product_id?: string | null
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
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          {
            foreignKeyName: "leads_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      macro_events: {
        Row: {
          country: string
          created_at: string
          description: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["macro_event_type"]
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          name: string
          recurring: boolean
        }
        Insert: {
          country?: string
          created_at?: string
          description?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["macro_event_type"]
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"]
          name: string
          recurring?: boolean
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["macro_event_type"]
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"]
          name?: string
          recurring?: boolean
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
      retention_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          churn_event_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          playbook_id: string | null
          status: string
          step_order: number
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          churn_event_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          playbook_id?: string | null
          status?: string
          step_order: number
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          churn_event_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          playbook_id?: string | null
          status?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "retention_actions_churn_event_id_fkey"
            columns: ["churn_event_id"]
            isOneToOne: false
            referencedRelation: "churn_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_actions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "retention_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_playbooks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          risk_classification: Database["public"]["Enums"]["risk_classification"]
          steps: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          risk_classification: Database["public"]["Enums"]["risk_classification"]
          steps?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          risk_classification?: Database["public"]["Enums"]["risk_classification"]
          steps?: Json
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
      tasks: {
        Row: {
          assignee_id: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          lead_id: string | null
          priority: string
          reminder_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          lead_id?: string | null
          priority?: string
          reminder_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          priority?: string
          reminder_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      get_clients_chart: {
        Args: { p_end_date?: string; p_months?: number; p_start_date?: string }
        Returns: Json
      }
      get_contracts_chart: {
        Args: { p_end_date?: string; p_months?: number; p_start_date?: string }
        Returns: Json
      }
      get_dashboard_metrics: {
        Args: { p_end_date?: string; p_months?: number; p_start_date?: string }
        Returns: Json
      }
      get_retention_dashboard: { Args: never; Returns: Json }
      get_revenue_chart: {
        Args: { p_end_date?: string; p_months?: number; p_start_date?: string }
        Returns: Json
      }
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
      client_lifecycle_stage:
        | "onboarding"
        | "active"
        | "at_risk"
        | "churning"
        | "churned"
        | "reactivated"
      client_type: "pf" | "pj"
      impact_level: "high" | "medium" | "low"
      influencer_stage:
        | "identified"
        | "researching"
        | "contacted"
        | "negotiating"
        | "contracted"
        | "active"
        | "paused"
        | "lost"
      investor_profile: "conservador" | "moderado" | "arrojado" | "agressivo"
      lead_status:
        | "novo"
        | "em_contato"
        | "troca_assessoria"
        | "convertido"
        | "perdido"
      macro_event_type:
        | "fomc"
        | "copom"
        | "payroll"
        | "cpi"
        | "ipca"
        | "pib"
        | "earnings"
        | "options_expiry"
        | "contract_rollover"
        | "other"
      marital_status:
        | "solteiro"
        | "casado"
        | "divorciado"
        | "viuvo"
        | "uniao_estavel"
      partner_type: "parceiro" | "influenciador"
      risk_classification: "healthy" | "attention" | "critical" | "lost"
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
      client_lifecycle_stage: [
        "onboarding",
        "active",
        "at_risk",
        "churning",
        "churned",
        "reactivated",
      ],
      client_type: ["pf", "pj"],
      impact_level: ["high", "medium", "low"],
      influencer_stage: [
        "identified",
        "researching",
        "contacted",
        "negotiating",
        "contracted",
        "active",
        "paused",
        "lost",
      ],
      investor_profile: ["conservador", "moderado", "arrojado", "agressivo"],
      lead_status: [
        "novo",
        "em_contato",
        "troca_assessoria",
        "convertido",
        "perdido",
      ],
      macro_event_type: [
        "fomc",
        "copom",
        "payroll",
        "cpi",
        "ipca",
        "pib",
        "earnings",
        "options_expiry",
        "contract_rollover",
        "other",
      ],
      marital_status: [
        "solteiro",
        "casado",
        "divorciado",
        "viuvo",
        "uniao_estavel",
      ],
      partner_type: ["parceiro", "influenciador"],
      risk_classification: ["healthy", "attention", "critical", "lost"],
      sex: ["masculino", "feminino", "outro"],
    },
  },
} as const
