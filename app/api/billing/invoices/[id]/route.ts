import { NextResponse } from 'next/server'

import { voidBillingInvoice } from '@/lib/billing'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as { status?: string }

    if (body.status !== 'Void') {
      return NextResponse.json({ error: 'Only invoice voiding is supported' }, { status: 400 })
    }

    const invoice = await voidBillingInvoice(id)
    return NextResponse.json({ invoice })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
