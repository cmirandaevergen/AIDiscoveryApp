import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/features/auth/types'

interface IProtectedRouteProps {
  requiredRole?: UserRole
}

export function ProtectedRoute({ requiredRole }: IProtectedRouteProps) {
  const { user, profile } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
