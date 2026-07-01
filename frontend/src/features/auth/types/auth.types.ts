import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/domain.types'

export type { User, Session, Profile }

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}
