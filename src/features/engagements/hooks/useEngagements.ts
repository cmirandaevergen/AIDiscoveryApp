import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { IEngagement, IEngagementWithCompany } from '@/features/engagements/types'

export function useEngagements() {
  return useQuery({
    queryKey: ['engagements'],
    queryFn: async (): Promise<IEngagementWithCompany[]> => {
      const { data, error } = await supabase
        .from('engagements')
        .select('*, companies(id, name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as IEngagementWithCompany[]
    },
  })
}

export function useEngagement(engagementId: string) {
  return useQuery({
    queryKey: ['engagements', engagementId],
    queryFn: async (): Promise<IEngagementWithCompany> => {
      const { data, error } = await supabase
        .from('engagements')
        .select('*, companies(id, name)')
        .eq('id', engagementId)
        .single()
      if (error) throw error
      return data as IEngagementWithCompany
    },
    enabled: !!engagementId,
  })
}

export function useCreateEngagement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<IEngagement, 'company_id' | 'name' | 'description'>) => {
      const { data, error } = await supabase
        .from('engagements')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as IEngagement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] })
    },
  })
}

export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: Pick<IEngagement, 'id' | 'status'>) => {
      const { data, error } = await supabase
        .from('engagements')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as IEngagement
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] })
      queryClient.invalidateQueries({ queryKey: ['engagements', data.id] })
    },
  })
}
