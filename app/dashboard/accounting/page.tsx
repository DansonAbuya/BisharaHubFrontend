'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { getAccountingSummary } from '@/lib/actions/accounting'
import { getKraExportCsv } from '@/lib/actions/reports'
import { Download } from 'lucide-react'

export default function AccountingPage() {
  const { user } = useAuth()
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [from, setFrom] = useState(startOfMonth.toISOString().slice(0, 10))
  const [to, setTo] = useState(today.toISOString().slice(0, 10))
  const [summary, setSummary] = useState<{
    from: string
    to: string
    totalSales: number
    totalExpenses: number
    netIncome: number
    dailyExpenses: Array<{ date: string; category: string; amount: number; description: string }>
    currency: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const canView = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin' || user?.role === 'assistant_admin'

  /** Triggers backend-generated KRA report via server action. No client-side report assembly. */
  const handleKraExport = async () => {
    setExporting(true)
    try {
      const csv = await getKraExportCsv(from, to)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `biasharahub-kra-${from}-to-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  const handleLoad = async () => {
    if (!canView) return
    setLoading(true)
    setError(null)
    try {
      const s = await getAccountingSummary(from, to)
      setSummary(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Accounting" description="This page is only available to business owners and staff." />
        <PageSection>
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <p className="text-foreground font-medium">You do not have access to this page.</p>
            </CardContent>
          </Card>
        </PageSection>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting"
        description="Daily sales, expenses, and KRA-ready reports for tax compliance."
      />

      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Date range</CardTitle>
            <CardDescription>Select period for summary and report downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium block mb-1">From</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">To</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading…' : 'Load summary'}
              </Button>
              <Button variant="outline" onClick={handleKraExport} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Downloading…' : 'Download KRA CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageSection>

      {error && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        </PageSection>
      )}

      {summary && (
        <>
          <PageSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.currency} {summary.totalSales.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.currency} {summary.totalExpenses.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Net income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {summary.currency} {summary.netIncome.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </PageSection>

          {summary.dailyExpenses.length > 0 && (
            <PageSection>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Expenses in period</CardTitle>
                  <CardDescription>By date and category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summary.dailyExpenses.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-medium text-foreground">{e.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {e.date} {e.description ? `· ${e.description}` : ''}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">{e.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </PageSection>
          )}
        </>
      )}
    </div>
  )
}
