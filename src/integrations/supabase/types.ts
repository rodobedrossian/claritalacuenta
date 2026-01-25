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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          created_at: string | null
          currency: string
          id: string
          is_active: boolean | null
          monthly_limit: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          monthly_limit: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          monthly_limit?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_card_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          credit_card_id: string | null
          currency: string
          date: string
          description: string
          id: string
          installment_current: number | null
          installment_total: number | null
          statement_import_id: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          currency?: string
          date: string
          description: string
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          statement_import_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string | null
          currency?: string
          date?: string
          description?: string
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          statement_import_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_transactions_statement_import_id_fkey"
            columns: ["statement_import_id"]
            isOneToOne: false
            referencedRelation: "statement_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          bank: string | null
          closing_day: number | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank?: string | null
          closing_day?: number | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank?: string | null
          closing_day?: number | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_parsers: {
        Row: {
          amount_regex: string
          category: string
          created_at: string | null
          currency: string | null
          date_regex: string | null
          id: string
          is_active: boolean | null
          name: string
          sender_email: string
          subject_pattern: string | null
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount_regex: string
          category: string
          created_at?: string | null
          currency?: string | null
          date_regex?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sender_email: string
          subject_pattern?: string | null
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount_regex?: string
          category?: string
          created_at?: string | null
          currency?: string | null
          date_regex?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sender_email?: string
          subject_pattern?: string | null
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          id: string
          rate: number
          source: string
          updated_at: string
        }
        Insert: {
          id?: string
          rate: number
          source?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rate?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          access_token: string
          created_at: string | null
          email: string
          history_id: string | null
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string | null
          user_id: string
          watch_expiration: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email: string
          history_id?: string | null
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string | null
          user_id: string
          watch_expiration?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email?: string
          history_id?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
          watch_expiration?: string | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          created_at: string | null
          currency: string
          current_amount: number
          end_date: string | null
          id: string
          institution: string | null
          interest_rate: number | null
          investment_type: string
          is_active: boolean | null
          name: string
          notes: string | null
          principal_amount: number
          rate_type: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency: string
          current_amount: number
          end_date?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          investment_type: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          principal_amount: number
          rate_type?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          current_amount?: number
          end_date?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          investment_type?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          principal_amount?: number
          rate_type?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          body: string
          data: Json | null
          id: string
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          budget_exceeded_alert: boolean | null
          created_at: string | null
          evening_expense_reminder: boolean | null
          evening_time: string | null
          id: string
          monthly_recurring_reminder: boolean | null
          monthly_reminder_day: number | null
          morning_budget_check: boolean | null
          morning_time: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_exceeded_alert?: boolean | null
          created_at?: string | null
          evening_expense_reminder?: boolean | null
          evening_time?: string | null
          id?: string
          monthly_recurring_reminder?: boolean | null
          monthly_reminder_day?: number | null
          morning_budget_check?: boolean | null
          morning_time?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_exceeded_alert?: boolean | null
          created_at?: string | null
          evening_expense_reminder?: boolean | null
          evening_time?: string | null
          id?: string
          monthly_recurring_reminder?: boolean | null
          monthly_reminder_day?: number | null
          morning_budget_check?: boolean | null
          morning_time?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      processed_emails: {
        Row: {
          gmail_connection_id: string | null
          id: string
          message_id: string
          processed_at: string | null
          raw_snippet: string | null
          raw_subject: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          gmail_connection_id?: string | null
          id?: string
          message_id: string
          processed_at?: string | null
          raw_snippet?: string | null
          raw_subject?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          gmail_connection_id?: string | null
          id?: string
          message_id?: string
          processed_at?: string | null
          raw_snippet?: string | null
          raw_subject?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_emails_gmail_connection_id_fkey"
            columns: ["gmail_connection_id"]
            isOneToOne: false
            referencedRelation: "gmail_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_emails_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          category: string
          created_at: string | null
          currency: string
          default_amount: number
          description: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string
          default_amount: number
          description: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string
          default_amount?: number
          description?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings: {
        Row: {
          ars_amount: number
          ars_cash: number | null
          id: string
          updated_at: string
          usd_amount: number
          usd_cash: number | null
          user_id: string | null
        }
        Insert: {
          ars_amount?: number
          ars_cash?: number | null
          id?: string
          updated_at?: string
          usd_amount?: number
          usd_cash?: number | null
          user_id?: string | null
        }
        Update: {
          ars_amount?: number
          ars_cash?: number | null
          id?: string
          updated_at?: string
          usd_amount?: number
          usd_cash?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      savings_entries: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          entry_type: string
          id: string
          notes: string | null
          savings_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          entry_type: string
          id?: string
          notes?: string | null
          savings_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          entry_type?: string
          id?: string
          notes?: string | null
          savings_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency: string
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      statement_imports: {
        Row: {
          created_at: string
          credit_card_id: string | null
          error_message: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          id: string
          statement_month: string
          status: string
          transactions_created: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_card_id?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          id?: string
          statement_month: string
          status?: string
          transactions_created?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_card_id?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          statement_month?: string
          status?: string
          transactions_created?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "statement_imports_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          credit_card_id: string | null
          currency: string
          date: string
          description: string
          email_message_id: string | null
          from_savings: boolean | null
          id: string
          payment_method: string
          savings_source: string | null
          source: string | null
          statement_import_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          credit_card_id?: string | null
          currency: string
          date?: string
          description: string
          email_message_id?: string | null
          from_savings?: boolean | null
          id?: string
          payment_method?: string
          savings_source?: string | null
          source?: string | null
          statement_import_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          credit_card_id?: string | null
          currency?: string
          date?: string
          description?: string
          email_message_id?: string | null
          from_savings?: boolean | null
          id?: string
          payment_method?: string
          savings_source?: string | null
          source?: string | null
          statement_import_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_statement_import_id_fkey"
            columns: ["statement_import_id"]
            isOneToOne: false
            referencedRelation: "statement_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
