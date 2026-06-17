import { NextResponse } from 'next/server'

import { createModem, listModems } from '@/lib/modems'

import type { Modem } from '@/app/main/modems/_components/data-table/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const modems = await listModems()
    return NextResponse.json({ modems })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load modems'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Modem

    if (!body.code?.trim() || !body.name?.trim()) {
      return NextResponse.json({ error: 'Modem code and modem name are required' }, { status: 400 })
    }

    const modem = await createModem(body)
    return NextResponse.json({ modem }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create modem'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
