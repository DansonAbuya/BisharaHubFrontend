'use client'

/**
 * Admin-only: View Swagger API documentation.
 * Uses swagger-ui-react when available; otherwise shows a link to open Swagger UI.
 * Fetches OpenAPI spec with auth and embeds Swagger UI (or shows link if swagger-ui-react not installed).
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { BookOpen, ExternalLink } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = sessionStorage.getItem('biashara_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export default function AdminApiDocsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null)
  const [swaggerUiUrl, setSwaggerUiUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [SwaggerUI, setSwaggerUI] = useState<React.ComponentType<{ spec: Record<string, unknown>; persistAuthorization?: boolean; requestInterceptor?: (req: unknown) => unknown }> | null>(null)

  const canAccess = user?.role === 'super_admin' || user?.role === 'assistant_admin'

  useEffect(() => {
    if (!canAccess) {
      router.replace('/dashboard')
      return
    }
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/admin/api-docs-info`, { headers: getAuthHeaders() })
        if (!res.ok) {
          setError(res.status === 403 ? 'Only admins can view API documentation.' : 'Failed to load API docs info.')
          setLoading(false)
          return
        }
        const data = await res.json()
        const specUrl = data.openApiSpecUrl as string
        setSwaggerUiUrl(data.swaggerUiUrl as string)
        const specRes = await fetch(specUrl, { headers: getAuthHeaders() })
        if (!specRes.ok) {
          setError('Failed to load OpenAPI spec.')
          setLoading(false)
          return
        }
        const specData = await specRes.json()
        if (!cancelled) setSpec(specData)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load API documentation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [canAccess, router])

  useEffect(() => {
    import('swagger-ui-react').then((mod) => {
      setSwaggerUI(() => mod.default)
    }).catch(() => {
      setSwaggerUI(null)
    })
  }, [])

  if (!canAccess) return null
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="API Documentation" description="Loading..." />
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading API documentation...</div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="API Documentation" description="Swagger / OpenAPI docs (admin only)" />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('biashara_token') : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Documentation"
        description="BiasharaHub REST API – OpenAPI 3.0. View and try endpoints (admin only)."
      />
      {swaggerUiUrl && (
        <PageSection>
          <Button variant="outline" asChild className="gap-2">
            <a href={swaggerUiUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Open Swagger UI in new tab
            </a>
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            The new tab may require you to authorize with your token in Swagger UI (Authorize → Bearer).
          </p>
        </PageSection>
      )}
      {spec && SwaggerUI && (
        <PageSection className="min-h-[600px]">
          <div className="rounded-lg border bg-card overflow-hidden">
            <SwaggerUI
              spec={spec}
              persistAuthorization
              requestInterceptor={(req: unknown) => {
                const r = req as Request
                if (token && r.headers) r.headers.set('Authorization', `Bearer ${token}`)
                return req
              }}
            />
          </div>
        </PageSection>
      )}
      {spec && !SwaggerUI && (
        <PageSection>
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Install <code className="text-xs bg-muted px-1 rounded">swagger-ui-react</code> for embedded docs:{' '}
              <code className="text-xs bg-muted px-1 rounded">npm install swagger-ui-react</code>. Until then, use the link above to open Swagger UI in a new tab.
            </AlertDescription>
          </Alert>
        </PageSection>
      )}
    </div>
  )
}
