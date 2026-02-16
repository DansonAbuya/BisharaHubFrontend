'use server'

import { backendFetch } from '@/lib/server/backend'

export interface ExpenseDto {
  id: string
  category: string
  amount: number
  description?: string
  receiptReference?: string
  expenseDate: string
  createdAt?: string
}

export async function listExpenses(): Promise<ExpenseDto[]> {
  const res = await backendFetch('/expenses')
  if (!res.ok) throw new Error('Failed to fetch expenses')
  const data = await res.json()
  return (data ?? []).map((e: { id: string; category: string; amount: number; description?: string; receiptReference?: string; expenseDate: string; createdAt?: string }) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount ?? 0),
    description: e.description,
    receiptReference: e.receiptReference,
    expenseDate: e.expenseDate,
    createdAt: e.createdAt,
  }))
}

export async function createExpense(body: {
  category: string
  amount: number
  description?: string
  receiptReference?: string
  expenseDate: string
}): Promise<ExpenseDto> {
  const res = await backendFetch('/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to add expense')
  }
  const e = await res.json()
  return {
    id: e.id,
    category: e.category,
    amount: Number(e.amount ?? 0),
    description: e.description,
    receiptReference: e.receiptReference,
    expenseDate: e.expenseDate,
    createdAt: e.createdAt,
  }
}

