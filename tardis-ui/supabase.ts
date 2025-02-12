export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
  public: {
    Tables: {
      apikeys: {
        Row: {
          apiKeyOpenAi: string | null
          created_at: string
          id: number
          userId: string | null
        }
        Insert: {
          apiKeyOpenAi?: string | null
          created_at?: string
          id?: number
          userId?: string | null
        }
        Update: {
          apiKeyOpenAi?: string | null
          created_at?: string
          id?: number
          userId?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          chapter: string | null
          chaptertitle: string | null
          context: string | null
          created_at: string | null
          id: number
          knowledge_id: number
          lines: number | null
          seeded: boolean | null
          subtopic: string | null
          topic: string | null
        }
        Insert: {
          chapter?: string | null
          chaptertitle?: string | null
          context?: string | null
          created_at?: string | null
          id: number
          knowledge_id: number
          lines?: number | null
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Update: {
          chapter?: string | null
          chaptertitle?: string | null
          context?: string | null
          created_at?: string | null
          id?: number
          knowledge_id?: number
          lines?: number | null
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      chapters_local: {
        Row: {
          chapter: string | null
          chaptertitle: string | null
          context: string | null
          created_at: string | null
          id: number
          k_id: number | null
          knowledge_id: number
          lines: number | null
          seeded: boolean | null
          subtopic: string | null
          topic: string | null
        }
        Insert: {
          chapter?: string | null
          chaptertitle?: string | null
          context?: string | null
          created_at?: string | null
          id?: number
          k_id?: number | null
          knowledge_id: number
          lines?: number | null
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Update: {
          chapter?: string | null
          chaptertitle?: string | null
          context?: string | null
          created_at?: string | null
          id?: number
          k_id?: number | null
          knowledge_id?: number
          lines?: number | null
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_local_k_id_fkey"
            columns: ["k_id"]
            isOneToOne: false
            referencedRelation: "knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters_v1: {
        Row: {
          chapter: string | null
          chaptertitle: string
          context: string | null
          created_at: string | null
          id: number
          k_id: number
          knowledge_id: number
          lines: number | null
          seeded: boolean | null
          subtopic: string
          topic: string | null
        }
        Insert: {
          chapter?: string | null
          chaptertitle: string
          context?: string | null
          created_at?: string | null
          id?: number
          k_id: number
          knowledge_id: number
          lines?: number | null
          seeded?: boolean | null
          subtopic: string
          topic?: string | null
        }
        Update: {
          chapter?: string | null
          chaptertitle?: string
          context?: string | null
          created_at?: string | null
          id?: number
          k_id?: number
          knowledge_id?: number
          lines?: number | null
          seeded?: boolean | null
          subtopic?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_v1_k_id_fkey"
            columns: ["k_id"]
            isOneToOne: false
            referencedRelation: "knowledge"
            referencedColumns: ["id"]
          },
        ]
      }
      EdTechContent: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          topic: string
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          topic: string
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          topic?: string
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_Bengali: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_English: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_Hindi: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_local: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          topic: string
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          topic: string
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          topic?: string
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_Marathi: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      EdTechContent_Vietnamese: {
        Row: {
          chapter: string
          chapter_id: number
          context: string | null
          created_at: string | null
          id: number
          image_url: string | null
          knowledge_id: number
          latex_code: string | null
          notes: string | null
          quiz: Json | null
          subtopic: string
          summary: string | null
          video_url: string | null
        }
        Insert: {
          chapter: string
          chapter_id: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic: string
          summary?: string | null
          video_url?: string | null
        }
        Update: {
          chapter?: string
          chapter_id?: number
          context?: string | null
          created_at?: string | null
          id?: number
          image_url?: string | null
          knowledge_id?: number
          latex_code?: string | null
          notes?: string | null
          quiz?: Json | null
          subtopic?: string
          summary?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      knowledge: {
        Row: {
          created_at: string
          filename: string[] | null
          id: number
          name: string | null
          summarizedrag: string | null
        }
        Insert: {
          created_at?: string
          filename?: string[] | null
          id?: number
          name?: string | null
          summarizedrag?: string | null
        }
        Update: {
          created_at?: string
          filename?: string[] | null
          id?: number
          name?: string | null
          summarizedrag?: string | null
        }
        Relationships: []
      }
      nods_page: {
        Row: {
          checksum: string | null
          id: number
          meta: Json | null
          parent_page_id: number | null
          path: string
          source: string | null
          type: string | null
        }
        Insert: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path: string
          source?: string | null
          type?: string | null
        }
        Update: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      nods_page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz: {
        Row: {
          chapterid: number | null
          created_at: string
          id: number
          level: number | null
          questions: Json | null
        }
        Insert: {
          chapterid?: number | null
          created_at?: string
          id?: number
          level?: number | null
          questions?: Json | null
        }
        Update: {
          chapterid?: number | null
          created_at?: string
          id?: number
          level?: number | null
          questions?: Json | null
        }
        Relationships: []
      }
      reportcards: {
        Row: {
          context: string | null
          created_at: string
          id: number
          quizid: number | null
          studentid: number | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: number
          quizid?: number | null
          studentid?: number | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: number
          quizid?: number | null
          studentid?: number | null
        }
        Relationships: []
      }
      Students: {
        Row: {
          context: string | null
          created_at: string
          discipline: string | null
          id: number
          level: number | null
          name: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          discipline?: string | null
          id?: number
          level?: number | null
          name?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          discipline?: string | null
          id?: number
          level?: number | null
          name?: string | null
        }
        Relationships: []
      }
      studenttopic: {
        Row: {
          chapter_id: number | null
          context: number | null
          created_at: string
          id: number
          student_id: number | null
        }
        Insert: {
          chapter_id?: number | null
          context?: number | null
          created_at?: string
          id?: number
          student_id?: number | null
        }
        Update: {
          chapter_id?: number | null
          context?: number | null
          created_at?: string
          id?: number
          student_id?: number | null
        }
        Relationships: []
      }
      temp: {
        Row: {
          diff: number | null
          GeoHash_GeoQuery: string | null
          GeoHash_Google: string | null
        }
        Insert: {
          diff?: number | null
          GeoHash_GeoQuery?: string | null
          GeoHash_Google?: string | null
        }
        Update: {
          diff?: number | null
          GeoHash_GeoQuery?: string | null
          GeoHash_Google?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      check_edtech_columns: {
        Args: {
          language: string
          knowledge_id: number
        }
        Returns: {
          chapter_id: number
          edtech_id: number
          has_quiz: boolean
          has_notes: boolean
          has_summary: boolean
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_page_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          page_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
