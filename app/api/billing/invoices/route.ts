import { NextResponse } from 'next/server'

import { createBillingInvoice, listBillingInvoices } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const invoices = await listBillingInvoices()
    return NextResponse.json({ invoices })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load invoices'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const invoice = await createBillingInvoice(input)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
