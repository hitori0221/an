import { NextResponse } from 'next/server'

import {
  deleteSubscriber,
  hardDeleteSubscriber,
  SubscriberDeleteConflictError,
  updateSubscriber,
} from '@/lib/subscribers'

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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const hardDelete = new URL(request.url).searchParams.get('hard') === 'true'

    if (hardDelete) {
      await hardDeleteSubscriber(id)
    } else {
      await deleteSubscriber(id)
    }

    return NextResponse.json({ success: true, hardDelete })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete subscriber'
    const status = error instanceof SubscriberDeleteConflictError ? 409 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
