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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievement_types: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      championships: {
        Row: {
          category: string | null
          country_id: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
        }
        Insert: {
          category?: string | null
          country_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
        }
        Update: {
          category?: string | null
          country_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "championships_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_archived: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      estados: {
        Row: {
          bandeira_url: string | null
          created_at: string | null
          id: number
          nome: string
          pais_id: number
          uf: string
        }
        Insert: {
          bandeira_url?: string | null
          created_at?: string | null
          id?: number
          nome: string
          pais_id: number
          uf: string
        }
        Update: {
          bandeira_url?: string | null
          created_at?: string | null
          id?: number
          nome?: string
          pais_id?: number
          uf?: string
        }
        Relationships: [
          {
            foreignKeyName: "estados_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funcaofem: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      funcaomas: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      funcaoperfil: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      highlight_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          highlight_id: string
          id: string
          image_url: string
          media_type: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          highlight_id: string
          id?: string
          image_url: string
          media_type?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          highlight_id?: string
          id?: string
          image_url?: string
          media_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlight_images_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_likes: {
        Row: {
          created_at: string
          highlight_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlight_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlight_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_likes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_replies: {
        Row: {
          content: string
          created_at: string
          highlight_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          highlight_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          highlight_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_replies_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_views: {
        Row: {
          highlight_id: string
          id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          highlight_id: string
          id?: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          highlight_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_views_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delete_after_read: boolean | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_temporary: boolean | null
          media_type: string | null
          media_url: string | null
          read_by: string[] | null
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delete_after_read?: boolean | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_temporary?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read_by?: string[] | null
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delete_after_read?: boolean | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_temporary?: boolean | null
          media_type?: string | null
          media_url?: string | null
          read_by?: string[] | null
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          artist: string
          audio_url: string
          category: string
          cover_url: string | null
          created_at: string | null
          duration_seconds: number
          id: string
          is_active: boolean | null
          play_count: number | null
          title: string
        }
        Insert: {
          artist: string
          audio_url: string
          category: string
          cover_url?: string | null
          created_at?: string | null
          duration_seconds: number
          id?: string
          is_active?: boolean | null
          play_count?: number | null
          title: string
        }
        Update: {
          artist?: string
          audio_url?: string
          category?: string
          cover_url?: string | null
          created_at?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean | null
          play_count?: number | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          content: string | null
          created_at: string | null
          id: string
          post_id: string | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paises: {
        Row: {
          bandeira_url: string | null
          created_at: string | null
          id: number
          nome: string
          sigla: string
        }
        Insert: {
          bandeira_url?: string | null
          created_at?: string | null
          id?: number
          nome: string
          sigla: string
        }
        Update: {
          bandeira_url?: string | null
          created_at?: string | null
          id?: number
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      posicao_feminina: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      posicao_masculina: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          shared_to_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          shared_to_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          shared_to_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          id: string
          photo_index: number
          post_id: string
          user_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_index?: number
          post_id: string
          user_id: string
          x_position: number
          y_position: number
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_index?: number
          post_id?: string
          user_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          likes_count: number | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          media_type: string | null
          media_url: string | null
          music_end_seconds: number | null
          music_start_seconds: number | null
          music_track_id: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media_type?: string | null
          media_url?: string | null
          music_end_seconds?: number | null
          music_start_seconds?: number | null
          music_track_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media_type?: string | null
          media_url?: string | null
          music_end_seconds?: number | null
          music_start_seconds?: number | null
          music_track_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          profile_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string
          visitor_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string
          visitor_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          codigo: string | null
          codigo_expira_em: string | null
          conta_verificada: boolean
          cover_url: string | null
          created_at: string
          estado_id: number | null
          full_name: string | null
          funcao: number | null
          gender: string | null
          height: number | null
          id: string
          is_private: boolean | null
          last_seen_at: string | null
          nationality: number | null
          nickname: string | null
          notify_comments: boolean | null
          notify_follows: boolean | null
          notify_highlight_replies: boolean | null
          notify_likes: boolean | null
          notify_messages: boolean | null
          notify_new_device: boolean | null
          notify_security_events: boolean | null
          notify_story_replies: boolean | null
          onboarding_completed: boolean | null
          password_reset_code: string | null
          password_reset_expires_at: string | null
          posicaofem: number | null
          posicaomas: number | null
          preferred_foot: string | null
          profile_completed: boolean | null
          role: string | null
          scheduled_deletion_at: string | null
          show_activity_status: boolean | null
          show_profile_to: string | null
          team: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          username: string
          verification_attempts: number | null
          verification_locked_until: string | null
          visitors_seen_at: string | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          codigo?: string | null
          codigo_expira_em?: string | null
          conta_verificada?: boolean
          cover_url?: string | null
          created_at?: string
          estado_id?: number | null
          full_name?: string | null
          funcao?: number | null
          gender?: string | null
          height?: number | null
          id: string
          is_private?: boolean | null
          last_seen_at?: string | null
          nationality?: number | null
          nickname?: string | null
          notify_comments?: boolean | null
          notify_follows?: boolean | null
          notify_highlight_replies?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          notify_new_device?: boolean | null
          notify_security_events?: boolean | null
          notify_story_replies?: boolean | null
          onboarding_completed?: boolean | null
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          posicaofem?: number | null
          posicaomas?: number | null
          preferred_foot?: string | null
          profile_completed?: boolean | null
          role?: string | null
          scheduled_deletion_at?: string | null
          show_activity_status?: boolean | null
          show_profile_to?: string | null
          team?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username: string
          verification_attempts?: number | null
          verification_locked_until?: string | null
          visitors_seen_at?: string | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          codigo?: string | null
          codigo_expira_em?: string | null
          conta_verificada?: boolean
          cover_url?: string | null
          created_at?: string
          estado_id?: number | null
          full_name?: string | null
          funcao?: number | null
          gender?: string | null
          height?: number | null
          id?: string
          is_private?: boolean | null
          last_seen_at?: string | null
          nationality?: number | null
          nickname?: string | null
          notify_comments?: boolean | null
          notify_follows?: boolean | null
          notify_highlight_replies?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          notify_new_device?: boolean | null
          notify_security_events?: boolean | null
          notify_story_replies?: boolean | null
          onboarding_completed?: boolean | null
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          posicaofem?: number | null
          posicaomas?: number | null
          preferred_foot?: string | null
          profile_completed?: boolean | null
          role?: string | null
          scheduled_deletion_at?: string | null
          show_activity_status?: boolean | null
          show_profile_to?: string | null
          team?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          username?: string
          verification_attempts?: number | null
          verification_locked_until?: string | null
          visitors_seen_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_funcao_fkey"
            columns: ["funcao"]
            isOneToOne: false
            referencedRelation: "funcaoperfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_nationality_fkey"
            columns: ["nationality"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_posicaofem_fkey"
            columns: ["posicaofem"]
            isOneToOne: false
            referencedRelation: "posicao_feminina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_posicaomas_fkey"
            columns: ["posicaomas"]
            isOneToOne: false
            referencedRelation: "posicao_masculina"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_highlights: {
        Row: {
          created_at: string
          highlight_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlight_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlight_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_highlights_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string
          duration: number | null
          expires_at: string
          id: string
          media_type: string
          media_url: string
          music_end_seconds: number | null
          music_start_seconds: number | null
          music_track_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
          music_end_seconds?: number | null
          music_start_seconds?: number | null
          music_track_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          music_end_seconds?: number | null
          music_start_seconds?: number | null
          music_track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          story_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          story_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      times: {
        Row: {
          created_at: string | null
          escudo_url: string | null
          estado_id: number | null
          id: string
          nome: string
          pais_id: number | null
          selected_by_users: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          escudo_url?: string | null
          estado_id?: number | null
          id?: string
          nome: string
          pais_id?: number | null
          selected_by_users?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          escudo_url?: string | null
          estado_id?: number | null
          id?: string
          nome?: string
          pais_id?: number | null
          selected_by_users?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "times_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "times_pais_id_fkey"
            columns: ["pais_id"]
            isOneToOne: false
            referencedRelation: "paises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_type_id: string | null
          championship_name: string | null
          created_at: string | null
          custom_achievement_name: string | null
          description: string | null
          id: string
          team_name: string | null
          user_id: string
          year: number
        }
        Insert: {
          achievement_type_id?: string | null
          championship_name?: string | null
          created_at?: string | null
          custom_achievement_name?: string | null
          description?: string | null
          id?: string
          team_name?: string | null
          user_id: string
          year: number
        }
        Update: {
          achievement_type_id?: string | null
          championship_name?: string | null
          created_at?: string | null
          custom_achievement_name?: string | null
          description?: string | null
          id?: string
          team_name?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_type_id_fkey"
            columns: ["achievement_type_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_championships: {
        Row: {
          championship_id: string | null
          created_at: string | null
          custom_championship_name: string | null
          games_played: number | null
          goals_scored: number | null
          id: string
          position_achieved: string | null
          team_name: string | null
          user_id: string
          year: number
        }
        Insert: {
          championship_id?: string | null
          created_at?: string | null
          custom_championship_name?: string | null
          games_played?: number | null
          goals_scored?: number | null
          id?: string
          position_achieved?: string | null
          team_name?: string | null
          user_id: string
          year: number
        }
        Update: {
          championship_id?: string | null
          created_at?: string | null
          custom_championship_name?: string | null
          games_played?: number | null
          goals_scored?: number | null
          id?: string
          position_achieved?: string | null
          team_name?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_championships_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_championships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_location: string | null
          last_used_at: string
          os: string | null
          trusted_until: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_location?: string | null
          last_used_at?: string
          os?: string | null
          trusted_until?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_location?: string | null
          last_used_at?: string
          os?: string | null
          trusted_until?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_highlights: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          title: string
          user_id: string
          views_seen_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          title: string
          user_id: string
          views_seen_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          title?: string
          user_id?: string
          views_seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_team_order: {
        Row: {
          created_at: string
          display_order: number
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_to_bookmaker: {
        Args: { bookmaker_id: string; user_id: string }
        Returns: undefined
      }
      add_user_to_team: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
      can_access_conversation: {
        Args: { _conv_id: string; _user_id: string }
        Returns: boolean
      }
      create_conversation_with_user: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_actor_id: string
          p_comment_id?: string
          p_content?: string
          p_post_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      delete_expired_temporary_messages: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { check_user_id: string; conv_id: string }
        Returns: boolean
      }
      is_new_conversation: { Args: { conv_id: string }; Returns: boolean }
      is_participant:
        | {
            Args: { conversation_id_to_check: number; user_id_to_check: string }
            Returns: boolean
          }
        | {
            Args: { conversation_id_to_check: string; user_id_to_check: string }
            Returns: boolean
          }
      make_first_user_admin: { Args: never; Returns: undefined }
      remove_user_from_bookmaker: {
        Args: { bookmaker_id: string; user_id: string }
        Returns: undefined
      }
      remove_user_from_team: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
