import { NextResponse } from 'next/server'

import { deleteBillingPayment } from '@/lib/billing'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const result = await deleteBillingPayment(id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
