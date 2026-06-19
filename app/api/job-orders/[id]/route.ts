import { NextResponse } from 'next/server'

import { updateJobOrderStatus } from '@/lib/job-orders'
import type { JobOrderStatus } from '@/app/main/job-orders/_components/data-table/types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const input = (await request.json()) as { status?: JobOrderStatus }

    if (!input.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const jobOrder = await updateJobOrderStatus(id, input.status)
    return NextResponse.json({ jobOrder })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update job order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
