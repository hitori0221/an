import { NextResponse } from 'next/server'

import {
  createSubscriptionPlanCategoryGroup,
  listSubscriptionPlanCategoryGroups,
} from '@/lib/subscription-plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const groups = await listSubscriptionPlanCategoryGroups()
    return NextResponse.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load groups'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; categoryIds?: string[] }
    const name = body.name?.trim()
    const categoryIds = body.categoryIds ?? []

    if (!name || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Group name and at least one category are required' }, { status: 400 })
    }

    const group = await createSubscriptionPlanCategoryGroup(name, categoryIds)
    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create group'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

