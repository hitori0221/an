import { createClient } from '@/lib/supabase/server'

import type {
  Installation,
  InstallationInput,
  InstallationStatus,
  InstallationSubscriberOption,
} from '@/app/main/installations/_components/data-table/types'

type MaybeArray<T> = T | T[] | null

type InstallationRow = {
  id: string
  subscriber_id: string
  technician: string
  crew: string
  schedule_date: string | null
  status: InstallationStatus
  materials: string
  notes: string
  updated_at: string
  subscribers: MaybeArray<{
    id: string
    account_number: string
    first_name: string
    last_name: string
    phone_number: string
    city: string
    barangay: string
    street_zone: string | null
    status: 'Active' | 'Inactive' | 'Pending'
    branches: MaybeArray<{
      name: string
    }>
    subscription_plans: MaybeArray<{
      name: string
    }>
  }>
}

type InstallableSubscriberRow = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  phone_number: string
  city: string
  barangay: string
  street_zone: string | null
  branches: MaybeArray<{
    name: string
  }>
  subscription_plans: MaybeArray<{
    name: string
  }>
}

const installationSelect = `
  id,
  subscriber_id,
  technician,
  crew,
  schedule_date,
  status,
  materials,
  notes,
  updated_at,
  subscribers (
    id,
    account_number,
    first_name,
    last_name,
    phone_number,
    city,
    barangay,
    street_zone,
    status,
    branches (
      name
    ),
    subscription_plans (
      name
    )
  )
`

const installableSubscriberSelect = `
  id,
  account_number,
  first_name,
  last_name,
  phone_number,
  city,
  barangay,
  street_zone,
  branches (
    name
  ),
  subscription_plans (
    name
  )
`

const firstRecord = <T>(value: MaybeArray<T>) => (Array.isArray(value) ? value[0] : value)

const formatInstallationDate = (value: string | null) => {
  if (!value) return 'Unscheduled'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const formatAddress = (subscriber: {
  street_zone: string | null
  barangay: string
  city: string
}) => [subscriber.street_zone, subscriber.barangay, subscriber.city].filter(Boolean).join(', ')

const normalizeInstallation = (installation: InstallationRow): Installation => {
  const subscriber = firstRecord(installation.subscribers)
  const branch = firstRecord(subscriber?.branches ?? null)
  const plan = firstRecord(subscriber?.subscription_plans ?? null)
  const name = subscriber ? `${subscriber.first_name} ${subscriber.last_name}`.trim() : 'Unknown subscriber'

  return {
    id: installation.id,
    subscriberId: installation.subscriber_id,
    accountNumber: subscriber?.account_number ?? '',
    name,
    plan: plan?.name ?? '',
    branch: branch?.name ?? '',
    city: subscriber?.city ?? '',
    barangay: subscriber?.barangay ?? '',
    technician: installation.technician,
    crew: installation.crew,
    scheduleDate: formatInstallationDate(installation.schedule_date),
    scheduleDateValue: installation.schedule_date ?? '',
    status: installation.status,
    phoneNumber: subscriber?.phone_number ?? '',
    address: subscriber ? formatAddress(subscriber) : '',
    materials: installation.materials,
    notes: installation.notes,
    updatedAt: formatInstallationDate(installation.updated_at),
  }
}

const normalizeInstallableSubscriber = (
  subscriber: InstallableSubscriberRow,
): InstallationSubscriberOption => {
  const branch = firstRecord(subscriber.branches)
  const plan = firstRecord(subscriber.subscription_plans)
  const name = `${subscriber.first_name} ${subscriber.last_name}`.trim()

  return {
    id: subscriber.id,
    accountNumber: subscriber.account_number,
    name,
    phoneNumber: subscriber.phone_number,
    plan: plan?.name ?? '',
    branch: branch?.name ?? '',
    city: subscriber.city,
    barangay: subscriber.barangay,
    address: formatAddress(subscriber),
  }
}

async function listInstallableSubscribers() {
  const supabase = await createClient()
  const [
    { data: subscriberRows, error: subscriberError },
    { data: installationRows, error: installationError },
  ] = await Promise.all([
    supabase
      .from('subscribers')
      .select(installableSubscriberSelect)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('installations')
      .select('subscriber_id, status')
      .neq('status', 'Cancelled'),
  ])

  if (subscriberError) {
    throw new Error(`Unable to load subscribers for installation: ${subscriberError.message}`)
  }

  if (installationError) {
    throw new Error(`Unable to load existing installations: ${installationError.message}`)
  }

  const subscriberIdsWithOpenInstallation = new Set(
    (installationRows ?? []).map((installation) => installation.subscriber_id as string),
  )

  return ((subscriberRows ?? []) as InstallableSubscriberRow[])
    .filter((subscriber) => !subscriberIdsWithOpenInstallation.has(subscriber.id))
    .map(normalizeInstallableSubscriber)
}

export async function listInstallations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('installations')
    .select(installationSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load installations: ${error.message}`)
  }

  return ((data ?? []) as InstallationRow[]).map(normalizeInstallation)
}

export async function getInstallationsPageData() {
  const [installations, installableSubscribers] = await Promise.all([
    listInstallations(),
    listInstallableSubscribers(),
  ])

  return {
    installations,
    installableSubscribers,
  }
}

export async function createInstallation(input: InstallationInput) {
  if (!input.subscriberId) {
    throw new Error('Select a subscriber to install')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('installations')
    .insert({
      subscriber_id: input.subscriberId,
      technician: input.technician,
      crew: input.crew,
      schedule_date: input.scheduleDate || null,
      status: input.status,
      materials: input.materials,
      notes: input.notes,
    })
    .select(installationSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create installation: ${error.message}`)
  }

  await syncSubscriberInstallationStatus(input.subscriberId, input.status)

  return normalizeInstallation(data as InstallationRow)
}

export async function updateInstallation(installationId: string, input: InstallationInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('installations')
    .update({
      technician: input.technician,
      crew: input.crew,
      schedule_date: input.scheduleDate || null,
      status: input.status,
      materials: input.materials,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', installationId)
    .select(installationSelect)
    .single()

  if (error) {
    throw new Error(`Unable to update installation: ${error.message}`)
  }

  const installation = normalizeInstallation(data as InstallationRow)
  await syncSubscriberInstallationStatus(installation.subscriberId, input.status)

  return installation
}

export async function deleteInstallation(installationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('installations')
    .delete()
    .eq('id', installationId)
    .select('subscriber_id')
    .single()

  if (error) {
    throw new Error(`Unable to delete installation: ${error.message}`)
  }

  if (data?.subscriber_id) {
    await syncSubscriberInstallationStatus(data.subscriber_id as string, 'Pending')
  }
}

async function syncSubscriberInstallationStatus(
  subscriberId: string,
  installationStatus: InstallationStatus,
) {
  const supabase = await createClient()
  const nextSubscriberStatus = installationStatus === 'Installed' ? 'Active' : 'Pending'
  const { error } = await supabase
    .from('subscribers')
    .update({
      status: nextSubscriberStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriberId)

  if (error) {
    throw new Error(`Unable to update subscriber installation status: ${error.message}`)
  }
}
