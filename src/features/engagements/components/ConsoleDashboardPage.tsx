import { Link } from 'react-router-dom'
import { useEngagements } from '@/features/engagements/hooks/useEngagements'
import { cn } from '@/lib/utils'
import type { EngagementStatus } from '@/features/engagements/types'

const statusLabel: Record<EngagementStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

const statusColor: Record<EngagementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-secondary/20 text-secondary-foreground border border-secondary/40',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground opacity-60',
}

export default function ConsoleDashboardPage() {
  const { data: engagements, isLoading, error } = useEngagements()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Engagements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All your AI discovery engagements</p>
        </div>
        <Link
          to="/console/engagements/new"
          className="bg-primary text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New engagement
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          Failed to load engagements: {error.message}
        </div>
      )}

      {engagements && engagements.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No engagements yet</p>
          <p className="text-sm mb-4">Create your first engagement to get started.</p>
          <Link
            to="/console/engagements/new"
            className="bg-primary text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Create engagement
          </Link>
        </div>
      )}

      {engagements && engagements.length > 0 && (
        <div className="grid gap-3">
          {engagements.map((eng) => (
            <Link
              key={eng.id}
              to={`/console/${eng.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{eng.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{eng.companies.name}</p>
                  {eng.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{eng.description}</p>
                  )}
                </div>
                <span className={cn('shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', statusColor[eng.status])}>
                  {statusLabel[eng.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Join code: <span className="font-mono font-medium">{eng.join_code}</span>
                {' · '}
                Created {new Date(eng.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
