import 'server-only'

import { createClient } from '@/lib/supabase/server'

type PaymentRow = { amount: number | string; payment_date: string; status: string; subscriber_id: string }
type InstallationRow = { id: string; status: string; schedule_date: string | null; installed_at: string | null }
type JobOrderRow = {
  id: string
  ticket_number: string
  status: string
  problem_category: string
  technician: string
  created_at: string
  subscribers: { first_name: string; last_name: string; barangay: string; city: string } | { first_name: string; last_name: string; barangay: string; city: string }[] | null
}

const first = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] ?? null : value
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const dateKey = (date: Date) => date.toISOString().slice(0, 10)

export async function getDashboardData() {
  const supabase = await createClient()
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 6)

  const [subscribersResult, paymentsResult, installationsResult, jobOrdersResult] = await Promise.all([
    supabase.from('subscribers').select('id, status, created_at'),
    supabase.from('billing_payments').select('amount, payment_date, status, subscriber_id').gte('payment_date', dateKey(sixMonthsAgo)),
    supabase.from('installations').select('id, status, schedule_date, installed_at').gte('created_at', yearStart.toISOString()),
    supabase.from('job_orders').select('id, ticket_number, status, problem_category, technician, created_at, subscribers(first_name, last_name, barangay, city)').order('created_at', { ascending: false }),
  ])

  const error = subscribersResult.error ?? paymentsResult.error ?? installationsResult.error ?? jobOrdersResult.error
  if (error) throw new Error(`Unable to load dashboard: ${error.message}`)

  const subscribers = subscribersResult.data ?? []
  const payments = (paymentsResult.data ?? []) as PaymentRow[]
  const installations = (installationsResult.data ?? []) as InstallationRow[]
  const jobOrders = (jobOrdersResult.data ?? []) as unknown as JobOrderRow[]
  const postedPayments = payments.filter((payment) => payment.status === 'Posted')
  const currentMonthPayments = postedPayments.filter((payment) => payment.payment_date >= dateKey(monthStart(now)))
  const monthlyCollections = currentMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === 'Active').length
  const pendingInstallations = installations.filter((installation) => ['Pending', 'Scheduled', 'In Progress'].includes(installation.status)).length
  const openJobOrders = jobOrders.filter((order) => !['Resolved', 'Closed', 'Cancelled'].includes(order.status)).length

  const revenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      month,
      revenue: postedPayments.filter((payment) => payment.payment_date.startsWith(prefix)).reduce((sum, payment) => sum + Number(payment.amount), 0),
    }
  })

  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekAgo)
    date.setDate(weekAgo.getDate() + index)
    const key = dateKey(date)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      installations: installations.filter((item) => (item.installed_at ?? item.schedule_date) === key).length,
      tickets: jobOrders.filter((item) => item.created_at.startsWith(key)).length,
    }
  })

  const workOrders = jobOrders
    .filter((order) => !['Resolved', 'Closed', 'Cancelled'].includes(order.status))
    .slice(0, 4)
    .map((order) => {
      const subscriber = first(order.subscribers)
      const customer = subscriber ? `${subscriber.first_name} ${subscriber.last_name}`.trim() : 'Unknown subscriber'
      return {
        id: order.id,
        ticketNumber: order.ticket_number,
        customer,
        location: subscriber ? [subscriber.barangay, subscriber.city].filter(Boolean).join(', ') : 'No location',
        type: order.problem_category,
        technician: order.technician || 'Unassigned',
        initials: customer.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        status: order.status,
      }
    })

  return {
    metrics: { activeSubscribers, monthlyCollections, pendingInstallations, openJobOrders },
    revenue,
    activity,
    workOrders,
    paidAccounts: new Set(currentMonthPayments.map((payment) => payment.subscriber_id)).size,
    totalSubscribers: subscribers.length,
    updatedAt: now.toISOString(),
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
