import { NextResponse } from 'next/server'

import { generateBillingInvoices } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const result = await generateBillingInvoices(input)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate invoices'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
