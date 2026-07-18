export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  sydef: {
    Tables: {
      admin_capability_grants: {
        Row: {
          id: string;
          user_id: string;
          capability:
            | "content"
            | "analytics"
            | "financial"
            | "bookings"
            | "corporate"
            | "settings"
            | "scheduling"
            | "plans"
            | "security";
          granted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          capability:
            | "content"
            | "analytics"
            | "financial"
            | "bookings"
            | "corporate"
            | "settings"
            | "scheduling"
            | "plans"
            | "security";
          granted_by: string;
        };
        Update: Partial<Database["sydef"]["Tables"]["admin_capability_grants"]["Insert"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          event_name: string;
          event_category: string;
          page_path: string | null;
          properties: Json;
          performance_ms: number | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_name: string;
          event_category?: string;
          page_path?: string | null;
          properties?: Json;
          performance_ms?: number | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["sydef"]["Tables"]["analytics_events"]["Insert"]>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          author_id: string | null;
          status: "draft" | "published" | "archived";
          tags: string[];
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body: string;
          author_id?: string | null;
          status?: "draft" | "published" | "archived";
          tags?: string[];
          published_at?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["articles"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          session_id: string | null;
          payment_id: string | null;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          corporate_invite_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          session_id?: string | null;
          payment_id?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          corporate_invite_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          enrollment_id: string;
          user_id: string;
          class_id: string;
          certificate_number: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          user_id: string;
          class_id: string;
          certificate_number: string;
          issued_at?: string;
        };
        Update: Partial<Database["sydef"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [];
      };
      class_modules: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          description: string | null;
          sort_order: number;
          video_storage_path: string | null;
          duration_seconds: number | null;
          is_preview: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          title: string;
          description?: string | null;
          sort_order?: number;
          video_storage_path?: string | null;
          duration_seconds?: number | null;
          is_preview?: boolean;
        };
        Update: Partial<Database["sydef"]["Tables"]["class_modules"]["Insert"]>;
        Relationships: [];
      };
      class_sessions: {
        Row: {
          id: string;
          class_id: string;
          starts_at: string;
          ends_at: string | null;
          capacity: number;
          seats_booked: number;
          location_id: string | null;
          is_cancelled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          starts_at: string;
          ends_at?: string | null;
          capacity?: number;
          seats_booked?: number;
          location_id?: string | null;
          is_cancelled?: boolean;
        };
        Update: Partial<Database["sydef"]["Tables"]["class_sessions"]["Insert"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          type: "in_person" | "online" | "hybrid" | "corporate";
          price_ngn: number;
          objectives: string[];
          instructor_id: string | null;
          location_id: string | null;
          session_count: number;
          duration_minutes: number | null;
          is_published: boolean;
          is_corporate_only: boolean;
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          type: "in_person" | "online" | "hybrid" | "corporate";
          price_ngn: number;
          objectives?: string[];
          instructor_id?: string | null;
          location_id?: string | null;
          session_count?: number;
          duration_minutes?: number | null;
          is_published?: boolean;
          is_corporate_only?: boolean;
          thumbnail_url?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["classes"]["Insert"]>;
        Relationships: [];
      };
      corporate_orders: {
        Row: {
          id: string;
          buyer_id: string;
          package_id: string;
          payment_id: string | null;
          company_name: string | null;
          status: "pending" | "paid" | "fulfilled" | "cancelled";
          staff_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          package_id: string;
          payment_id?: string | null;
          company_name?: string | null;
          status?: "pending" | "paid" | "fulfilled" | "cancelled";
          staff_count: number;
        };
        Update: Partial<Database["sydef"]["Tables"]["corporate_orders"]["Insert"]>;
        Relationships: [];
      };
      corporate_packages: {
        Row: {
          id: string;
          name: string;
          slug: string;
          staff_count: number;
          price_ngn: number;
          description: string | null;
          features: string[];
          class_ids: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          staff_count: number;
          price_ngn: number;
          description?: string | null;
          features?: string[];
          class_ids?: string[];
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["sydef"]["Tables"]["corporate_packages"]["Insert"]>;
        Relationships: [];
      };
      corporate_staff_invites: {
        Row: {
          id: string;
          corporate_order_id: string;
          full_name: string;
          phone: string;
          token: string;
          status: "pending" | "sent" | "verified" | "redeemed" | "expired";
          verified_at: string | null;
          redeemed_at: string | null;
          user_id: string | null;
          whatsapp_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          corporate_order_id: string;
          full_name: string;
          phone: string;
          token?: string;
          status?: "pending" | "sent" | "verified" | "redeemed" | "expired";
          verified_at?: string | null;
          redeemed_at?: string | null;
          user_id?: string | null;
          whatsapp_sent_at?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["corporate_staff_invites"]["Insert"]>;
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          to_email: string;
          subject: string;
          body: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          to_email: string;
          subject: string;
          body: string;
          status?: string;
        };
        Update: Partial<Database["sydef"]["Tables"]["email_logs"]["Insert"]>;
        Relationships: [];
      };
      email_verification_codes: {
        Row: {
          id: string;
          email: string;
          code: string;
          purpose: "superadmin_login" | "password_change" | "superadmin_transfer";
          expires_at: string;
          used_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          purpose: "superadmin_login" | "password_change" | "superadmin_transfer";
          expires_at: string;
          used_at?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["sydef"]["Tables"]["email_verification_codes"]["Insert"]>;
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          booking_id: string | null;
          progress_percent: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          booking_id?: string | null;
          progress_percent?: number;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["enrollments"]["Insert"]>;
        Relationships: [];
      };
      health_checks: {
        Row: {
          id: string;
          service: string;
          status: string;
          latency_ms: number | null;
          details: Json;
          checked_at: string;
        };
        Insert: {
          id?: string;
          service: string;
          status: string;
          latency_ms?: number | null;
          details?: Json;
          checked_at?: string;
        };
        Update: Partial<Database["sydef"]["Tables"]["health_checks"]["Insert"]>;
        Relationships: [];
      };
      instructors: {
        Row: {
          id: string;
          full_name: string;
          bio: string | null;
          photo_url: string | null;
          credentials: string[] | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          bio?: string | null;
          photo_url?: string | null;
          credentials?: string[] | null;
          is_active?: boolean;
        };
        Update: Partial<Database["sydef"]["Tables"]["instructors"]["Insert"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          state: string;
          city: string;
          is_active: boolean;
          venue_name: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          landmark: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          state: string;
          city: string;
          is_active?: boolean;
          venue_name?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          landmark?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["locations"]["Insert"]>;
        Relationships: [];
      };
      module_progress: {
        Row: {
          id: string;
          enrollment_id: string;
          module_id: string;
          watched_seconds: number;
          is_completed: boolean;
          last_position_seconds: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          module_id: string;
          watched_seconds?: number;
          is_completed?: boolean;
          last_position_seconds?: number;
        };
        Update: Partial<Database["sydef"]["Tables"]["module_progress"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          channel: "in_app" | "whatsapp" | "both";
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          channel?: "in_app" | "whatsapp" | "both";
          is_read?: boolean;
          metadata?: Json;
        };
        Update: Partial<Database["sydef"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string | null;
          amount_ngn: number;
          currency: string;
          status: "pending" | "succeeded" | "failed" | "refunded";
          provider: "paystack" | "flutterwave" | "stripe" | "mock";
          provider_ref: string | null;
          paystack_reference: string | null;
          paystack_access_code: string | null;
          flutterwave_tx_ref: string | null;
          flutterwave_transaction_id: string | null;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          amount_ngn: number;
          currency?: string;
          status?: "pending" | "succeeded" | "failed" | "refunded";
          provider: "paystack" | "flutterwave" | "stripe" | "mock";
          provider_ref?: string | null;
          paystack_reference?: string | null;
          paystack_access_code?: string | null;
          flutterwave_tx_ref?: string | null;
          flutterwave_transaction_id?: string | null;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["sydef"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: string;
          mode: "mock" | "live";
          site_name: string;
          site_tagline: string;
          stripe_configured: boolean;
          paystack_configured: boolean;
          flutterwave_configured: boolean;
          whatsapp_configured: boolean;
          primary_payment_provider: string;
          secondary_payment_provider: string;
          tertiary_payment_provider: string;
          super_admin_email: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          mode?: "mock" | "live";
          site_name?: string;
          site_tagline?: string;
          stripe_configured?: boolean;
          paystack_configured?: boolean;
          flutterwave_configured?: boolean;
          whatsapp_configured?: boolean;
          primary_payment_provider?: string;
          secondary_payment_provider?: string;
          tertiary_payment_provider?: string;
          super_admin_email?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["platform_settings"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string | null;
          role: "member" | "admin" | "corporate_admin" | "super_admin";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name?: string | null;
          role?: "member" | "admin" | "corporate_admin" | "super_admin";
          avatar_url?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      session_reminders: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          booking_id: string | null;
          remind_at: string;
          channel: "in_app" | "whatsapp" | "both";
          include_directions_map: boolean;
          status: "scheduled" | "sent" | "cancelled" | "failed";
          sent_at: string | null;
          directions_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          booking_id?: string | null;
          remind_at: string;
          channel?: "in_app" | "whatsapp" | "both";
          include_directions_map?: boolean;
          status?: "scheduled" | "sent" | "cancelled" | "failed";
          sent_at?: string | null;
          directions_snapshot?: Json;
        };
        Update: Partial<Database["sydef"]["Tables"]["session_reminders"]["Insert"]>;
        Relationships: [];
      };
      user_submissions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          status: "pending" | "approved" | "rejected";
          reviewer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          status?: "pending" | "approved" | "rejected";
          reviewer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["sydef"]["Tables"]["user_submissions"]["Insert"]>;
        Relationships: [];
      };
      whatsapp_logs: {
        Row: {
          id: string;
          phone: string;
          template_name: string | null;
          message_body: string;
          status: string;
          provider_ref: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          template_name?: string | null;
          message_body: string;
          status?: string;
          provider_ref?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["sydef"]["Tables"]["whatsapp_logs"]["Insert"]>;
        Relationships: [];
      };
      scheduling_preferences: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      demand_clusters: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      cluster_members: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      pricing_plans: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      plan_entitlements: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      member_subscriptions: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_places: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      security_alert_drafts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      gym_partners: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    Functions: {
      book_session_seat: {
        Args: {
          p_session_id: string;
          p_user_id: string;
          p_class_id: string;
          p_payment_id?: string;
        };
        Returns: string;
      };
      upsert_scheduling_preference: {
        Args: Record<string, unknown>;
        Returns: string;
      };
      refresh_demand_clusters: {
        Args: Record<string, never>;
        Returns: { clusters_ready: number; notifications_queued: number }[];
      };
      confirm_demand_cluster: {
        Args: Record<string, unknown>;
        Returns: string;
      };
      approve_security_alert: {
        Args: Record<string, unknown>;
        Returns: number;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_corporate_admin: { Args: Record<string, never>; Returns: boolean };
    };
  };
};

export type Tables<T extends keyof Database["sydef"]["Tables"]> =
  Database["sydef"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["sydef"]["Tables"]> =
  Database["sydef"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["sydef"]["Tables"]> =
  Database["sydef"]["Tables"][T]["Update"];

export type Class = Tables<"classes">;
export type ClassWithInstructor = Class & {
  instructors: Tables<"instructors"> | null;
  locations: Tables<"locations"> | null;
};
export type Profile = Tables<"profiles">;
export type PlatformSettings = Tables<"platform_settings">;
export type CorporatePackage = Tables<"corporate_packages">;
export type Enrollment = Tables<"enrollments">;
