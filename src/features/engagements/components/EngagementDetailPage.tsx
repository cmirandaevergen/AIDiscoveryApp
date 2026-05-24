import { Link, useParams } from 'react-router-dom'
import { useEngagement } from '@/features/engagements/hooks/useEngagements'
import { cn } from '@/lib/utils'
import type { EngagementStatus } from '@/features/engagements/types'

const statusColor: Record<EngagementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-secondary/20 text-secondary-foreground border border-secondary/40',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground opacity-60',
}

interface INavCardProps {
  to: string
  label: string
  description: string
  available: boolean
}

function NavCard({ to, label, description, available }: INavCardProps) {
  if (!available) {
    return (
      <div className="block bg-muted/50 border border-border rounded-lg p-4 opacity-50 cursor-not-allowed">
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">Coming in a future sprint</p>
      </div>
    )
  }
  return (
    <Link
      to={to}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <p className="font-medium text-sm text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </Link>
  )
}

export default function EngagementDetailPage() {
  const { engagementId } = useParams<{ engagementId: string }>()
  const { data: engagement, isLoading, error } = useEngagement(engagementId ?? '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !engagement) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
        {error?.message ?? 'Engagement not found'}
      </div>
    )
  }

  const navItems = [
    { label: 'Participants', description: 'Manage who is in this engagement', to: `/console/${engagementId}/participants`, available: false },
    { label: 'Survey Builder', description: 'Build the pre-workshop survey', to: `/console/${engagementId}/survey`, available: false },
    { label: 'Survey Responses', description: 'Review participant responses', to: `/console/${engagementId}/survey/responses`, available: false },
    { label: 'Facilitator Brief', description: 'AI-generated workshop brief', to: `/console/${engagementId}/brief`, available: false },
    { label: 'Live Canvas', description: 'Facilitate the live workshop', to: `/console/${engagementId}/canvas`, available: false },
    { label: 'Use Case Registry', description: 'Review all submitted use cases', to: `/console/${engagementId}/use-cases`, available: false },
    { label: 'Scoring Matrix', description: 'Score use cases on value and feasibility', to: `/console/${engagementId}/scoring`, available: false },
    { label: 'ROI Calculator', description: 'Build the business case financials', to: `/console/${engagementId}/roi`, available: false },
    { label: 'Business Case', description: 'AI-generated business case', to: `/console/${engagementId}/business-case`, available: false },
    { label: 'Roadmap', description: 'Prioritise and sequence use cases', to: `/console/${engagementId}/roadmap`, available: false },
    { label: 'Exports', description: 'Download PowerPoint, Word, Excel', to: `/console/${engagementId}/exports`, available: false },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link to="/console" className="text-sm text-muted-foreground hover:text-foreground">
          ← Engagements
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-foreground">{engagement.name}</h1>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColor[engagement.status])}>
            {engagement.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{engagement.companies.name}</p>
        {engagement.description && (
          <p className="text-sm text-muted-foreground mt-2">{engagement.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Join code: <span className="font-mono font-semibold text-foreground">{engagement.join_code}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {navItems.map((item) => (
          <NavCard key={item.to} {...item} />
        ))}
      </div>
    </div>
  )
}
