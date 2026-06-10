import { NextResponse } from 'next/server'

import { deleteBranch, updateBranch } from '@/lib/branches'

import type { Branch } from '@/app/main/branches/_components/data-table/types'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as Branch
    const branch = await updateBranch({
      ...body,
      id,
    })

    return NextResponse.json({ branch })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteBranch(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
