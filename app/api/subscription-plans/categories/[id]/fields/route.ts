import { NextResponse } from 'next/server'

import { createSubscriptionCategoryField } from '@/lib/subscription-plans'

import type { SubscriptionCategoryFieldType } from '@/app/main/subscription-plans/_components/data-table/types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type FieldRequestBody = {
  label?: string
  type?: SubscriptionCategoryFieldType
  placeholder?: string | null
  required?: boolean
  options?: string[]
  sortOrder?: number
}

const fieldTypes: SubscriptionCategoryFieldType[] = ['text', 'password', 'number', 'date', 'select', 'textarea']

export const dynamic = 'force-dynamic'

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as FieldRequestBody
    const label = body.label?.trim()
    const type = body.type ?? 'text'

    if (!label) {
      return NextResponse.json({ error: 'Field label is required' }, { status: 400 })
    }

    if (!fieldTypes.includes(type)) {
      return NextResponse.json({ error: 'Field type is invalid' }, { status: 400 })
    }

    const field = await createSubscriptionCategoryField(id, {
      label,
      type,
      placeholder: body.placeholder,
      required: body.required,
      options: body.options,
      sortOrder: body.sortOrder,
    })

    return NextResponse.json({ field }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create category field'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
