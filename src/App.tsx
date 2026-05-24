import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthListener } from '@/features/auth/hooks/useAuthListener'
import { useAuthStore } from '@/store/authStore'
import { ConsoleLayout } from '@/features/layout/components/ConsoleLayout'
import { SessionLayout } from '@/features/layout/components/SessionLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

import LoginPage from '@/features/auth/components/LoginPage'
import AuthCallbackPage from '@/features/auth/components/AuthCallbackPage'
import MagicLinkLandingPage from '@/features/auth/components/MagicLinkLandingPage'

import ConsoleDashboardPage from '@/features/engagements/components/ConsoleDashboardPage'
import EngagementCreatePage from '@/features/engagements/components/EngagementCreatePage'
import EngagementDetailPage from '@/features/engagements/components/EngagementDetailPage'

export default function App() {
  useAuthListener()
  const { isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/magic" element={<MagicLinkLandingPage />} />

      {/* Console routes — consultant only */}
      <Route element={<ProtectedRoute requiredRole="consultant" />}>
        <Route element={<ConsoleLayout />}>
          <Route path="/console" element={<ConsoleDashboardPage />} />
          <Route path="/console/engagements/new" element={<EngagementCreatePage />} />
          <Route path="/console/:engagementId" element={<EngagementDetailPage />} />
        </Route>
      </Route>

      {/* Session routes — participant / client lead */}
      <Route element={<SessionLayout />}>
        <Route path="/session/join" element={<div>Join Session</div>} />
        <Route path="/session/:code" element={<div>Session Landing</div>} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/console" replace />} />
      <Route path="*" element={<Navigate to="/console" replace />} />
    </Routes>
  )
}
