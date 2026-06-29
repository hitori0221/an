import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type ServiceRequestStatus = 'Pending' | 'Verified'

export type ServiceRequest = {
  id: string
  status: ServiceRequestStatus
  remark: string
  paymentDate: string
  expirationDate: string
  accountNumber: string
  subscriberName: string
  plan: string
  verifiedAt: string | null
}

type RequestRow = {
  id: string
  status: ServiceRequestStatus
  remark: string | null
  verified_at: string | null
  billing_payments: { payment_date: string; expires: string } | { payment_date: string; expires: string }[]
  subscribers: {
    account_number: string
    first_name: string
    last_name: string
    subscription_plans: { name: string } | { name: string }[] | null
  } | {
    account_number: string
    first_name: string
    last_name: string
    subscription_plans: { name: string } | { name: string }[] | null
  }[]
}

const first = <T,>(value: T | T[] | null): T | null => Array.isArray(value) ? value[0] ?? null : value
const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date(`${value}T00:00:00`))

export async function listServiceRequests(categoryName: string, status: ServiceRequestStatus | 'All') {
  const supabase = await createClient()
  const { data: category, error: categoryError } = await supabase
    .from('subscription_plan_categories').select('id, name').eq('name', categoryName).maybeSingle()
  if (categoryError) throw new Error(`Unable to load category: ${categoryError.message}`)
  if (!category) return { category: null, requests: [] as ServiceRequest[] }

  let query = supabase.from('service_requests').select(`
    id, status, remark, verified_at,
    billing_payments!inner(payment_date, expires),
    subscribers!inner(account_number, first_name, last_name, subscription_plans(name))
  `).eq('category_id', category.id)
  if (status !== 'All') query = query.eq('status', status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw new Error(`Unable to load service requests: ${error.message}`)

  const requests = ((data ?? []) as unknown as RequestRow[]).map((row) => {
    const payment = first(row.billing_payments)!
    const subscriber = first(row.subscribers)!
    const plan = first(subscriber.subscription_plans)
    return {
      id: row.id, status: row.status, remark: row.remark ?? '',
      paymentDate: formatDate(payment.payment_date), expirationDate: formatDate(payment.expires),
      accountNumber: subscriber.account_number,
      subscriberName: `${subscriber.first_name} ${subscriber.last_name}`.trim(),
      plan: plan?.name ?? 'No plan', verifiedAt: row.verified_at,
    }
  })
  return { category, requests }
}

export async function verifyServiceRequest(id: string, remark: string) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) throw new Error('Unauthorized')
  const { data, error } = await supabase.from('service_requests').update({
    status: 'Verified', remark: remark.trim() || null,
    verified_at: new Date().toISOString(), verified_by: userId, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('status', 'Pending').select('id').maybeSingle()
  if (error) throw new Error(`Unable to verify service request: ${error.message}`)
  if (!data) throw new Error('Service request is unavailable or already verified')
  return data
}
