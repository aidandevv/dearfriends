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
      calendar_events: {
        Row: {
          admin_id: string
          calendar_source_id: string | null
          contact_id: string | null
          created_at: string
          event_date: string
          event_type: string
          id: string
          last_reminder_sent_for: string | null
          recurrence: string
          reminder_enabled: boolean
          source: string | null
          source_event_uid: string | null
          title: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>
      }
      calendar_sources: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          last_synced_at: string | null
          name: string
          provider: string
          subscription_url: string
        }
        Insert: Omit<Database['public']['Tables']['calendar_sources']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['calendar_sources']['Insert']>
      }
      contact_groups: {
        Row: {
          contact_id: string
          group_id: string
        }
        Insert: Database['public']['Tables']['contact_groups']['Row']
        Update: Partial<Database['public']['Tables']['contact_groups']['Insert']>
      }
      contacts: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          admin_id: string
          birthday: string | null
          city: string
          country: string | null
          created_at: string
          delivery_method: string
          email: string
          first_name: string
          id: string
          is_international: boolean
          last_name: string
          lat: number | null
          lng: number | null
          note: string | null
          opted_out: boolean
          state: string
          tags: string[]
          updated_at: string
          verification_sent_at: string | null
          verification_token: string | null
          verified_at: string | null
          zip: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at' | 'tags' | 'delivery_method' | 'opted_out' | 'is_international'> & {
          id?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
          delivery_method?: string
          opted_out?: boolean
          is_international?: boolean
        }
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      groups: {
        Row: {
          admin_id: string
          birthday_tracking: boolean
          created_at: string
          id: string
          name: string
          share_slug: string | null
        }
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at' | 'birthday_tracking'> & {
          id?: string
          created_at?: string
          birthday_tracking?: boolean
        }
        Update: Partial<Database['public']['Tables']['groups']['Insert']>
      }
      letter_drafts: {
        Row: {
          admin_id: string
          body: string
          created_at: string
          id: string
          subject: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['letter_drafts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['letter_drafts']['Insert']>
      }
      scheduled_verifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          send_at: string
          sent: boolean
        }
        Insert: Omit<Database['public']['Tables']['scheduled_verifications']['Row'], 'id' | 'created_at' | 'sent'> & {
          id?: string
          created_at?: string
          sent?: boolean
        }
        Update: Partial<Database['public']['Tables']['scheduled_verifications']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Contact = Database['public']['Tables']['contacts']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
