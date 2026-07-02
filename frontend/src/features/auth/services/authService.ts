import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/types/domain.types'

export const authService = {
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/matches`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    if (error) throw error
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: { display_name?: string; avatar_url?: string }): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const { error } = await supabase.storage
      .from('avatars')
      .upload(userId, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })
    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(userId)
    // Bust cache by appending a timestamp so the browser re-fetches the new image
    return `${data.publicUrl}?t=${Date.now()}`
  },
}
