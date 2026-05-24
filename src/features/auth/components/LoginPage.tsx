import { useState } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const emailSchema = z.string().email('Enter a valid email address')

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (supabaseError) {
      setError(supabaseError.message)
    } else {
      setSent(true)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-xl shadow-md p-8 border border-border">
        <div className="mb-8 text-center">
          <div className="inline-block bg-primary rounded-lg px-4 py-2 mb-4">
            <span className="text-white font-bold text-xl tracking-tight">AI Discovery</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a magic link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="bg-secondary/20 border border-secondary/40 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a sign-in link to <span className="font-medium">{email}</span>
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full bg-primary text-white rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
