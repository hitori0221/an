import { NextResponse } from 'next/server'

import { deleteModem, updateModem } from '@/lib/modems'

import type { Modem } from '@/app/main/modems/_components/data-table/types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as Modem
    const modem = await updateModem({
      ...body,
      id,
    })

    return NextResponse.json({ modem })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update modem'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteModem(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete modem'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
