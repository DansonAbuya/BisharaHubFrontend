'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { PageLoading } from '@/components/layout/page-loading'
import { listPendingPayments, matchReceipt, downloadReconciliationReport, type PendingPayment } from '@/lib/actions/reconciliation'
import { Banknote, Check, Download } from 'lucide-react'

export default function ReconciliationPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchingPaymentId, setMatchingPaymentId] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const canView = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin' || user?.role === 'assistant_admin'

  const loadPending = () => {
    if (!canView) return
    setLoading(true)
    setError(null)
    listPendingPayments()
      .then(setPayments)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView])

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matchingPaymentId || !receiptNumber.trim()) return
    setSubmitError('')
    setIsSubmitting(true)
    try {
      await matchReceipt(matchingPaymentId, receiptNumber.trim())
      setPayments((prev) => prev.filter((p) => p.paymentId !== matchingPaymentId))
      setMatchingPaymentId(null)
      setReceiptNumber('')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to match receipt')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Download reconciliation report CSV — generated entirely by the backend.
   */
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await downloadReconciliationReport()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `biasharahub-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Reconciliation" description="This page is only available to business owners and staff." />
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
      <div className="flex items-center justify-between">
        <PageHeader
          title="Payment reconciliation"
          description="Match M-Pesa receipts to pending payments. No need for customers to send screenshots."
        />
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Downloading…' : 'Export report'}
        </Button>
      </div>

      {error && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        </PageSection>
      )}

      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Pending payments</CardTitle>
            <CardDescription>
              Payments awaiting M-Pesa confirmation. Match by entering the M-Pesa receipt number when customer pays.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoading message="Loading pending payments…" minHeight="160px" />
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No pending payments</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Pending payments appear here when customers have placed orders but not yet completed M-Pesa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.paymentId}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{p.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.customerName} · {p.paymentMethod}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        KES {p.amount.toLocaleString()} · {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMatchingPaymentId(p.paymentId)
                        setReceiptNumber('')
                        setSubmitError('')
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Match receipt
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-4" onClick={loadPending} disabled={loading}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </PageSection>

      <Dialog open={!!matchingPaymentId} onOpenChange={(open) => !open && setMatchingPaymentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match M-Pesa receipt</DialogTitle>
            <DialogDescription>
              Enter the M-Pesa receipt number (e.g. ABC123XY) from the customer&apos;s payment confirmation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMatch} className="space-y-4">
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <div>
              <label className="text-sm font-medium block mb-1">M-Pesa receipt number</label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. ABC123XY"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMatchingPaymentId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !receiptNumber.trim()}>
                {isSubmitting ? 'Matching…' : 'Confirm payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
