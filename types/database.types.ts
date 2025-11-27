export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      comment_summaries: {
        Row: {
          id: string;
          last_comment_id: string | null;
          law_id: string | null;
          proposition_id: string | null;
          sentiment: Json;
          summary_text: string | null;
          total_comments: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          last_comment_id?: string | null;
          law_id?: string | null;
          proposition_id?: string | null;
          sentiment?: Json;
          summary_text?: string | null;
          total_comments?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          last_comment_id?: string | null;
          law_id?: string | null;
          proposition_id?: string | null;
          sentiment?: Json;
          summary_text?: string | null;
          total_comments?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_summaries_last_comment_id_fkey";
            columns: ["last_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_summaries_law_id_fkey";
            columns: ["law_id"];
            isOneToOne: false;
            referencedRelation: "laws";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_summaries_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          law_id: string | null;
          proposition_id: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          law_id?: string | null;
          proposition_id?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          law_id?: string | null;
          proposition_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_law_id_fkey";
            columns: ["law_id"];
            isOneToOne: false;
            referencedRelation: "laws";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      forum_comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "forum_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_comment_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      forum_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          topic_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          topic_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comments_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "forum_topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      forum_topics: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_pinned: boolean;
          law_id: string | null;
          proposition_id: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          law_id?: string | null;
          proposition_id?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          law_id?: string | null;
          proposition_id?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_topics_law_id_fkey";
            columns: ["law_id"];
            isOneToOne: false;
            referencedRelation: "laws";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_topics_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_topics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      laws: {
        Row: {
          ai_summary: string | null;
          ai_summary_updated_at: string | null;
          category: string | null;
          content_text: string | null;
          created_at: string;
          created_by: string | null;
          file_path: string | null;
          id: string;
          number: string | null;
          origin: string | null;
          source_url: string | null;
          state: string | null;
          status: string;
          title: string;
        };
        Insert: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          category?: string | null;
          content_text?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_path?: string | null;
          id?: string;
          number?: string | null;
          origin?: string | null;
          source_url?: string | null;
          state?: string | null;
          status: string;
          title: string;
        };
        Update: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          category?: string | null;
          content_text?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_path?: string | null;
          id?: string;
          number?: string | null;
          origin?: string | null;
          source_url?: string | null;
          state?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laws_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          cpf: string;
          created_at: string;
          display_name: string | null;
          id: string;
          role: string;
          state: string | null;
        };
        Insert: {
          cpf: string;
          created_at?: string;
          display_name?: string | null;
          id: string;
          role?: string;
          state?: string | null;
        };
        Update: {
          cpf?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          role?: string;
          state?: string | null;
        };
        Relationships: [];
      };
      propositions: {
        Row: {
          ai_summary: string | null;
          ai_summary_updated_at: string | null;
          author: string | null;
          author_party: string | null;
          author_state: string | null;
          camara_id: number;
          created_at: string;
          ementa: string | null;
          ementa_detalhada: string | null;
          fetched_at: string;
          fetched_range_end: string | null;
          fetched_range_start: string | null;
          full_text_url: string | null;
          house: string;
          id: string;
          keywords: string[] | null;
          number: number;
          origin: string | null;
          presentation_date: string;
          sigla_tipo: string;
          source_url: string | null;
          status: string;
          status_code: number | null;
          status_date: string | null;
          status_situation: string | null;
          theme: string | null;
          title: string;
          tramitacao_url: string | null;
          type: string;
          updated_at: string;
          year: number;
        };
        Insert: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          author?: string | null;
          author_party?: string | null;
          author_state?: string | null;
          camara_id: number;
          created_at?: string;
          ementa?: string | null;
          ementa_detalhada?: string | null;
          fetched_at?: string;
          fetched_range_end?: string | null;
          fetched_range_start?: string | null;
          full_text_url?: string | null;
          house?: string;
          id?: string;
          keywords?: string[] | null;
          number: number;
          origin?: string | null;
          presentation_date: string;
          sigla_tipo: string;
          source_url?: string | null;
          status: string;
          status_code?: number | null;
          status_date?: string | null;
          status_situation?: string | null;
          theme?: string | null;
          title: string;
          tramitacao_url?: string | null;
          type: string;
          updated_at?: string;
          year: number;
        };
        Update: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          author?: string | null;
          author_party?: string | null;
          author_state?: string | null;
          camara_id?: number;
          created_at?: string;
          ementa?: string | null;
          ementa_detalhada?: string | null;
          fetched_at?: string;
          fetched_range_end?: string | null;
          fetched_range_start?: string | null;
          full_text_url?: string | null;
          house?: string;
          id?: string;
          keywords?: string[] | null;
          number?: number;
          origin?: string | null;
          presentation_date?: string;
          sigla_tipo?: string;
          source_url?: string | null;
          status?: string;
          status_code?: number | null;
          status_date?: string | null;
          status_situation?: string | null;
          theme?: string | null;
          title?: string;
          tramitacao_url?: string | null;
          type?: string;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      proposition_highlight_overrides: {
        Row: {
          created_at: string;
          expires_at: string | null;
          priority: number;
          proposition_id: string;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          priority?: number;
          proposition_id: string;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          priority?: number;
          proposition_id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proposition_highlight_overrides_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: true;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          }
        ];
      };
      proposition_interest_daily: {
        Row: {
          created_at: string;
          day: string;
          favorites: number;
          id: string;
          proposition_id: string;
          shares: number;
          updated_at: string;
          views: number;
        };
        Insert: {
          created_at?: string;
          day: string;
          favorites?: number;
          id?: string;
          proposition_id: string;
          shares?: number;
          updated_at?: string;
          views?: number;
        };
        Update: {
          created_at?: string;
          day?: string;
          favorites?: number;
          id?: string;
          proposition_id?: string;
          shares?: number;
          updated_at?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "proposition_interest_daily_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          }
        ];
      };
      stances: {
        Row: {
          created_at: string;
          id: string;
          law_id: string | null;
          proposition_id: string | null;
          stance: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          law_id?: string | null;
          proposition_id?: string | null;
          stance: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          law_id?: string | null;
          proposition_id?: string | null;
          stance?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stances_law_id_fkey";
            columns: ["law_id"];
            isOneToOne: false;
            referencedRelation: "laws";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stances_proposition_id_fkey";
            columns: ["proposition_id"];
            isOneToOne: false;
            referencedRelation: "propositions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      proposition_interest_windows: {
        Row: {
          favorites_last7: number | null;
          favorites_prev7: number | null;
          proposition_id: string | null;
          shares_last7: number | null;
          shares_prev7: number | null;
          views_last7: number | null;
          views_prev7: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      can_manage_laws: { Args: never; Returns: boolean };
      increment_proposition_interest: {
        Args: {
          p_proposition_id: string;
          p_event: string;
          p_amount?: number;
        };
        Returns: void;
      };
      is_admin: { Args: never; Returns: boolean };
      is_verified: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
