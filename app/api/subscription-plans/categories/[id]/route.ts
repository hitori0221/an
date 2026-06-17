import { NextResponse } from 'next/server'

import {
  deleteSubscriptionPlanCategory,
  updateSubscriptionPlanCategory,
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
    const body = (await request.json()) as { name?: string; iconDataUrl?: string | null }
    const name = body.name?.trim()

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const category = await updateSubscriptionPlanCategory(id, {
      name,
      iconDataUrl: body.iconDataUrl,
    })
    return NextResponse.json({ category })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to rename category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteSubscriptionPlanCategory(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
