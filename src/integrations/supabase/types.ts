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
      children: {
        Row: {
          age: number | null
          avatar_emoji: string | null
          created_at: string
          id: string
          name: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_emoji?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_emoji?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_levels: {
        Row: {
          created_at: string
          difficulty: string
          game_id: string
          id: string
          level_number: number
          name: string
          obstacles: number
          speed: number
          time_limit: number
        }
        Insert: {
          created_at?: string
          difficulty: string
          game_id: string
          id?: string
          level_number: number
          name: string
          obstacles: number
          speed: number
          time_limit: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          game_id?: string
          id?: string
          level_number?: number
          name?: string
          obstacles?: number
          speed?: number
          time_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_levels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_levels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["game_id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          attempts: number | null
          child_id: string
          completed: boolean | null
          created_at: string
          difficulty: string | null
          game_id: string
          id: string
          moves: number | null
          score: number
          time_spent: number | null
          win: boolean | null
        }
        Insert: {
          attempts?: number | null
          child_id: string
          completed?: boolean | null
          created_at?: string
          difficulty?: string | null
          game_id: string
          id?: string
          moves?: number | null
          score?: number
          time_spent?: number | null
          win?: boolean | null
        }
        Update: {
          attempts?: number | null
          child_id?: string
          completed?: boolean | null
          created_at?: string
          difficulty?: string | null
          game_id?: string
          id?: string
          moves?: number | null
          score?: number
          time_spent?: number | null
          win?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["game_id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          emoji: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          emoji: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          emoji?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_parent: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_parent?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_parent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sentiment_analysis: {
        Row: {
          child_id: string
          created_at: string
          enjoyment_level: number | null
          focus_level: number | null
          frustration_level: number | null
          game_session_id: string
          id: string
          notes: string | null
          overall_sentiment: string | null
          persistence_level: number | null
        }
        Insert: {
          child_id: string
          created_at?: string
          enjoyment_level?: number | null
          focus_level?: number | null
          frustration_level?: number | null
          game_session_id: string
          id?: string
          notes?: string | null
          overall_sentiment?: string | null
          persistence_level?: number | null
        }
        Update: {
          child_id?: string
          created_at?: string
          enjoyment_level?: number | null
          focus_level?: number | null
          frustration_level?: number | null
          game_session_id?: string
          id?: string
          notes?: string | null
          overall_sentiment?: string | null
          persistence_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentiment_analysis_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "sentiment_analysis_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_emoji: string | null
          child_id: string | null
          child_name: string | null
          created_at: string | null
          difficulty: string | null
          game_id: string | null
          game_name: string | null
          game_slug: string | null
          score: number | null
        }
        Relationships: []
      }
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
