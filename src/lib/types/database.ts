export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
          role: "admin" | "client";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "client";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "client";
          created_at?: string;
        };
        Relationships: [];
      };
      content_plans: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          month: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          month?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          month?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_plans_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_plans_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_pieces: {
        Row: {
          id: string;
          plan_id: string;
          title: string;
          platform: string;
          content_type: string | null;
          status: "to_film" | "filming" | "in_review" | "published";
          due_date: string | null;
          duration: string | null;
          hook: string;
          script: string | null;
          reference_url: string | null;
          drive_folder_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          title: string;
          platform: string;
          content_type?: string | null;
          status?: "to_film" | "filming" | "in_review" | "published";
          due_date?: string | null;
          duration?: string | null;
          hook: string;
          script?: string | null;
          reference_url?: string | null;
          drive_folder_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          title?: string;
          platform?: string;
          content_type?: string | null;
          status?: "to_film" | "filming" | "in_review" | "published";
          due_date?: string | null;
          duration?: string | null;
          hook?: string;
          script?: string | null;
          reference_url?: string | null;
          drive_folder_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_pieces_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "content_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      shot_list_items: {
        Row: {
          id: string;
          piece_id: string;
          shot_number: number;
          shot_desc: string;
          framing: string | null;
          notes: string | null;
          is_completed: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          piece_id: string;
          shot_number: number;
          shot_desc: string;
          framing?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          piece_id?: string;
          shot_number?: number;
          shot_desc?: string;
          framing?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "shot_list_items_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "content_pieces";
            referencedColumns: ["id"];
          },
        ];
      };
      pro_tips: {
        Row: {
          id: string;
          piece_id: string;
          tip_text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          piece_id: string;
          tip_text: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          piece_id?: string;
          tip_text?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pro_tips_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "content_pieces";
            referencedColumns: ["id"];
          },
        ];
      };
      uploads: {
        Row: {
          id: string;
          piece_id: string;
          uploaded_by: string;
          file_url: string;
          file_name: string | null;
          file_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          piece_id: string;
          uploaded_by: string;
          file_url: string;
          file_name?: string | null;
          file_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          piece_id?: string;
          uploaded_by?: string;
          file_url?: string;
          file_name?: string | null;
          file_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "uploads_piece_id_fkey";
            columns: ["piece_id"];
            isOneToOne: false;
            referencedRelation: "content_pieces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uploads_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ContentPlan = Database["public"]["Tables"]["content_plans"]["Row"];
export type ContentPiece = Database["public"]["Tables"]["content_pieces"]["Row"];
export type ShotListItem = Database["public"]["Tables"]["shot_list_items"]["Row"];
export type ProTip = Database["public"]["Tables"]["pro_tips"]["Row"];
export type Upload = Database["public"]["Tables"]["uploads"]["Row"];
