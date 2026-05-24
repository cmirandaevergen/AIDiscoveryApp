import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { useCompanies, useCreateCompany } from '@/features/companies/hooks/useCompanies'
import { useCreateEngagement } from '@/features/engagements/hooks/useEngagements'

const schema = z.object({
  company_id: z.string().min(1, 'Select or create a company'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function EngagementCreatePage() {
  const navigate = useNavigate()
  const { data: companies, isLoading: companiesLoading } = useCompanies()
  const { mutateAsync: createCompany, isPending: creatingCompany } = useCreateCompany()
  const { mutateAsync: createEngagement, isPending: creatingEngagement } = useCreateEngagement()

  const [values, setValues] = useState<FormValues>({ company_id: '', name: '', description: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [newCompanyName, setNewCompanyName] = useState('')
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return
    const company = await createCompany({ name: newCompanyName.trim(), industry: null })
    setValues((v) => ({ ...v, company_id: company.id }))
    setNewCompanyName('')
    setShowNewCompany(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const result = schema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormValues
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    try {
      const engagement = await createEngagement({
        company_id: result.data.company_id,
        name: result.data.name,
        description: result.data.description ?? null,
      })
      navigate(`/console/${engagement.id}`)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to create engagement')
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link to="/console" className="text-sm text-muted-foreground hover:text-foreground">
          ← Engagements
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">New engagement</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Company</label>
          {companiesLoading ? (
            <p className="text-sm text-muted-foreground">Loading companies…</p>
          ) : (
            <>
              <select
                value={values.company_id}
                onChange={(e) => setValues((v) => ({ ...v, company_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a company…</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.company_id && <p className="text-xs text-destructive mt-1">{errors.company_id}</p>}

              {showNewCompany ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Company name"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    disabled={creatingCompany || !newCompanyName.trim()}
                    className="bg-primary text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCompany(false)}
                    className="text-sm text-muted-foreground hover:text-foreground px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewCompany(true)}
                  className="mt-1 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  + Add new company
                </button>
              )}
            </>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Engagement name
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Acme AI Strategy 2026"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="Brief context about this engagement…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {serverError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={creatingEngagement}
            className="bg-primary text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {creatingEngagement ? 'Creating…' : 'Create engagement'}
          </button>
          <Link
            to="/console"
            className="rounded-md px-5 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
