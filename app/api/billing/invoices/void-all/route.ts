import { NextResponse } from 'next/server'

import { voidBillingInvoices } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { invoiceIds?: string[] }
    const result = await voidBillingInvoices(body.invoiceIds ?? [])

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to void invoices'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
