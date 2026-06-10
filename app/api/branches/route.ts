import { NextResponse } from 'next/server'

import { createBranch, listBranches } from '@/lib/branches'

import type { Branch } from '@/app/main/branches/_components/data-table/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const branches = await listBranches()
    return NextResponse.json({ branches })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load branches'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Branch

    if (!body.code?.trim() || !body.name?.trim() || !body.address?.trim()) {
      return NextResponse.json({ error: 'Branch code, branch name, and location are required' }, { status: 400 })
    }

    const branch = await createBranch(body)
    return NextResponse.json({ branch }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
