import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { IProfile } from '@/features/auth/types'

interface IAuthState {
  user: User | null
  session: Session | null
  profile: IProfile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: IProfile | null) => void
  setIsLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<IAuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, session: null, profile: null, isLoading: false }),
}))
