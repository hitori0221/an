import { NextResponse } from 'next/server'

import { createInstallation, listInstallations } from '@/lib/installations'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const installations = await listInstallations()
    return NextResponse.json({ installations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load installations'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const installation = await createInstallation(input)
    return NextResponse.json({ installation }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create installation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
