import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyServiceRequest } from '@/lib/service-requests'

export async function PATCH(request: Request, context: RouteContext<'/api/service-requests/[id]/verify'>) {
  try {
    const { id } = await context.params
    const body = await request.json() as { remark?: unknown }
    const result = await verifyServiceRequest(id, typeof body.remark === 'string' ? body.remark : '')
    revalidatePath('/main', 'layout')
    return NextResponse.json({ request: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify service request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
