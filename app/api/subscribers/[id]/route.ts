import { NextResponse } from 'next/server'

import { deleteSubscriber, updateSubscriber } from '@/lib/subscribers'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const formData = await request.formData()
    const subscriber = await updateSubscriber(id, formData)

    return NextResponse.json({ subscriber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update subscriber'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteSubscriber(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete subscriber'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
