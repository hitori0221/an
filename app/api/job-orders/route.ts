import { NextResponse } from 'next/server'

import { createJobOrder, listJobOrders } from '@/lib/job-orders'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const jobOrders = await listJobOrders()
    return NextResponse.json({ jobOrders })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load job orders'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const jobOrder = await createJobOrder(input)
    return NextResponse.json({ jobOrder }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create job order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
