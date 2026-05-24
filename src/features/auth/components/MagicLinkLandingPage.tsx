import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function MagicLinkLandingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type') as 'magiclink' | 'recovery' | null

    if (!token || !type) {
      navigate('/login')
      return
    }

    const email = new URLSearchParams(window.location.search).get('email') ?? ''
    supabase.auth.verifyOtp({ email, token, type }).then(({ error: otpError }) => {
      if (otpError) {
        setError(otpError.message)
      } else {
        navigate('/auth/callback', { replace: true })
      }
    })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-destructive font-medium mb-2">Sign-in link expired or invalid</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Verifying link…</p>
      </div>
    </div>
  )
}
