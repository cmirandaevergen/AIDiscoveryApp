import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ICompany } from '@/features/companies/types'

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<ICompany[]> => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<ICompany, 'name' | 'industry'>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as ICompany
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
