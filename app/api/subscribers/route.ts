import { NextResponse } from 'next/server'

import { createSubscriber, listSubscribers } from '@/lib/subscribers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const subscribers = await listSubscribers()
    return NextResponse.json({ subscribers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load subscribers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const subscriber = await createSubscriber(formData)
    return NextResponse.json({ subscriber }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create subscriber'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
