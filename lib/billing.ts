import { randomUUID } from 'crypto'

import { createClient } from '@/lib/supabase/server'

import type {
  BillingCollectionSummary,
  BillingExpirationAccount,
  BillingPayment,
  BillingPaymentInput,
  BillingPaymentMethod,
  BillingPaymentStatus,
  BillingSubscriberOption,
  BillingSubscriptionStatus,
} from '@/app/main/billing/_components/data-table/types'

type MaybeArray<T> = T | T[] | null

type BillingPaymentRow = {
  id: string
  subscriber_id: string
  amount: number | string
  payment_date: string
  expires: string
  method: BillingPaymentMethod
  reference_number: string | null
  collector: string
  receipt_photo_path: string | null
  notes: string
  status: BillingPaymentStatus
  created_at: string
  subscribers: MaybeArray<{
    account_number: string
    first_name: string
    last_name: string
    branch_id: string | null
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
  contract_start: string | null
  created_at: string
  subscription_plan_id: string | null
  branch_id: string | null
  subscription_plans: MaybeArray<{
    id: string
    name: string
    price: number | string
  }>
  billing_payments: MaybeArray<{
    expires: string
    status: BillingPaymentStatus
    created_at: string
  }>
}

const paymentSelect = `
  id,
  subscriber_id,
  amount,
  payment_date,
  expires,
  method,
  reference_number,
  collector,
  receipt_photo_path,
  notes,
  status,
  created_at,
  subscribers (
    account_number,
    first_name,
    last_name,
    branch_id
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
  contract_start,
  created_at,
  subscription_plan_id,
  branch_id,
  subscription_plans (
    id,
    name,
    price
  ),
  billing_payments (
    expires,
    status,
    created_at
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

const normalizePayment = (payment: BillingPaymentRow): BillingPayment => {
  const subscriber = firstRecord(payment.subscribers)

  return {
    id: payment.id,
    subscriberId: payment.subscriber_id,
    accountNumber: subscriber?.account_number ?? '',
    subscriberName: formatName(subscriber),
    amount: currencyNumber(payment.amount),
    paymentDate: formatDate(payment.payment_date),
    paymentDateValue: payment.payment_date,
    expirationDate: formatDate(payment.expires),
    expirationDateValue: payment.expires,
    method: payment.method,
    referenceNumber: payment.reference_number ?? '',
    collector: payment.collector,
    receiptPhotoPath: payment.receipt_photo_path ?? '',
    notes: payment.notes,
    status: payment.status,
    createdAt: formatDate(payment.created_at),
    branchId: subscriber?.branch_id ?? null,
  }
}

const normalizeSubscriberOption = (
  subscriber: BillingSubscriberRow,
): BillingSubscriberOption => {
  const plan = firstRecord(subscriber.subscription_plans)
  const latestPayment = (Array.isArray(subscriber.billing_payments)
    ? subscriber.billing_payments
    : subscriber.billing_payments
      ? [subscriber.billing_payments]
      : [])
    .filter((payment) => payment.status === 'Posted')
    .sort((first, second) =>
      second.expires.localeCompare(first.expires) || second.created_at.localeCompare(first.created_at),
    )[0]
  const expirationDateValue = latestPayment?.expires ?? ''
  const billingStatus: BillingSubscriptionStatus = expirationDateValue && expirationDateValue < getTodayDateValue()
    ? 'Expired'
    : 'Active'

  return {
    id: subscriber.id,
    accountNumber: subscriber.account_number,
    name: `${subscriber.first_name} ${subscriber.last_name}`.trim(),
    phoneNumber: subscriber.phone_number,
    planId: subscriber.subscription_plan_id,
    plan: plan?.name ?? '',
    planPrice: plan ? currencyNumber(plan.price) : 0,
    address: formatAddress(subscriber),
    expirationDate: formatDate(expirationDateValue),
    expirationDateValue,
    billingStatus,
    branchId: subscriber.branch_id,
  }
}

export async function listBillingSubscribers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscribers')
    .select(billingSubscriberSelect)
    .eq('status', 'Active')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load billing subscribers: ${error.message}`)
  }

  return ((data ?? []) as BillingSubscriberRow[]).map(normalizeSubscriberOption)
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

export async function getPaymentsPageData() {
  const [payments, subscribers] = await Promise.all([
    listBillingPayments(),
    listBillingSubscribers(),
  ])

  return {
    payments,
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

export async function getExpirationsPageData() {
  const [payments, subscribers] = await Promise.all([
    listBillingPayments(),
    listBillingSubscribers(),
  ])
  const latestPostedPayments = payments
    .filter((payment) => payment.status === 'Posted')
    .reduce<Map<string, BillingPayment>>((paymentMap, payment) => {
      const current = paymentMap.get(payment.subscriberId)

      if (!current || payment.expirationDateValue > current.expirationDateValue) {
        paymentMap.set(payment.subscriberId, payment)
      }

      return paymentMap
    }, new Map())
  const today = parseDateValue(getTodayDateValue()).getTime()
  const dayInMs = 24 * 60 * 60 * 1000
  const accounts = subscribers
    .reduce<BillingExpirationAccount[]>((accountList, subscriber) => {
      const payment = latestPostedPayments.get(subscriber.id)

      if (!payment) return accountList

      const remainingDays = Math.ceil((parseDateValue(payment.expirationDateValue).getTime() - today) / dayInMs)

      accountList.push({
        id: subscriber.id,
        accountNumber: subscriber.accountNumber,
        subscriberName: subscriber.name,
        phoneNumber: subscriber.phoneNumber,
        plan: subscriber.plan,
        expirationDate: payment.expirationDate,
        expirationDateValue: payment.expirationDateValue,
        remainingDays,
        billingStatus: remainingDays < 0 ? 'Expired' : 'Active',
        branchId: subscriber.branchId,
      })

      return accountList
    }, [])
    .sort((first, second) => first.remainingDays - second.remainingDays)

  return {
    accounts,
    subscribers,
  }
}

async function uploadPaymentReceipt(
  receiptPhoto: File | null | undefined,
  paymentFolderKey: string,
) {
  if (!receiptPhoto || receiptPhoto.size === 0) return null

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(receiptPhoto.type)) {
    throw new Error('Receipt photo must be a JPEG, PNG, or WebP image')
  }

  const supabase = await createClient()
  const extension = safeFilePart(receiptPhoto.name.split('.').pop() ?? 'jpg')
  const path = `${safeFilePart(paymentFolderKey)}/${randomUUID()}.${extension}`
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
  if (!input.subscriberId) {
    throw new Error('Select a subscriber')
  }

  if (!input.expirationDate) {
    throw new Error('Enter an expiration date')
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Enter a valid payment amount')
  }

  if (!input.paymentDate) {
    throw new Error('Enter a payment date')
  }

  const supabase = await createClient()
  const { data: subscriberData, error: subscriberError } = await supabase
    .from('subscribers')
    .select('id, account_number')
    .eq('id', input.subscriberId)
    .single()

  if (subscriberError) {
    throw new Error(`Unable to load subscriber for payment: ${subscriberError.message}`)
  }

  const receiptPhotoPath = await uploadPaymentReceipt(
    input.receiptPhoto,
    `payment-${String(subscriberData.account_number)}`,
  )

  const { data: paymentData, error: paymentError } = await supabase
    .from('billing_payments')
    .insert({
      subscriber_id: input.subscriberId,
      amount: input.amount,
      payment_date: input.paymentDate,
      expires: input.expirationDate,
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

  return {
    payment: normalizePayment(paymentData as BillingPaymentRow),
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
  const { data: deletedPayment, error: deleteError } = await supabase
    .from('billing_payments')
    .delete()
    .eq('id', paymentId)
    .select('id')
    .single()

  if (deleteError) {
    throw new Error(`Unable to delete payment: ${deleteError.message}`)
  }

  if (!deletedPayment) {
    throw new Error('Unable to delete payment: payment was not deleted')
  }

  if (payment.receiptPhotoPath) {
    await supabase.storage.from('payment-receipts').remove([payment.receiptPhotoPath])
  }

  return {
    payment,
  }
}
