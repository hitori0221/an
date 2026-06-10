import { NextResponse } from 'next/server'

import {
  deleteSubscriptionPlanCategoryGroup,
  updateSubscriptionPlanCategoryGroup,
} from '@/lib/subscription-plans'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as { name?: string; categoryIds?: string[] }
    const name = body.name?.trim()
    const categoryIds = body.categoryIds ?? []

    if (!name || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Group name and at least one category are required' }, { status: 400 })
    }

    const group = await updateSubscriptionPlanCategoryGroup(id, name, categoryIds)
    return NextResponse.json({ group })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update group'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteSubscriptionPlanCategoryGroup(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete group'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

