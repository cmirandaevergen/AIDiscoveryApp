import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        navigate('/login')
        return
      }

      const role = profile?.role ?? 'consultant'
      navigate(role === 'consultant' ? '/console' : '/session/join', { replace: true })
    }

    handleCallback()
  }, [navigate, profile])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  )
}
