import { createClient } from '@/lib/supabase/server'

import type {
  JobOrder,
  JobOrderActivity,
  JobOrderInput,
  JobOrderStatus,
  JobOrderSubscriberOption,
} from '@/app/main/job-orders/_components/data-table/types'

type MaybeArray<T> = T | T[] | null

type JobOrderRow = {
  id: string
  ticket_number: string
  subscriber_id: string
  technician: string
  problem_category: JobOrder['problemCategory']
  problem_details: string
  status: JobOrderStatus
  activities: unknown
  created_at: string
  updated_at: string
  subscribers: MaybeArray<{
    id: string
    account_number: string
    first_name: string
    last_name: string
    phone_number: string
    city: string
    barangay: string
    subscription_plans: MaybeArray<{
      name: string
    }>
  }>
}

type JobOrderSubscriberRow = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  phone_number: string
  city: string
  barangay: string
  status: 'Active' | 'Inactive' | 'Pending'
  subscription_plans: MaybeArray<{
    name: string
  }>
}

const jobOrderSelect = `
  id,
  ticket_number,
  subscriber_id,
  technician,
  problem_category,
  problem_details,
  status,
  activities,
  created_at,
  updated_at,
  subscribers (
    id,
    account_number,
    first_name,
    last_name,
    phone_number,
    city,
    barangay,
    subscription_plans (
      name
    )
  )
`

const subscriberSelect = `
  id,
  account_number,
  first_name,
  last_name,
  phone_number,
  city,
  barangay,
  status,
  subscription_plans (
    name
  )
`

const firstRecord = <T>(value: MaybeArray<T>) => (Array.isArray(value) ? value[0] : value)

const formatJobOrderDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const formatJobOrderTimestamp = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const normalizeActivities = (value: unknown): JobOrderActivity[] => {
  if (!Array.isArray(value)) return []

  return value.flatMap((activity) => {
    if (!activity || typeof activity !== 'object') return []

    const record = activity as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    const title = typeof record.title === 'string' ? record.title : ''
    const description = typeof record.description === 'string' ? record.description : ''
    const timestamp = typeof record.timestamp === 'string' ? record.timestamp : ''

    if (!id || !title || !timestamp) return []

    return [
      {
        id,
        title,
        description,
        timestamp,
      },
    ]
  })
}

const normalizeJobOrder = (jobOrder: JobOrderRow): JobOrder => {
  const subscriber = firstRecord(jobOrder.subscribers)
  const plan = firstRecord(subscriber?.subscription_plans ?? null)
  const subscriberName = subscriber
    ? `${subscriber.first_name} ${subscriber.last_name}`.trim()
    : 'Unknown subscriber'
  const activities = normalizeActivities(jobOrder.activities)

  return {
    id: jobOrder.id,
    ticketNumber: jobOrder.ticket_number,
    subscriberId: jobOrder.subscriber_id,
    accountNumber: subscriber?.account_number ?? '',
    subscriberName,
    phoneNumber: subscriber?.phone_number ?? '',
    plan: plan?.name ?? '',
    city: subscriber?.city ?? '',
    barangay: subscriber?.barangay ?? '',
    problemCategory: jobOrder.problem_category,
    problemDetails: jobOrder.problem_details,
    technician: jobOrder.technician,
    status: jobOrder.status,
    createdDate: formatJobOrderDate(jobOrder.created_at),
    lastUpdate: activities.at(-1)?.description ?? formatJobOrderTimestamp(jobOrder.updated_at),
    activities,
  }
}

const normalizeSubscriberOption = (subscriber: JobOrderSubscriberRow): JobOrderSubscriberOption => {
  const plan = firstRecord(subscriber.subscription_plans)
  const name = `${subscriber.first_name} ${subscriber.last_name}`.trim()

  return {
    id: subscriber.id,
    accountNumber: subscriber.account_number,
    name,
    phoneNumber: subscriber.phone_number,
    plan: plan?.name ?? '',
    city: subscriber.city,
    barangay: subscriber.barangay,
  }
}

const getNextTicketNumber = (jobOrders: JobOrder[]) => {
  const currentYear = new Date().getFullYear()
  const maxTicketNumber = jobOrders.reduce((max, jobOrder) => {
    const numericId = Number(jobOrder.ticketNumber.split('-').at(-1))

    return Number.isFinite(numericId) ? Math.max(max, numericId) : max
  }, 0)

  return `JO-${currentYear}-${String(maxTicketNumber + 1).padStart(4, '0')}`
}

export async function listJobOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('job_orders')
    .select(jobOrderSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load job orders: ${error.message}`)
  }

  return ((data ?? []) as JobOrderRow[]).map(normalizeJobOrder)
}

export async function listJobOrderSubscribers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscribers')
    .select(subscriberSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load subscribers for job orders: ${error.message}`)
  }

  return ((data ?? []) as JobOrderSubscriberRow[]).map(normalizeSubscriberOption)
}

export async function getJobOrdersPageData() {
  const [jobOrders, subscribers] = await Promise.all([
    listJobOrders(),
    listJobOrderSubscribers(),
  ])

  return {
    jobOrders,
    subscribers,
    nextTicketNumber: getNextTicketNumber(jobOrders),
  }
}

export async function createJobOrder(input: JobOrderInput) {
  if (!input.subscriberId || !input.technician || !input.problemCategory || !input.problemDetails.trim()) {
    throw new Error('Subscriber, technician, problem category, and problem details are required')
  }

  const now = new Date().toISOString()
  const activities: JobOrderActivity[] = [
    {
      id: `${input.ticketNumber}-A1`,
      title: 'Created ticket',
      description: `${input.problemCategory} issue logged from the operations drawer.`,
      timestamp: formatJobOrderTimestamp(now),
    },
    {
      id: `${input.ticketNumber}-A2`,
      title: 'Assigned technician',
      description: `Assigned to ${input.technician}.`,
      timestamp: formatJobOrderTimestamp(now),
    },
  ]
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('job_orders')
    .insert({
      ticket_number: input.ticketNumber,
      subscriber_id: input.subscriberId,
      technician: input.technician,
      problem_category: input.problemCategory,
      problem_details: input.problemDetails.trim(),
      status: 'Assigned',
      activities,
    })
    .select(jobOrderSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create job order: ${error.message}`)
  }

  return normalizeJobOrder(data as JobOrderRow)
}

export async function updateJobOrderStatus(jobOrderId: string, status: JobOrderStatus) {
  const now = new Date().toISOString()
  const supabase = await createClient()
  const { data: currentJobOrder, error: loadError } = await supabase
    .from('job_orders')
    .select('activities')
    .eq('id', jobOrderId)
    .single()

  if (loadError) {
    throw new Error(`Unable to load job order: ${loadError.message}`)
  }

  const currentActivities = normalizeActivities(currentJobOrder.activities)
  const activities: JobOrderActivity[] = [
    ...currentActivities,
    {
      id: `${jobOrderId}-${Date.now()}`,
      title: 'Status changed',
      description: `Moved to ${status}.`,
      timestamp: formatJobOrderTimestamp(now),
    },
  ]
  const { data, error } = await supabase
    .from('job_orders')
    .update({
      status,
      activities,
      updated_at: now,
    })
    .eq('id', jobOrderId)
    .select(jobOrderSelect)
    .single()

  if (error) {
    throw new Error(`Unable to update job order: ${error.message}`)
  }

  return normalizeJobOrder(data as JobOrderRow)
}
