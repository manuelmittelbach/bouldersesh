/**
 * Generated Supabase types.
 *
 * After running the migrations against your linked Supabase project, regenerate this file with:
 *
 *   pnpm supabase:types
 *
 * (Requires `supabase login` and `supabase link --project-ref <ref>` once.)
 *
 * Until then, this file holds a hand-written `Database` shape that mirrors
 * the SQL in `supabase/migrations/`. The two should drift toward parity, not apart.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "pro";
export type SessionVisibility = "public" | "friends";
export type SessionStatus = "open" | "matched" | "done" | "cancelled";
export type MatchStatus = "pending" | "accepted" | "declined" | "cancelled";
/** Zugangsbeschränkung einer Halle; `null` heißt offen für alle. */
export type GymAccess = "members_only" | "students_only";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          skill_level: SkillLevel | null;
          preferred_styles: string[] | null;
          home_gym_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skill_level?: SkillLevel | null;
          preferred_styles?: string[] | null;
          home_gym_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cities"]["Insert"]>;
        Relationships: [];
      };
      gyms: {
        Row: {
          id: string;
          name: string;
          city_id: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          active: boolean;
          access: GymAccess | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city_id: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          active?: boolean;
          access?: GymAccess | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gyms"]["Insert"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          creator_id: string;
          gym_id: string;
          starts_at: string;
          ends_at: string | null;
          level: string;
          note: string | null;
          max_buddies: number;
          visibility: SessionVisibility;
          status: SessionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          gym_id: string;
          starts_at: string;
          ends_at?: string | null;
          level: string;
          note?: string | null;
          max_buddies?: number;
          visibility?: SessionVisibility;
          status?: SessionStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: [];
      };
      match_requests: {
        Row: {
          id: string;
          session_id: string;
          requester_id: string;
          status: MatchStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          requester_id: string;
          status?: MatchStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["match_requests"]["Insert"]>;
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chats"]["Insert"]>;
        Relationships: [];
      };
      chat_members: {
        Row: {
          chat_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string | null;
        };
        Insert: {
          chat_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["chat_members"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          body: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          body: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      skill_level: SkillLevel;
      session_visibility: SessionVisibility;
      session_status: SessionStatus;
      match_status: MatchStatus;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type City = Database["public"]["Tables"]["cities"]["Row"];
export type Gym = Database["public"]["Tables"]["gyms"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type MatchRequest = Database["public"]["Tables"]["match_requests"]["Row"];
export type Chat = Database["public"]["Tables"]["chats"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
