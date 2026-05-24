import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuthListener() {
  const { setUser, setSession, setProfile, setIsLoading, reset } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        reset()
        return
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profile)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setProfile, setIsLoading, reset])
}
