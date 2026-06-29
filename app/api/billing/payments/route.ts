import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { createBillingPayment, listBillingPayments } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payments = await listBillingPayments()
    return NextResponse.json({ payments })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load payments'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    const input = contentType.includes('multipart/form-data')
      ? await getPaymentInputFromFormData(request)
      : await request.json()
    const result = await createBillingPayment(input)
    revalidatePath('/main', 'layout')
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function getPaymentInputFromFormData(request: Request) {
  const formData = await request.formData()
  const receiptPhoto = formData.get('receiptPhoto')

  return {
    invoiceId: getText(formData, 'invoiceId'),
    subscriberId: getText(formData, 'subscriberId'),
    expirationDate: getText(formData, 'expirationDate'),
    amount: Number(getText(formData, 'amount')),
    paymentDate: getText(formData, 'paymentDate'),
    method: getText(formData, 'method'),
    referenceNumber: getText(formData, 'referenceNumber'),
    collector: getText(formData, 'collector'),
    notes: getText(formData, 'notes'),
    receiptPhoto: receiptPhoto instanceof File ? receiptPhoto : null,
  }
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key)

  return typeof value === 'string' ? value.trim() : ''
}
