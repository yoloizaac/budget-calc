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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          email: string
          id: string
          role: string
        }
        Insert: {
          email: string
          id?: string
          role?: string
        }
        Update: {
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          admin_notes: string | null
          bug_type: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bug_type?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bug_type?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_log: {
        Row: {
          country: string
          date: string
          dinner_thb: number | null
          id: string
          lunch_thb: number | null
          misc_thb: number | null
          notes: string | null
          other_food_thb: number | null
          transport_thb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country: string
          date: string
          dinner_thb?: number | null
          id?: string
          lunch_thb?: number | null
          misc_thb?: number | null
          notes?: string | null
          other_food_thb?: number | null
          transport_thb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string
          date?: string
          dinner_thb?: number | null
          id?: string
          lunch_thb?: number | null
          misc_thb?: number | null
          notes?: string | null
          other_food_thb?: number | null
          transport_thb?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_log_photos: {
        Row: {
          caption: string | null
          created_at: string
          daily_log_id: string
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          daily_log_id: string
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          daily_log_id?: string
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_photos_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_log"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_suggestions: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      funding: {
        Row: {
          amount_thb: number
          currency: string | null
          date: string | null
          description: string | null
          id: string
          is_expected: boolean | null
          is_received: boolean | null
          notes: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount_thb: number
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_expected?: boolean | null
          is_received?: boolean | null
          notes?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount_thb?: number
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          is_expected?: boolean | null
          is_received?: boolean | null
          notes?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_payments: {
        Row: {
          amount_thb: number | null
          due_date: string | null
          id: string
          is_paid: boolean | null
          month: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          user_id: string
        }
        Insert: {
          amount_thb?: number | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          month: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          user_id: string
        }
        Update: {
          amount_thb?: number | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          month?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      transaction_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          storage_path: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path: string
          transaction_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_thb: number
          category: string
          country: string | null
          created_at: string | null
          date: string
          description: string | null
          has_receipt: boolean | null
          id: string
          is_reimbursable: boolean | null
          notes: string | null
          payment_method: string | null
          subcategory: string | null
          user_id: string
        }
        Insert: {
          amount_thb: number
          category: string
          country?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          has_receipt?: boolean | null
          id?: string
          is_reimbursable?: boolean | null
          notes?: string | null
          payment_method?: string | null
          subcategory?: string | null
          user_id: string
        }
        Update: {
          amount_thb?: number
          category?: string
          country?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          has_receipt?: boolean | null
          id?: string
          is_reimbursable?: boolean | null
          notes?: string | null
          payment_method?: string | null
          subcategory?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          id: string
          last_active_at: string
          session_count: number
          user_email: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_active_at?: string
          session_count?: number
          user_email?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_active_at?: string
          session_count?: number
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_role: { Args: { _user_id: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
