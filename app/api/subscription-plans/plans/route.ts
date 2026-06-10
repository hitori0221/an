import { NextResponse } from 'next/server'

import { createSubscriptionPlan, listSubscriptionPlans } from '@/lib/subscription-plans'

import type { SubscriptionPlan } from '@/app/main/subscription-plans/_components/data-table/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await listSubscriptionPlans()
    return NextResponse.json({ plans })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load plans'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscriptionPlan

    if (!body.code?.trim() || !body.name?.trim() || (!body.categoryId && !body.groupId)) {
      return NextResponse.json({ error: 'Plan code, name, and category are required' }, { status: 400 })
    }

    const plan = await createSubscriptionPlan(body)
    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
