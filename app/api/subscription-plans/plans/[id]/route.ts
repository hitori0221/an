import { NextResponse } from 'next/server'

import { deleteSubscriptionPlan, updateSubscriptionPlan } from '@/lib/subscription-plans'

import type { SubscriptionPlan } from '@/app/main/subscription-plans/_components/data-table/types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as SubscriptionPlan

    const plan = await updateSubscriptionPlan({
      ...body,
      id,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteSubscriptionPlan(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

