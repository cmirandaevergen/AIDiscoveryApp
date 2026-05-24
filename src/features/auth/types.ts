export type UserRole = 'consultant' | 'client_lead' | 'participant'

export interface IProfile {
  id: string
  role: UserRole
  display_name: string | null
  company_id: string | null
  created_at: string
  updated_at: string
}
