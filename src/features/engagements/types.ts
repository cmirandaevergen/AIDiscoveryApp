export type EngagementStatus = 'draft' | 'active' | 'completed' | 'archived'

export interface IEngagement {
  id: string
  company_id: string
  name: string
  description: string | null
  status: EngagementStatus
  join_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface IEngagementParticipant {
  id: string
  engagement_id: string
  profile_id: string
  role: 'consultant' | 'client_lead' | 'participant'
  joined_at: string
}

export interface IEngagementWithCompany extends IEngagement {
  companies: {
    id: string
    name: string
  }
}
