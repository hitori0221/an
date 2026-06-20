import { randomUUID } from 'crypto'

import { createClient } from '@/lib/supabase/server'

import type {
  BillingCollectionSummary,
  BillingInvoice,
  BillingInvoiceGenerationInput,
  BillingInvoiceGenerationResult,
  BillingInvoiceInput,
  BillingSubscriptionStatus,
  BillingInvoiceVoidAllResult,
  BillingInvoiceStatus,
  BillingPayment,
  BillingPaymentInput,
  BillingPaymentMethod,
  BillingPaymentStatus,
  BillingSubscriberOption,
} from '@/app/main/billing/_components/data-table/types'

type MaybeArray<T> = T | T[] | null

type BillingInvoiceRow = {
  id: string
  invoice_number: string
  subscriber_id: string
  subscription_plan_id: string | null
  plan_name: string
  billing_period: string
  invoice_date: string
  service_period_start: string
  service_period_end: string
  due_date: string
  expiration_date: string
  amount: number | string
  paid_amount: number | string
  balance: number | string
  status: BillingInvoiceStatus
  notes: string
  created_at: string
  updated_at: string
  subscribers: MaybeArray<{
    account_number: string
    first_name: string
    last_name: string
    phone_number: string
  }>
}

type BillingPaymentRow = {
  id: string
  invoice_id: string
  subscriber_id: string
  amount: number | string
  payment_date: string
  paid_until: string
  method: BillingPaymentMethod
  reference_number: string | null
  collector: string
  receipt_photo_path: string | null
  notes: string
  status: BillingPaymentStatus
  created_at: string
  billing_invoices: MaybeArray<{
    invoice_number: string
  }>
  subscribers: MaybeArray<{
    account_number: string
    first_name: string
    last_name: string
  }>
}

type BillingSubscriberRow = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  phone_number: string
  city: string
  barangay: string
  street_zone: string | null
  next_billing_date: string
  due_date: string
  expiration_date: string
  subscription_plan_id: string | null
  subscription_plans: MaybeArray<{
    id: string
    name: string
    price: number | string
  }>
}

type BillingGenerationSubscriberRow = BillingSubscriberRow & {
  installations: MaybeArray<{
    status: string
    installed_at: string | null
    updated_at: string
  }>
}

const invoiceSelect = `
  id,
  invoice_number,
  subscriber_id,
  subscription_plan_id,
  plan_name,
  billing_period,
  invoice_date,
  service_period_start,
  service_period_end,
  due_date,
  expiration_date,
  amount,
  paid_amount,
  balance,
  status,
  notes,
  created_at,
  updated_at,
  subscribers (
    account_number,
    first_name,
    last_name,
    phone_number
  )
`

const paymentSelect = `
  id,
  invoice_id,
  subscriber_id,
  amount,
  payment_date,
  paid_until,
  method,
  reference_number,
  collector,
  receipt_photo_path,
  notes,
  status,
  created_at,
  billing_invoices (
    invoice_number
  ),
  subscribers (
    account_number,
    first_name,
    last_name
  )
`

const billingSubscriberSelect = `
  id,
  account_number,
  first_name,
  last_name,
  phone_number,
  city,
  barangay,
  street_zone,
  next_billing_date,
  due_date,
  expiration_date,
  subscription_plan_id,
  subscription_plans (
    id,
    name,
    price
  )
`

const billingGenerationSubscriberSelect = `
  ${billingSubscriberSelect},
  installations (
    status,
    installed_at,
    updated_at
  )
`

const currencyNumber = (value: number | string) => Number(value)

const firstRecord = <T>(value: MaybeArray<T>) => (Array.isArray(value) ? value[0] : value)

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getTodayDateValue = () => formatDateValue(new Date())

const parseDateValue = (value: string) => {
  const [yearValue, monthValue, dayValue] = value.split('-').map(Number)

  return new Date(yearValue, monthValue - 1, dayValue)
}

const addDaysToDateValue = (value: string, days: number) => {
  const date = parseDateValue(value)
  date.setDate(date.getDate() + days)

  return formatDateValue(date)
}

const addMonthsToDateValue = (value: string, months: number) => {
  const date = parseDateValue(value)
  const originalDay = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(originalDay, lastDayOfTargetMonth))

  return formatDateValue(target)
}

const getCycleEndDate = (value: string) => {
  const date = parseDateValue(value)

  return formatDateValue(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

const getDefaultDueDate = (nextBillingDate: string) => {
  const date = parseDateValue(nextBillingDate)
  const sameMonthTenth = formatDateValue(new Date(date.getFullYear(), date.getMonth(), 10))

  return sameMonthTenth < nextBillingDate ? nextBillingDate : sameMonthTenth
}

const getInvoiceStatus = ({
  amount,
  paidAmount,
  dueDate,
}: {
  amount: number
  paidAmount: number
  dueDate: string
}): BillingInvoiceStatus => {
  const balance = Math.max(amount - paidAmount, 0)

  if (balance === 0) return 'Paid'

  if (dueDate < getTodayDateValue()) return 'Overdue'

  return paidAmount === 0 ? 'Unpaid' : 'Partial'
}

const formatDate = (value: string | null) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const formatName = (person: { first_name: string; last_name: string } | null | undefined) =>
  person ? `${person.first_name} ${person.last_name}`.trim() : 'Unknown subscriber'

const formatAddress = (subscriber: {
  street_zone: string | null
  barangay: string
  city: string
}) => [subscriber.street_zone, subscriber.barangay, subscriber.city].filter(Boolean).join(', ')

const safeFilePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'receipt'

const getBillingPeriodRange = (billingPeriod: string) => {
  const [yearValue, monthValue] = billingPeriod.split('-').map(Number)
  const lastDayOfMonth = new Date(yearValue, monthValue, 0).getDate()

  return {
    start: `${yearValue}-${String(monthValue).padStart(2, '0')}-01`,
    end: `${yearValue}-${String(monthValue).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`,
  }
}

const formatServicePeriod = (start: string, end: string) => {
  if (!start || !end) return ''

  return `${formatDate(start)} - ${formatDate(end)}`
}

const getInstalledDate = (subscriber: BillingGenerationSubscriberRow) => {
  const installedRows = (Array.isArray(subscriber.installations)
    ? subscriber.installations
    : subscriber.installations
      ? [subscriber.installations]
      : []
  ).filter((installation) => installation.status === 'Installed')

  installedRows.sort((first, second) => {
    const firstDate = first.installed_at ?? first.updated_at
    const secondDate = second.installed_at ?? second.updated_at

    return new Date(secondDate).getTime() - new Date(firstDate).getTime()
  })

  const installedDate = installedRows[0]?.installed_at ?? installedRows[0]?.updated_at

  return installedDate ? installedDate.slice(0, 10) : null
}

const normalizeInvoice = (invoice: BillingInvoiceRow): BillingInvoice => {
  const subscriber = firstRecord(invoice.subscribers)

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    subscriberId: invoice.subscriber_id,
    accountNumber: subscriber?.account_number ?? '',
    subscriberName: formatName(subscriber),
    phoneNumber: subscriber?.phone_number ?? '',
    planId: invoice.subscription_plan_id,
    plan: invoice.plan_name,
    billingPeriod: invoice.billing_period,
    invoiceDate: formatDate(invoice.invoice_date),
    invoiceDateValue: invoice.invoice_date,
    servicePeriodStart: formatDate(invoice.service_period_start),
    servicePeriodStartValue: invoice.service_period_start,
    servicePeriodEnd: formatDate(invoice.service_period_end),
    servicePeriodEndValue: invoice.service_period_end,
    servicePeriod: formatServicePeriod(invoice.service_period_start, invoice.service_period_end),
    dueDate: formatDate(invoice.due_date),
    dueDateValue: invoice.due_date,
    expirationDate: formatDate(invoice.expiration_date),
    expirationDateValue: invoice.expiration_date,
    amount: currencyNumber(invoice.amount),
    paidAmount: currencyNumber(invoice.paid_amount),
    balance: currencyNumber(invoice.balance),
    status: getInvoiceStatus({
      amount: currencyNumber(invoice.amount),
      paidAmount: currencyNumber(invoice.paid_amount),
      dueDate: invoice.due_date,
    }),
    notes: invoice.notes,
    createdAt: formatDate(invoice.created_at),
    updatedAt: formatDate(invoice.updated_at),
  }
}

const normalizePayment = (payment: BillingPaymentRow): BillingPayment => {
  const subscriber = firstRecord(payment.subscribers)
  const invoice = firstRecord(payment.billing_invoices)

  return {
    id: payment.id,
    invoiceId: payment.invoice_id,
    invoiceNumber: invoice?.invoice_number ?? '',
    subscriberId: payment.subscriber_id,
    accountNumber: subscriber?.account_number ?? '',
    subscriberName: formatName(subscriber),
    amount: currencyNumber(payment.amount),
    paymentDate: formatDate(payment.payment_date),
    paymentDateValue: payment.payment_date,
    expirationDate: formatDate(payment.paid_until),
    expirationDateValue: payment.paid_until,
    method: payment.method,
    referenceNumber: payment.reference_number ?? '',
    collector: payment.collector,
    receiptPhotoPath: payment.receipt_photo_path ?? '',
    notes: payment.notes,
    status: payment.status,
    createdAt: formatDate(payment.created_at),
  }
}

const normalizeSubscriberOption = (
  subscriber: BillingSubscriberRow,
  billingStatus: BillingSubscriptionStatus,
): BillingSubscriberOption => {
  const plan = firstRecord(subscriber.subscription_plans)

  return {
    id: subscriber.id,
    accountNumber: subscriber.account_number,
    name: `${subscriber.first_name} ${subscriber.last_name}`.trim(),
    phoneNumber: subscriber.phone_number,
    planId: subscriber.subscription_plan_id,
    plan: plan?.name ?? '',
    planPrice: plan ? currencyNumber(plan.price) : 0,
    address: formatAddress(subscriber),
    nextBillingDate: formatDate(subscriber.next_billing_date),
    nextBillingDateValue: subscriber.next_billing_date,
    dueDate: formatDate(subscriber.due_date),
    dueDateValue: subscriber.due_date,
    expirationDate: formatDate(subscriber.expiration_date),
    expirationDateValue: subscriber.expiration_date,
    billingStatus,
  }
}

const getNextInvoiceSequence = async () => {
  const supabase = await createClient()
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const { data, error } = await supabase
    .from('billing_invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to generate invoice number: ${error.message}`)
  }

  const lastSequence = typeof data?.invoice_number === 'string'
    ? Number(data.invoice_number.split('-').at(-1))
    : 0
  return Number.isFinite(lastSequence) ? lastSequence + 1 : 1
}

const formatInvoiceNumber = (sequence: number) => {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(sequence).padStart(4, '0')}`
}

const getNextInvoiceNumber = async () => {
  const nextSequence = await getNextInvoiceSequence()

  return formatInvoiceNumber(nextSequence)
}

const currentBillingPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function syncBillingInvoiceStatuses() {
  const supabase = await createClient()
  const today = getTodayDateValue()
  const { error } = await supabase
    .from('billing_invoices')
    .update({ status: 'Overdue', updated_at: new Date().toISOString() })
    .lt('due_date', today)
    .gt('balance', 0)
    .in('status', ['Unpaid', 'Partial'])

  if (error) {
    throw new Error(`Unable to refresh overdue invoices: ${error.message}`)
  }
}

async function updateSubscriberBillingDates(
  subscriberId: string,
  values: {
    nextBillingDate: string
    dueDate: string
    expirationDate: string
  },
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('subscribers')
    .update({
      next_billing_date: values.nextBillingDate,
      due_date: values.dueDate,
      expiration_date: values.expirationDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriberId)

  if (error) {
    throw new Error(`Unable to update subscriber billing dates: ${error.message}`)
  }
}

export async function listBillingSubscribers() {
  const supabase = await createClient()
  const [
    { data, error },
    { data: invoiceRows, error: invoiceError },
  ] = await Promise.all([
    supabase
      .from('subscribers')
      .select(billingSubscriberSelect)
      .eq('status', 'Active')
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_invoices')
      .select('subscriber_id, due_date, balance, status')
      .in('status', ['Unpaid', 'Partial', 'Overdue']),
  ])

  if (error) {
    throw new Error(`Unable to load billing subscribers: ${error.message}`)
  }

  if (invoiceError) {
    throw new Error(`Unable to load billing subscriber statuses: ${invoiceError.message}`)
  }

  const overdueSubscriberIds = new Set(
    (invoiceRows ?? [])
      .filter((invoice) => Number(invoice.balance) > 0 && String(invoice.due_date) < getTodayDateValue())
      .map((invoice) => String(invoice.subscriber_id)),
  )

  return ((data ?? []) as BillingSubscriberRow[]).map((subscriber) => {
    const billingStatus: BillingSubscriptionStatus = subscriber.expiration_date < getTodayDateValue()
      ? 'Expired'
      : overdueSubscriberIds.has(subscriber.id)
        ? 'Overdue'
        : 'Active'

    return normalizeSubscriberOption(subscriber, billingStatus)
  })
}

export async function listBillingInvoices() {
  await syncBillingInvoiceStatuses()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('billing_invoices')
    .select(invoiceSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load billing invoices: ${error.message}`)
  }

  return ((data ?? []) as BillingInvoiceRow[]).map(normalizeInvoice)
}

export async function listOpenBillingInvoices() {
  const invoices = await listBillingInvoices()

  return invoices.filter(
    (invoice) => invoice.status === 'Unpaid' || invoice.status === 'Partial' || invoice.status === 'Overdue',
  )
}

export async function listBillingPayments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('billing_payments')
    .select(paymentSelect)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load billing payments: ${error.message}`)
  }

  return ((data ?? []) as BillingPaymentRow[]).map(normalizePayment)
}

export async function getDueAccountsPageData() {
  const autoGenerationResult = await generateBillingInvoices({
    billingPeriod: currentBillingPeriod(),
    notes: '',
  })
  const [invoices, subscribers] = await Promise.all([
    listOpenBillingInvoices(),
    listBillingSubscribers(),
  ])

  return {
    invoices,
    subscribers,
    autoGenerationResult,
  }
}

export async function getPaymentsPageData() {
  await generateBillingInvoices({
    billingPeriod: currentBillingPeriod(),
    notes: '',
  })
  const [payments, openInvoices, subscribers] = await Promise.all([
    listBillingPayments(),
    listOpenBillingInvoices(),
    listBillingSubscribers(),
  ])

  return {
    payments,
    openInvoices,
    subscribers,
  }
}

export async function getCollectionsPageData() {
  const payments = await listBillingPayments()
  const summaries = Array.from(
    payments
      .filter((payment) => payment.status === 'Posted')
      .reduce<Map<string, BillingCollectionSummary>>((summaryMap, payment) => {
        const key = `${payment.paymentDateValue}:${payment.collector}:${payment.method}`
        const current = summaryMap.get(key)

        if (current) {
          current.paymentCount += 1
          current.totalAmount += payment.amount
          current.lastReferenceNumber = payment.referenceNumber || current.lastReferenceNumber
        } else {
          summaryMap.set(key, {
            id: key,
            paymentDate: payment.paymentDate,
            collector: payment.collector || 'Unassigned',
            method: payment.method,
            paymentCount: 1,
            totalAmount: payment.amount,
            lastReferenceNumber: payment.referenceNumber,
          })
        }

        return summaryMap
      }, new Map())
      .values(),
  )

  return {
    payments,
    summaries,
  }
}

export async function createBillingInvoice(input: BillingInvoiceInput) {
  if (!input.subscriberId) {
    throw new Error('Select a subscriber')
  }

  if (!input.billingPeriod || !/^\d{4}-\d{2}$/.test(input.billingPeriod)) {
    throw new Error('Enter a valid billing period')
  }

  if (!input.dueDate) {
    throw new Error('Enter a due date')
  }

  if (!input.expirationDate) {
    throw new Error('Enter an expiration date')
  }

  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('Enter a valid invoice amount')
  }

  const supabase = await createClient()
  const { data: subscriber, error: subscriberError } = await supabase
    .from('subscribers')
    .select(billingSubscriberSelect)
    .eq('id', input.subscriberId)
    .single()

  if (subscriberError) {
    throw new Error(`Unable to load subscriber for invoice: ${subscriberError.message}`)
  }

  const subscriberRow = subscriber as BillingSubscriberRow
  const plan = firstRecord(subscriberRow.subscription_plans)
  const invoiceNumber = await getNextInvoiceNumber()
  const servicePeriod = getBillingPeriodRange(input.billingPeriod)
  const invoiceStatus = getInvoiceStatus({
    amount: input.amount,
    paidAmount: 0,
    dueDate: input.dueDate,
  })
  const { data, error } = await supabase
    .from('billing_invoices')
    .insert({
      invoice_number: invoiceNumber,
      subscriber_id: input.subscriberId,
      subscription_plan_id: subscriberRow.subscription_plan_id,
      plan_name: plan?.name ?? '',
      billing_period: input.billingPeriod,
      invoice_date: new Date().toISOString().slice(0, 10),
      service_period_start: servicePeriod.start,
      service_period_end: servicePeriod.end,
      due_date: input.dueDate,
      expiration_date: input.expirationDate,
      amount: input.amount,
      paid_amount: 0,
      balance: input.amount,
      status: invoiceStatus,
      notes: input.notes,
    })
    .select(invoiceSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create invoice: ${error.message}`)
  }

  return normalizeInvoice(data as BillingInvoiceRow)
}

export async function generateBillingInvoices(
  input: BillingInvoiceGenerationInput,
): Promise<BillingInvoiceGenerationResult> {
  if (!input.billingPeriod || !/^\d{4}-\d{2}$/.test(input.billingPeriod)) {
    throw new Error('Enter a valid billing period')
  }

  const supabase = await createClient()
  const [
    { data: subscriberRows, error: subscriberError },
    { data: existingRows, error: existingError },
  ] = await Promise.all([
    supabase
      .from('subscribers')
      .select(billingGenerationSubscriberSelect)
      .eq('status', 'Active')
      .order('created_at', { ascending: false }),
    supabase
      .from('billing_invoices')
      .select('subscriber_id')
      .eq('billing_period', input.billingPeriod),
  ])

  if (subscriberError) {
    throw new Error(`Unable to load subscribers for invoice generation: ${subscriberError.message}`)
  }

  if (existingError) {
    throw new Error(`Unable to check existing invoices: ${existingError.message}`)
  }

  const existingSubscriberIds = new Set(
    (existingRows ?? []).map((invoice) => invoice.subscriber_id as string),
  )
  const billingPeriodRange = getBillingPeriodRange(input.billingPeriod)
  const subscribers = ((subscriberRows ?? []) as BillingGenerationSubscriberRow[])
  const billableSubscribers = subscribers.filter((subscriber) => {
    const plan = firstRecord(subscriber.subscription_plans)

    return Boolean(subscriber.subscription_plan_id && plan)
  })
  const installedSubscribers = billableSubscribers.filter(
    (subscriber) => Boolean(getInstalledDate(subscriber)) && Boolean(subscriber.next_billing_date),
  )
  const subscribersToBill = installedSubscribers.filter((subscriber) => !existingSubscriberIds.has(subscriber.id))
    .filter(
      (subscriber) =>
        subscriber.next_billing_date >= billingPeriodRange.start
        && subscriber.next_billing_date <= billingPeriodRange.end,
    )
  const skippedWithoutPlan = subscribers.length - billableSubscribers.length
  const skippedWithoutInstallation = billableSubscribers.length - installedSubscribers.length
  const scheduledSubscribers = installedSubscribers.filter(
    (subscriber) =>
      subscriber.next_billing_date >= billingPeriodRange.start
      && subscriber.next_billing_date <= billingPeriodRange.end,
  )
  const skippedExisting = scheduledSubscribers.length - subscribersToBill.length

  if (subscribersToBill.length === 0) {
    return {
      invoices: [],
      generated: 0,
      skippedExisting,
      skippedWithoutPlan,
      skippedWithoutInstallation,
      eligibleSubscribers: billableSubscribers.length,
    }
  }

  const nextSequence = await getNextInvoiceSequence()
  const rows = subscribersToBill.map((subscriber, index) => {
    const plan = firstRecord(subscriber.subscription_plans)
    const amount = plan ? currencyNumber(plan.price) : 0
    const installedDate = getInstalledDate(subscriber)
    const servicePeriod = getBillingPeriodRange(input.billingPeriod)
    const dueDate = subscriber.due_date || getDefaultDueDate(subscriber.next_billing_date)
    const expirationDate = getCycleEndDate(subscriber.next_billing_date)

    if (!installedDate) {
      throw new Error('Subscriber is missing an installed date')
    }

    return {
      invoice_number: formatInvoiceNumber(nextSequence + index),
      subscriber_id: subscriber.id,
      subscription_plan_id: subscriber.subscription_plan_id,
      plan_name: plan?.name ?? '',
      billing_period: input.billingPeriod,
      invoice_date: new Date().toISOString().slice(0, 10),
      service_period_start: servicePeriod.start,
      service_period_end: servicePeriod.end,
      due_date: dueDate,
      expiration_date: expirationDate,
      amount,
      paid_amount: 0,
      balance: amount,
      status: getInvoiceStatus({
        amount,
        paidAmount: 0,
        dueDate,
      }),
      notes: input.notes,
    }
  })

  const { data, error } = await supabase
    .from('billing_invoices')
    .insert(rows)
    .select(invoiceSelect)

  if (error) {
    throw new Error(`Unable to generate invoices: ${error.message}`)
  }

  const invoices = ((data ?? []) as BillingInvoiceRow[])
    .map(normalizeInvoice)
    .filter((invoice) => invoice.status !== 'Paid' && invoice.status !== 'Void')

  return {
    invoices,
    generated: (data ?? []).length,
    skippedExisting,
    skippedWithoutPlan,
    skippedWithoutInstallation,
    eligibleSubscribers: billableSubscribers.length,
  }
}

export async function voidBillingInvoice(invoiceId: string) {
  const supabase = await createClient()
  const { data: paymentRows, error: paymentError } = await supabase
    .from('billing_payments')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('status', 'Posted')
    .limit(1)

  if (paymentError) {
    throw new Error(`Unable to check invoice payments: ${paymentError.message}`)
  }

  if ((paymentRows ?? []).length > 0) {
    throw new Error('Invoices with posted payments cannot be voided')
  }

  const { data, error } = await supabase
    .from('billing_invoices')
    .update({
      status: 'Void',
      balance: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select(invoiceSelect)
    .single()

  if (error) {
    throw new Error(`Unable to void invoice: ${error.message}`)
  }

  return normalizeInvoice(data as BillingInvoiceRow)
}

export async function voidBillingInvoices(invoiceIds: string[]): Promise<BillingInvoiceVoidAllResult> {
  const uniqueInvoiceIds = Array.from(new Set(invoiceIds.filter(Boolean)))

  if (uniqueInvoiceIds.length === 0) {
    return {
      voidedIds: [],
      voided: 0,
      skippedWithPayments: 0,
      skippedUnavailable: 0,
    }
  }

  const supabase = await createClient()
  const [
    { data: paymentRows, error: paymentError },
    { data: invoiceRows, error: invoiceError },
  ] = await Promise.all([
    supabase
      .from('billing_payments')
      .select('invoice_id')
      .in('invoice_id', uniqueInvoiceIds)
      .eq('status', 'Posted'),
    supabase
      .from('billing_invoices')
      .select('id, paid_amount, status')
      .in('id', uniqueInvoiceIds),
  ])

  if (paymentError) {
    throw new Error(`Unable to check invoice payments: ${paymentError.message}`)
  }

  if (invoiceError) {
    throw new Error(`Unable to load invoices for voiding: ${invoiceError.message}`)
  }

  const invoiceIdsWithPayments = new Set(
    (paymentRows ?? []).map((payment) => payment.invoice_id as string),
  )
  const eligibleInvoiceIds = (invoiceRows ?? [])
    .filter((invoice) => {
      const invoiceId = invoice.id as string
      const paidAmount = currencyNumber(invoice.paid_amount as string | number)
      const status = invoice.status as BillingInvoiceStatus

      return !invoiceIdsWithPayments.has(invoiceId) && paidAmount === 0 && status !== 'Void'
    })
    .map((invoice) => invoice.id as string)

  if (eligibleInvoiceIds.length === 0) {
    return {
      voidedIds: [],
      voided: 0,
      skippedWithPayments: invoiceIdsWithPayments.size,
      skippedUnavailable: uniqueInvoiceIds.length - invoiceIdsWithPayments.size,
    }
  }

  const { data, error } = await supabase
    .from('billing_invoices')
    .update({
      status: 'Void',
      balance: 0,
      updated_at: new Date().toISOString(),
    })
    .in('id', eligibleInvoiceIds)
    .select('id')

  if (error) {
    throw new Error(`Unable to void invoices: ${error.message}`)
  }

  const voidedIds = (data ?? []).map((invoice) => invoice.id as string)

  return {
    voidedIds,
    voided: voidedIds.length,
    skippedWithPayments: invoiceIdsWithPayments.size,
    skippedUnavailable: uniqueInvoiceIds.length - invoiceIdsWithPayments.size - voidedIds.length,
  }
}

async function uploadPaymentReceipt(
  receiptPhoto: File | null | undefined,
  invoiceNumber: string,
) {
  if (!receiptPhoto || receiptPhoto.size === 0) return null

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(receiptPhoto.type)) {
    throw new Error('Receipt photo must be a JPEG, PNG, or WebP image')
  }

  const supabase = await createClient()
  const extension = safeFilePart(receiptPhoto.name.split('.').pop() ?? 'jpg')
  const path = `${safeFilePart(invoiceNumber)}/${randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('payment-receipts')
    .upload(path, receiptPhoto, {
      contentType: receiptPhoto.type || 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Unable to upload receipt photo: ${error.message}`)
  }

  return path
}

export async function createBillingPayment(input: BillingPaymentInput) {
  if (!input.invoiceId && !input.subscriberId) {
    throw new Error('Select a subscriber')
  }

  if (!input.invoiceId && !input.expirationDate) {
    throw new Error('Enter an expiration date')
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Enter a valid payment amount')
  }

  if (!input.paymentDate) {
    throw new Error('Enter a payment date')
  }

  const supabase = await createClient()
  let invoiceQuery = supabase
    .from('billing_invoices')
    .select(invoiceSelect)

  if (input.invoiceId) {
    invoiceQuery = invoiceQuery.eq('id', input.invoiceId)
  } else {
    invoiceQuery = invoiceQuery
      .eq('subscriber_id', input.subscriberId)
      .eq('expiration_date', input.expirationDate)
      .in('status', ['Unpaid', 'Partial', 'Overdue'])
      .order('expiration_date', { ascending: true })
      .limit(1)
  }

  const { data: invoiceData, error: invoiceError } = await invoiceQuery.single()

  if (invoiceError) {
    throw new Error(`Unable to find an open invoice for this expiration date: ${invoiceError.message}`)
  }

  const invoice = normalizeInvoice(invoiceData as BillingInvoiceRow)
  const expirationDate = input.expirationDate || invoice.expirationDateValue

  if (invoice.status === 'Paid' || invoice.status === 'Void') {
    throw new Error('Select an unpaid or partially paid billing item')
  }

  if (input.subscriberId && invoice.subscriberId !== input.subscriberId) {
    throw new Error('Selected subscriber does not match the billing item')
  }

  if (expirationDate !== invoice.expirationDateValue) {
    throw new Error('Expiration date must match an open billing period')
  }

  if (input.amount > invoice.balance) {
    throw new Error('Payment amount cannot exceed invoice balance')
  }

  const nextPaidAmount = invoice.paidAmount + input.amount
  const nextBalance = Math.max(invoice.amount - nextPaidAmount, 0)
  const nextStatus = getInvoiceStatus({
    amount: invoice.amount,
    paidAmount: nextPaidAmount,
    dueDate: invoice.dueDateValue,
  })
  const receiptPhotoPath = await uploadPaymentReceipt(input.receiptPhoto, invoice.invoiceNumber)

  const { data: paymentData, error: paymentError } = await supabase
    .from('billing_payments')
    .insert({
      invoice_id: invoice.id,
      subscriber_id: invoice.subscriberId,
      amount: input.amount,
      payment_date: input.paymentDate,
      paid_until: expirationDate,
      method: input.method,
      reference_number: input.referenceNumber || null,
      collector: input.collector,
      receipt_photo_path: receiptPhotoPath,
      notes: input.notes,
      status: 'Posted',
    })
    .select(paymentSelect)
    .single()

  if (paymentError) {
    throw new Error(`Unable to create payment: ${paymentError.message}`)
  }

  const { data: updatedInvoiceData, error: updateError } = await supabase
    .from('billing_invoices')
    .update({
      paid_amount: nextPaidAmount,
      balance: nextBalance,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id)
    .select(invoiceSelect)
    .single()

  if (updateError) {
    throw new Error(`Payment posted, but invoice balance could not be updated: ${updateError.message}`)
  }

  if (nextStatus === 'Paid') {
    await updateSubscriberBillingDates(invoice.subscriberId, {
      nextBillingDate: addDaysToDateValue(expirationDate, 1),
      dueDate: addMonthsToDateValue(invoice.dueDateValue, 1),
      expirationDate,
    })
  }

  return {
    payment: normalizePayment(paymentData as BillingPaymentRow),
    invoice: normalizeInvoice(updatedInvoiceData as BillingInvoiceRow),
  }
}

export async function deleteBillingPayment(paymentId: string) {
  if (!paymentId) {
    throw new Error('Select a payment')
  }

  const supabase = await createClient()
  const { data: paymentData, error: paymentError } = await supabase
    .from('billing_payments')
    .select(paymentSelect)
    .eq('id', paymentId)
    .single()

  if (paymentError) {
    throw new Error(`Unable to load payment: ${paymentError.message}`)
  }

  const payment = normalizePayment(paymentData as BillingPaymentRow)
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('billing_invoices')
    .select(invoiceSelect)
    .eq('id', payment.invoiceId)
    .single()

  if (invoiceError) {
    throw new Error(`Unable to load invoice: ${invoiceError.message}`)
  }

  const invoice = normalizeInvoice(invoiceData as BillingInvoiceRow)
  const { error: deleteError } = await supabase
    .from('billing_payments')
    .delete()
    .eq('id', paymentId)

  if (deleteError) {
    throw new Error(`Unable to delete payment: ${deleteError.message}`)
  }

  if (payment.receiptPhotoPath) {
    await supabase.storage.from('payment-receipts').remove([payment.receiptPhotoPath])
  }

  if (payment.status !== 'Posted' || invoice.status === 'Void') {
    return {
      payment,
      invoice,
    }
  }

  const nextPaidAmount = Math.max(invoice.paidAmount - payment.amount, 0)
  const nextBalance = Math.max(invoice.amount - nextPaidAmount, 0)
  const nextStatus = getInvoiceStatus({
    amount: invoice.amount,
    paidAmount: nextPaidAmount,
    dueDate: invoice.dueDateValue,
  })
  const { data: updatedInvoiceData, error: updateError } = await supabase
    .from('billing_invoices')
    .update({
      paid_amount: nextPaidAmount,
      balance: nextBalance,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.invoiceId)
    .select(invoiceSelect)
    .single()

  if (updateError) {
    throw new Error(`Payment deleted, but invoice balance could not be updated: ${updateError.message}`)
  }

  if (invoice.status === 'Paid') {
    const { data: latestPostedPayment, error: latestPaymentError } = await supabase
      .from('billing_payments')
      .select('paid_until')
      .eq('subscriber_id', invoice.subscriberId)
      .eq('status', 'Posted')
      .order('paid_until', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestPaymentError) {
      throw new Error(`Payment deleted, but subscriber billing dates could not be restored: ${latestPaymentError.message}`)
    }

    const previousExpirationDate = latestPostedPayment?.paid_until
      ? String(latestPostedPayment.paid_until)
      : addDaysToDateValue(invoice.servicePeriodStartValue, -1)
    const nextBillingDate = latestPostedPayment?.paid_until
      ? addDaysToDateValue(previousExpirationDate, 1)
      : invoice.servicePeriodStartValue

    await updateSubscriberBillingDates(invoice.subscriberId, {
      nextBillingDate,
      dueDate: latestPostedPayment?.paid_until ? getDefaultDueDate(nextBillingDate) : invoice.dueDateValue,
      expirationDate: previousExpirationDate,
    })
  }

  return {
    payment,
    invoice: normalizeInvoice(updatedInvoiceData as BillingInvoiceRow),
  }
}
