'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/page-header'
import { PageSection } from '@/components/layout/page-section'
import { listExpenses, createExpense, type ExpenseDto } from '@/lib/actions/expenses'
import { getExpensesExportCsv, getExpensesReportHtml } from '@/lib/actions/reports'
import { Receipt, Plus, Download, Printer } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Transport',
  'Supplies',
  'Utilities',
  'Rent',
  'Salaries',
  'Marketing',
  'Equipment',
  'Other',
]

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<ExpenseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [receiptRef, setReceiptRef] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Date range for the export
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [exportFrom, setExportFrom] = useState(startOfMonth.toISOString().slice(0, 10))
  const [exportTo, setExportTo] = useState(today.toISOString().slice(0, 10))

  const canManage = user?.role === 'owner' || user?.role === 'staff' || user?.role === 'super_admin' || user?.role === 'assistant_admin'

  useEffect(() => {
    if (!canManage) {
      setLoading(false)
      return
    }
    listExpenses()
      .then(setExpenses)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [canManage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!category.trim() || isNaN(amt) || amt <= 0) {
      setSubmitError('Category and a positive amount are required')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const created = await createExpense({
        category: category.trim(),
        amount: amt,
        description: description.trim() || undefined,
        receiptReference: receiptRef.trim() || undefined,
        expenseDate,
      })
      setExpenses((prev) => [created, ...prev])
      setCategory('')
      setAmount('')
      setDescription('')
      setReceiptRef('')
      setExpenseDate(new Date().toISOString().slice(0, 10))
      setIsDialogOpen(false)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to add expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  /** Triggers backend-generated report via server action. No client-side report assembly. */
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await getExpensesExportCsv(exportFrom || undefined, exportTo || undefined)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `biasharahub-expenses-${exportFrom || 'all'}-to-${exportTo || 'all'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  /** Opens backend-generated print report via server action. No client-side report assembly. */
  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      const html = await getExpensesReportHtml(exportFrom || undefined, exportTo || undefined)
      const w = window.open('', '_blank', 'noopener')
      if (w) {
        w.document.write(html)
        w.document.close()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setIsPrinting(false)
    }
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Expenses" description="This page is only available to business owners and staff." />
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
          title="Expenses"
          description="Track business expenses for KRA-ready reports and tax compliance."
        />
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add expense
        </Button>
      </div>

      {error && (
        <PageSection>
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        </PageSection>
      )}

      {/* Export section — report is generated by the backend */}
      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Export expenses report</CardTitle>
            <CardDescription>Download a CSV report generated by the server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium block mb-1">From</label>
                <Input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">To</label>
                <Input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              </div>
              <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Downloading…' : 'Download CSV'}
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="w-4 h-4 mr-2" />
                {isPrinting ? 'Generating…' : 'Print report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Total expenses</CardTitle>
            <CardDescription>All recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">KES {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Expense list</CardTitle>
            <CardDescription>{expenses.length} expenses recorded</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No expenses yet</p>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  Add expenses to track spending and generate KRA-ready reports.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  Add your first expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground">{e.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.expenseDate} {e.description ? `· ${e.description}` : ''}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">KES {e.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageSection>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Record a business expense. Use categories for KRA reporting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <div>
              <label className="text-sm font-medium block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background"
                required
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Amount (KES)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Expense date</label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description (optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for?"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Receipt reference (optional)</label>
              <Input
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="M-Pesa code, invoice number, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding…' : 'Add expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
