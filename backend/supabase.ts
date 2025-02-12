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
  market: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Agents: {
        Row: {
          author: string | null
          categories: string[] | null
          createdAt: string
          description: string | null
          graph: Json
          id: string
          keywords: string[] | null
          name: string | null
          search: unknown | null
          submissionDate: string
          submissionReviewComments: string | null
          submissionReviewDate: string | null
          submissionStatus: Database["market"]["Enums"]["SubmissionStatus"]
          updatedAt: string
          version: number
        }
        Insert: {
          author?: string | null
          categories?: string[] | null
          createdAt?: string
          description?: string | null
          graph: Json
          id?: string
          keywords?: string[] | null
          name?: string | null
          search?: unknown | null
          submissionDate?: string
          submissionReviewComments?: string | null
          submissionReviewDate?: string | null
          submissionStatus?: Database["market"]["Enums"]["SubmissionStatus"]
          updatedAt: string
          version?: number
        }
        Update: {
          author?: string | null
          categories?: string[] | null
          createdAt?: string
          description?: string | null
          graph?: Json
          id?: string
          keywords?: string[] | null
          name?: string | null
          search?: unknown | null
          submissionDate?: string
          submissionReviewComments?: string | null
          submissionReviewDate?: string | null
          submissionStatus?: Database["market"]["Enums"]["SubmissionStatus"]
          updatedAt?: string
          version?: number
        }
        Relationships: []
      }
      AnalyticsTracker: {
        Row: {
          agentId: string
          downloads: number
          id: string
          views: number
        }
        Insert: {
          agentId: string
          downloads: number
          id?: string
          views: number
        }
        Update: {
          agentId?: string
          downloads?: number
          id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "AnalyticsTracker_agentId_fkey"
            columns: ["agentId"]
            referencedRelation: "Agents"
            referencedColumns: ["id"]
          },
        ]
      }
      FeaturedAgent: {
        Row: {
          agentId: string
          createdAt: string
          featuredCategories: string[] | null
          id: string
          isActive: boolean
          updatedAt: string
        }
        Insert: {
          agentId: string
          createdAt?: string
          featuredCategories?: string[] | null
          id?: string
          isActive?: boolean
          updatedAt: string
        }
        Update: {
          agentId?: string
          createdAt?: string
          featuredCategories?: string[] | null
          id?: string
          isActive?: boolean
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FeaturedAgent_agentId_fkey"
            columns: ["agentId"]
            referencedRelation: "Agents"
            referencedColumns: ["id"]
          },
        ]
      }
      InstallTracker: {
        Row: {
          createdAt: string
          id: string
          installationLocation: Database["market"]["Enums"]["InstallationLocation"]
          installedAgentId: string
          marketplaceAgentId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          installationLocation: Database["market"]["Enums"]["InstallationLocation"]
          installedAgentId: string
          marketplaceAgentId: string
        }
        Update: {
          createdAt?: string
          id?: string
          installationLocation?: Database["market"]["Enums"]["InstallationLocation"]
          installedAgentId?: string
          marketplaceAgentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "InstallTracker_marketplaceAgentId_fkey"
            columns: ["marketplaceAgentId"]
            referencedRelation: "Agents"
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
      InstallationLocation: "LOCAL" | "CLOUD"
      SubmissionStatus: "PENDING" | "APPROVED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: {
          p_usename: string
        }
        Returns: {
          username: string
          password: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  platform: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AgentBlock: {
        Row: {
          id: string
          inputSchema: string
          name: string
          outputSchema: string
        }
        Insert: {
          id: string
          inputSchema: string
          name: string
          outputSchema: string
        }
        Update: {
          id?: string
          inputSchema?: string
          name?: string
          outputSchema?: string
        }
        Relationships: []
      }
      AgentGraph: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          isTemplate: boolean
          name: string | null
          updatedAt: string | null
          userId: string
          version: number
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id: string
          isActive?: boolean
          isTemplate?: boolean
          name?: string | null
          updatedAt?: string | null
          userId: string
          version?: number
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          isTemplate?: boolean
          name?: string | null
          updatedAt?: string | null
          userId?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "AgentGraph_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AgentGraphExecution: {
        Row: {
          agentGraphId: string
          agentGraphVersion: number
          createdAt: string
          executionStatus: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id: string
          startedAt: string | null
          stats: string | null
          updatedAt: string | null
          userId: string
        }
        Insert: {
          agentGraphId: string
          agentGraphVersion?: number
          createdAt?: string
          executionStatus?: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id: string
          startedAt?: string | null
          stats?: string | null
          updatedAt?: string | null
          userId: string
        }
        Update: {
          agentGraphId?: string
          agentGraphVersion?: number
          createdAt?: string
          executionStatus?: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id?: string
          startedAt?: string | null
          stats?: string | null
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentGraphExecution_agentGraphId_agentGraphVersion_fkey"
            columns: ["agentGraphId", "agentGraphVersion"]
            referencedRelation: "AgentGraph"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "AgentGraphExecution_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AgentGraphExecutionSchedule: {
        Row: {
          agentGraphId: string
          agentGraphVersion: number
          createdAt: string
          id: string
          inputData: string
          isEnabled: boolean
          lastUpdated: string
          schedule: string
          updatedAt: string | null
          userId: string
        }
        Insert: {
          agentGraphId: string
          agentGraphVersion?: number
          createdAt?: string
          id: string
          inputData: string
          isEnabled?: boolean
          lastUpdated: string
          schedule: string
          updatedAt?: string | null
          userId: string
        }
        Update: {
          agentGraphId?: string
          agentGraphVersion?: number
          createdAt?: string
          id?: string
          inputData?: string
          isEnabled?: boolean
          lastUpdated?: string
          schedule?: string
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentGraphExecutionSchedule_agentGraphId_agentGraphVersion_fkey"
            columns: ["agentGraphId", "agentGraphVersion"]
            referencedRelation: "AgentGraph"
            referencedColumns: ["id", "version"]
          },
          {
            foreignKeyName: "AgentGraphExecutionSchedule_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AgentNode: {
        Row: {
          agentBlockId: string
          agentGraphId: string
          agentGraphVersion: number
          constantInput: string
          id: string
          metadata: string
        }
        Insert: {
          agentBlockId: string
          agentGraphId: string
          agentGraphVersion?: number
          constantInput?: string
          id: string
          metadata?: string
        }
        Update: {
          agentBlockId?: string
          agentGraphId?: string
          agentGraphVersion?: number
          constantInput?: string
          id?: string
          metadata?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentNode_agentBlockId_fkey"
            columns: ["agentBlockId"]
            referencedRelation: "AgentBlock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AgentNode_agentGraphId_agentGraphVersion_fkey"
            columns: ["agentGraphId", "agentGraphVersion"]
            referencedRelation: "AgentGraph"
            referencedColumns: ["id", "version"]
          },
        ]
      }
      AgentNodeExecution: {
        Row: {
          addedTime: string
          agentGraphExecutionId: string
          agentNodeId: string
          endedTime: string | null
          executionData: string | null
          executionStatus: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id: string
          queuedTime: string | null
          startedTime: string | null
          stats: string | null
        }
        Insert: {
          addedTime?: string
          agentGraphExecutionId: string
          agentNodeId: string
          endedTime?: string | null
          executionData?: string | null
          executionStatus?: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id: string
          queuedTime?: string | null
          startedTime?: string | null
          stats?: string | null
        }
        Update: {
          addedTime?: string
          agentGraphExecutionId?: string
          agentNodeId?: string
          endedTime?: string | null
          executionData?: string | null
          executionStatus?: Database["platform"]["Enums"]["AgentExecutionStatus"]
          id?: string
          queuedTime?: string | null
          startedTime?: string | null
          stats?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AgentNodeExecution_agentGraphExecutionId_fkey"
            columns: ["agentGraphExecutionId"]
            referencedRelation: "AgentGraphExecution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AgentNodeExecution_agentNodeId_fkey"
            columns: ["agentNodeId"]
            referencedRelation: "AgentNode"
            referencedColumns: ["id"]
          },
        ]
      }
      AgentNodeExecutionInputOutput: {
        Row: {
          data: string
          id: string
          name: string
          referencedByInputExecId: string | null
          referencedByOutputExecId: string | null
          time: string
        }
        Insert: {
          data: string
          id: string
          name: string
          referencedByInputExecId?: string | null
          referencedByOutputExecId?: string | null
          time?: string
        }
        Update: {
          data?: string
          id?: string
          name?: string
          referencedByInputExecId?: string | null
          referencedByOutputExecId?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentNodeExecutionInputOutput_referencedByInputExecId_fkey"
            columns: ["referencedByInputExecId"]
            referencedRelation: "AgentNodeExecution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AgentNodeExecutionInputOutput_referencedByOutputExecId_fkey"
            columns: ["referencedByOutputExecId"]
            referencedRelation: "AgentNodeExecution"
            referencedColumns: ["id"]
          },
        ]
      }
      AgentNodeLink: {
        Row: {
          agentNodeSinkId: string
          agentNodeSourceId: string
          id: string
          isStatic: boolean
          sinkName: string
          sourceName: string
        }
        Insert: {
          agentNodeSinkId: string
          agentNodeSourceId: string
          id: string
          isStatic?: boolean
          sinkName: string
          sourceName: string
        }
        Update: {
          agentNodeSinkId?: string
          agentNodeSourceId?: string
          id?: string
          isStatic?: boolean
          sinkName?: string
          sourceName?: string
        }
        Relationships: [
          {
            foreignKeyName: "AgentNodeLink_agentNodeSinkId_fkey"
            columns: ["agentNodeSinkId"]
            referencedRelation: "AgentNode"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AgentNodeLink_agentNodeSourceId_fkey"
            columns: ["agentNodeSourceId"]
            referencedRelation: "AgentNode"
            referencedColumns: ["id"]
          },
        ]
      }
      AnalyticsDetails: {
        Row: {
          createdAt: string
          data: Json | null
          dataIndex: string | null
          id: string
          type: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          data?: Json | null
          dataIndex?: string | null
          id?: string
          type: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          data?: Json | null
          dataIndex?: string | null
          id?: string
          type?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AnalyticsDetails_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      AnalyticsMetrics: {
        Row: {
          analyticMetric: string
          createdAt: string
          dataString: string | null
          id: string
          updatedAt: string
          userId: string
          value: number
        }
        Insert: {
          analyticMetric: string
          createdAt?: string
          dataString?: string | null
          id?: string
          updatedAt: string
          userId: string
          value: number
        }
        Update: {
          analyticMetric?: string
          createdAt?: string
          dataString?: string | null
          id?: string
          updatedAt?: string
          userId?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "AnalyticsMetrics_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          id: string
          integrations: string
          metadata: Json
          name: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id: string
          integrations?: string
          metadata?: Json
          name?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          integrations?: string
          metadata?: Json
          name?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      UserBlockCredit: {
        Row: {
          amount: number
          blockId: string | null
          createdAt: string
          isActive: boolean
          metadata: Json | null
          transactionKey: string
          type: Database["platform"]["Enums"]["UserBlockCreditType"]
          userId: string
        }
        Insert: {
          amount: number
          blockId?: string | null
          createdAt?: string
          isActive?: boolean
          metadata?: Json | null
          transactionKey: string
          type: Database["platform"]["Enums"]["UserBlockCreditType"]
          userId: string
        }
        Update: {
          amount?: number
          blockId?: string | null
          createdAt?: string
          isActive?: boolean
          metadata?: Json | null
          transactionKey?: string
          type?: Database["platform"]["Enums"]["UserBlockCreditType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserBlockCredit_blockId_fkey"
            columns: ["blockId"]
            referencedRelation: "AgentBlock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserBlockCredit_userId_fkey"
            columns: ["userId"]
            referencedRelation: "User"
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
      AgentExecutionStatus:
        | "INCOMPLETE"
        | "QUEUED"
        | "RUNNING"
        | "COMPLETED"
        | "FAILED"
      UserBlockCreditType: "TOP_UP" | "USAGE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          chapter: string | null
          created_at: string
          id: number
          seeded: boolean | null
          subtopic: string | null
          topic: string | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          id?: number
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Update: {
          chapter?: string | null
          created_at?: string
          id?: number
          seeded?: boolean | null
          subtopic?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      EdTechContent: {
        Row: {
          chapter: string
          created_at: string | null
          id: number
          image_url: string | null
          latex_code: string | null
          notes: string | null
          subtopic: string
          summary: string | null
          topic: string
        }
        Insert: {
          chapter: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          latex_code?: string | null
          notes?: string | null
          subtopic: string
          summary?: string | null
          topic: string
        }
        Update: {
          chapter?: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          latex_code?: string | null
          notes?: string | null
          subtopic?: string
          summary?: string | null
          topic?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      updatechapters: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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
