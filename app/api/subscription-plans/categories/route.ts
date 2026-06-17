import { NextResponse } from 'next/server'

import {
  createSubscriptionPlanCategory,
  listSubscriptionPlanCategories,
} from '@/lib/subscription-plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await listSubscriptionPlanCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load categories'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; iconDataUrl?: string | null }
    const name = body.name?.trim()

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const category = await createSubscriptionPlanCategory({
      name,
      iconDataUrl: body.iconDataUrl,
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
