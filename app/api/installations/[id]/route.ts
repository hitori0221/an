import { NextResponse } from 'next/server'

import { deleteInstallation, updateInstallation } from '@/lib/installations'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const input = await request.json()
    const installation = await updateInstallation(id, input)

    return NextResponse.json({ installation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update installation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteInstallation(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete installation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
