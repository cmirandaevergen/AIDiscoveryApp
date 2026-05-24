import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function ConsoleLayout() {
  const { profile, reset } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">AI Discovery</span>
          <span className="text-white/50 text-sm">Console</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/console"
            end
            className={({ isActive }) =>
              isActive ? 'text-white font-semibold underline underline-offset-4' : 'text-white/80 hover:text-white'
            }
          >
            Engagements
          </NavLink>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/70">{profile?.display_name ?? 'Consultant'}</span>
          <button
            onClick={handleSignOut}
            className="text-white/80 hover:text-white underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
