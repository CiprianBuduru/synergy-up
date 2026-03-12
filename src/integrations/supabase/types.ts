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
      alternatives: {
        Row: {
          active: boolean
          explanation: string
          id: string
          relevance_tags_json: Json
          source_request_keyword: string
          suggested_product_or_kit: string
        }
        Insert: {
          active?: boolean
          explanation?: string
          id?: string
          relevance_tags_json?: Json
          source_request_keyword: string
          suggested_product_or_kit?: string
        }
        Update: {
          active?: boolean
          explanation?: string
          id?: string
          relevance_tags_json?: Json
          source_request_keyword?: string
          suggested_product_or_kit?: string
        }
        Relationships: []
      }
      briefs: {
        Row: {
          company_id: string
          created_at: string
          department_detected: string
          eligibility_status: string
          id: string
          raw_brief: string
          requested_products_json: Json
          requested_purpose: string
          target_audience: string
          tone_recommended: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_detected?: string
          eligibility_status?: string
          id?: string
          raw_brief?: string
          requested_products_json?: Json
          requested_purpose?: string
          target_audience?: string
          tone_recommended?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_detected?: string
          eligibility_status?: string
          id?: string
          raw_brief?: string
          requested_products_json?: Json
          requested_purpose?: string
          target_audience?: string
          tone_recommended?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calculations: {
        Row: {
          company_id: string
          created_at: string
          disabled_employees_declared: number
          employee_count_used: number
          id: string
          min_wage_used: number
          monthly_obligation_estimated: number
          notes: string
          required_positions_4_percent: number
          spendable_half_estimated: number
          uncovered_positions: number
        }
        Insert: {
          company_id: string
          created_at?: string
          disabled_employees_declared?: number
          employee_count_used?: number
          id?: string
          min_wage_used?: number
          monthly_obligation_estimated?: number
          notes?: string
          required_positions_4_percent?: number
          spendable_half_estimated?: number
          uncovered_positions?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          disabled_employees_declared?: number
          employee_count_used?: number
          id?: string
          min_wage_used?: number
          monthly_obligation_estimated?: number
          notes?: string
          required_positions_4_percent?: number
          spendable_half_estimated?: number
          uncovered_positions?: number
        }
        Relationships: [
          {
            foreignKeyName: "calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          company_size: string
          contact_department: string
          contact_name: string
          contact_role: string
          created_at: string
          description: string
          email: string
          id: string
          industry: string
          legal_name: string
          location: string
          notes: string
          phone: string
          updated_at: string
          website: string
        }
        Insert: {
          company_name: string
          company_size?: string
          contact_department?: string
          contact_name?: string
          contact_role?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          industry?: string
          legal_name?: string
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          website?: string
        }
        Update: {
          company_name?: string
          company_size?: string
          contact_department?: string
          contact_name?: string
          contact_role?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          industry?: string
          legal_name?: string
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      company_enrichments: {
        Row: {
          caen_code: string
          caen_label: string
          company_id: string
          created_at: string
          employee_count_confidence: number
          employee_count_estimate: number | null
          employee_count_exact: number | null
          employee_count_max: number | null
          employee_count_min: number | null
          enrichment_status: string
          headquarters: string
          id: string
          industry_label: string
          last_enriched_at: string
          legal_name: string
          linkedin_url: string
          public_summary: string
          signals_json: Json
          sources_json: Json
          website: string
        }
        Insert: {
          caen_code?: string
          caen_label?: string
          company_id: string
          created_at?: string
          employee_count_confidence?: number
          employee_count_estimate?: number | null
          employee_count_exact?: number | null
          employee_count_max?: number | null
          employee_count_min?: number | null
          enrichment_status?: string
          headquarters?: string
          id?: string
          industry_label?: string
          last_enriched_at?: string
          legal_name?: string
          linkedin_url?: string
          public_summary?: string
          signals_json?: Json
          sources_json?: Json
          website?: string
        }
        Update: {
          caen_code?: string
          caen_label?: string
          company_id?: string
          created_at?: string
          employee_count_confidence?: number
          employee_count_estimate?: number | null
          employee_count_exact?: number | null
          employee_count_max?: number | null
          employee_count_min?: number | null
          enrichment_status?: string
          headquarters?: string
          id?: string
          industry_label?: string
          last_enriched_at?: string
          legal_name?: string
          linkedin_url?: string
          public_summary?: string
          signals_json?: Json
          sources_json?: Json
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_enrichments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_follow_ups: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_follow_ups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_timeline_events: {
        Row: {
          company_id: string
          created_at: string
          event_label: string
          event_type: string
          id: string
          metadata_json: Json
        }
        Insert: {
          company_id: string
          created_at?: string
          event_label?: string
          event_type?: string
          id?: string
          metadata_json?: Json
        }
        Update: {
          company_id?: string
          created_at?: string
          event_label?: string
          event_type?: string
          id?: string
          metadata_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "company_timeline_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kits: {
        Row: {
          active: boolean
          alternative_for: Json
          audience: string
          category: string
          complexity: string
          components_json: Json
          eligibility_explanation: string
          eligibility_type: string
          id: string
          internal_operations_json: Json
          is_alternative: boolean
          name: string
          presentation_use_case: string
          purpose: string
          sales_angle: string
          suggested_industries_json: Json
          supporting_caen_codes_json: Json
          target_departments: Json
        }
        Insert: {
          active?: boolean
          alternative_for?: Json
          audience?: string
          category?: string
          complexity?: string
          components_json?: Json
          eligibility_explanation?: string
          eligibility_type?: string
          id?: string
          internal_operations_json?: Json
          is_alternative?: boolean
          name: string
          presentation_use_case?: string
          purpose?: string
          sales_angle?: string
          suggested_industries_json?: Json
          supporting_caen_codes_json?: Json
          target_departments?: Json
        }
        Update: {
          active?: boolean
          alternative_for?: Json
          audience?: string
          category?: string
          complexity?: string
          components_json?: Json
          eligibility_explanation?: string
          eligibility_type?: string
          id?: string
          internal_operations_json?: Json
          is_alternative?: boolean
          name?: string
          presentation_use_case?: string
          purpose?: string
          sales_angle?: string
          suggested_industries_json?: Json
          supporting_caen_codes_json?: Json
          target_departments?: Json
        }
        Relationships: []
      }
      operations: {
        Row: {
          active: boolean
          caen_code: string
          description: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          caen_code?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          caen_code?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      presentations: {
        Row: {
          brief_id: string | null
          company_id: string
          created_at: string
          generated_summary: string
          id: string
          objective: string
          status: string
          title: string
          tone: string
          updated_at: string
        }
        Insert: {
          brief_id?: string | null
          company_id: string
          created_at?: string
          generated_summary?: string
          id?: string
          objective?: string
          status?: string
          title: string
          tone?: string
          updated_at?: string
        }
        Update: {
          brief_id?: string | null
          company_id?: string
          created_at?: string
          generated_summary?: string
          id?: string
          objective?: string
          status?: string
          title?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          base_product_type: string
          category: string
          description: string
          eligible_logic: string
          id: string
          internal_operations_json: Json
          name: string
          notes: string
          slug: string
          suggested_industries_json: Json
          suitable_departments_json: Json
          suitable_for_json: Json
          supporting_caen_codes_json: Json
          usable_in_kits: boolean
        }
        Insert: {
          active?: boolean
          base_product_type?: string
          category?: string
          description?: string
          eligible_logic?: string
          id?: string
          internal_operations_json?: Json
          name: string
          notes?: string
          slug: string
          suggested_industries_json?: Json
          suitable_departments_json?: Json
          suitable_for_json?: Json
          supporting_caen_codes_json?: Json
          usable_in_kits?: boolean
        }
        Update: {
          active?: boolean
          base_product_type?: string
          category?: string
          description?: string
          eligible_logic?: string
          id?: string
          internal_operations_json?: Json
          name?: string
          notes?: string
          slug?: string
          suggested_industries_json?: Json
          suitable_departments_json?: Json
          suitable_for_json?: Json
          supporting_caen_codes_json?: Json
          usable_in_kits?: boolean
        }
        Relationships: []
      }
      slides: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata_json: Json
          presentation_id: string
          slide_order: number
          slide_type: string
          title: string
          visible: boolean
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          presentation_id: string
          slide_order?: number
          slide_type?: string
          title?: string
          visible?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata_json?: Json
          presentation_id?: string
          slide_order?: number
          slide_type?: string
          title?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "slides_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
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
