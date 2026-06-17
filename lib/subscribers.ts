import { randomUUID } from 'crypto'

import { createClient } from '@/lib/supabase/server'

import type {
  Subscriber,
  SubscriberBranchOption,
  SubscriberCategoryField,
  SubscriberModemOption,
  SubscriberPlanOption,
  SubscriberSubscriptionCategoryGroupOption,
  SubscriberSubscriptionCategoryOption,
} from '@/app/main/subscribers/_components/data-table/types'

type MaybeArray<T> = T | T[] | null

type SubscriberRow = {
  id: string
  account_number: string
  first_name: string
  last_name: string
  phone_number: string
  email: string | null
  city: string
  barangay: string
  street_zone: string | null
  branch_id: string | null
  contract_start: string | null
  contract_end: string | null
  subscription_category_id: string | null
  subscription_group_id: string | null
  subscription_plan_id: string | null
  mac_address: string | null
  caid: string | null
  connection_type: Subscriber['connectionType'] | null
  modem_id: string | null
  subscription_details: Record<string, string> | null
  contract_picture_path: string | null
  remarks: string | null
  status: Subscriber['status']
  created_at: string
  updated_at: string
  branches: MaybeArray<{
    id: string
    branch_code: string
    name: string
  }>
  subscription_plan_categories: MaybeArray<{
    id: string
    name: string
  }>
  subscription_plan_groups: MaybeArray<{
    id: string
    name: string
  }>
  subscription_plans: MaybeArray<{
    id: string
    plan_code: string
    name: string
    category_id: string | null
    group_id: string | null
  }>
  modems: MaybeArray<{
    id: string
    modem_code: string
    name: string
  }>
}

type CategoryFieldRow = {
  id: string
  category_id: string
  field_key: string
  label: string
  field_type: SubscriberCategoryField['type']
  placeholder: string | null
  is_required: boolean
  options: unknown
  sort_order: number
}

type CategoryOptionRow = {
  id: string
  name: string
  icon_data_url: string | null
}

type CategoryGroupRow = {
  id: string
  name: string
  subscription_plan_group_categories:
    | {
        category_id: string
      }[]
    | null
}

const subscriberSelect = `
  id,
  account_number,
  first_name,
  last_name,
  phone_number,
  email,
  city,
  barangay,
  street_zone,
  branch_id,
  contract_start,
  contract_end,
  subscription_category_id,
  subscription_group_id,
  subscription_plan_id,
  mac_address,
  caid,
  connection_type,
  modem_id,
  subscription_details,
  contract_picture_path,
  remarks,
  status,
  created_at,
  updated_at,
  branches (
    id,
    branch_code,
    name
  ),
  subscription_plan_categories (
    id,
    name
  ),
  subscription_plan_groups!subscribers_subscription_group_id_fkey (
    id,
    name
  ),
  subscription_plans (
    id,
    plan_code,
    name,
    category_id,
    group_id
  ),
  modems (
    id,
    modem_code,
    name
  )
`

const firstRecord = <T>(value: MaybeArray<T>) => (Array.isArray(value) ? value[0] : value)

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

const getNullableText = (formData: FormData, key: string) => {
  const value = getText(formData, key)
  return value ? value : null
}

const formatSubscriberDate = (value: string | null) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const safeFilePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'contract'

const parseJsonRecord = (value: string): Record<string, string> => {
  if (!value) return {}

  const parsed = JSON.parse(value) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  return Object.entries(parsed).reduce<Record<string, string>>((record, [key, rawValue]) => {
    if (typeof rawValue === 'string' && rawValue.trim()) {
      record[key] = rawValue.trim()
    }

    return record
  }, {})
}

const normalizeSubscriber = (subscriber: SubscriberRow): Subscriber => {
  const branch = firstRecord(subscriber.branches)
  const category = firstRecord(subscriber.subscription_plan_categories)
  const group = firstRecord(subscriber.subscription_plan_groups)
  const plan = firstRecord(subscriber.subscription_plans)
  const modem = firstRecord(subscriber.modems)
  const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim()

  return {
    id: subscriber.id,
    accountNumber: subscriber.account_number,
    firstName: subscriber.first_name,
    lastName: subscriber.last_name,
    name: fullName,
    phoneNumber: subscriber.phone_number,
    email: subscriber.email ?? '',
    city: subscriber.city,
    barangay: subscriber.barangay,
    streetZone: subscriber.street_zone ?? '',
    branchId: subscriber.branch_id,
    branch: branch?.name ?? '',
    contractStart: subscriber.contract_start ?? '',
    contractEnd: subscriber.contract_end ?? '',
    subscriptionCategoryId: subscriber.subscription_category_id,
    subscriptionGroupId: subscriber.subscription_group_id,
    subscriptionCategory: group?.name ?? category?.name ?? '',
    subscriptionPlanId: subscriber.subscription_plan_id,
    plan: plan?.name ?? '',
    macAddress: subscriber.mac_address ?? '',
    caid: subscriber.caid ?? '',
    connectionType: subscriber.connection_type,
    modemId: subscriber.modem_id,
    modemType: modem?.name ?? '',
    subscriptionDetails: subscriber.subscription_details ?? {},
    contractPicturePath: subscriber.contract_picture_path ?? '',
    remarks: subscriber.remarks ?? '',
    status: subscriber.status,
    updatedAt: formatSubscriberDate(subscriber.updated_at),
  }
}

const normalizeCategoryField = (field: CategoryFieldRow): SubscriberCategoryField => ({
  id: field.id,
  categoryId: field.category_id,
  key: field.field_key,
  label: field.label,
  type: field.field_type,
  placeholder: field.placeholder ?? '',
  required: field.is_required,
  options: Array.isArray(field.options)
    ? field.options.filter((option): option is string => typeof option === 'string')
    : [],
  sortOrder: field.sort_order,
})

const normalizeCategoryOption = (category: CategoryOptionRow): SubscriberSubscriptionCategoryOption => ({
  id: category.id,
  name: category.name,
  iconDataUrl: category.icon_data_url,
})

const normalizeCategoryGroup = (group: CategoryGroupRow): SubscriberSubscriptionCategoryGroupOption => ({
  id: group.id,
  name: group.name,
  categoryIds: (group.subscription_plan_group_categories ?? []).map((category) => category.category_id),
})

async function uploadContractPicture(
  formData: FormData,
  accountNumber: string,
) {
  const contractPicture = formData.get('contractPicture')

  if (
    !contractPicture ||
    typeof contractPicture !== 'object' ||
    !('size' in contractPicture) ||
    !('name' in contractPicture) ||
    !('type' in contractPicture) ||
    !('arrayBuffer' in contractPicture)
  ) {
    return null
  }

  const file = contractPicture as File

  if (file.size === 0) return null

  const supabase = await createClient()
  const extension = safeFilePart(file.name.split('.').pop() ?? 'jpg')
  const path = `${safeFilePart(accountNumber)}/${randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('subscriber-contracts')
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Unable to upload contract picture: ${error.message}`)
  }

  return path
}

export async function listSubscribers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscribers')
    .select(subscriberSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load subscribers: ${error.message}`)
  }

  return ((data ?? []) as SubscriberRow[]).map(normalizeSubscriber)
}

export async function getSubscriberDetailsPageData(accountNumber: string) {
  const supabase = await createClient()

  const [
    { data: subscriberRow, error: subscriberError },
    { data: categoryRows, error: categoryError },
    { data: fieldRows, error: fieldError },
  ] = await Promise.all([
    supabase
      .from('subscribers')
      .select(subscriberSelect)
      .eq('account_number', accountNumber)
      .maybeSingle(),
    supabase
      .from('subscription_plan_categories')
      .select('id, name, icon_data_url')
      .order('name', { ascending: true }),
    supabase
      .from('subscription_category_fields')
      .select('id, category_id, field_key, label, field_type, placeholder, is_required, options, sort_order')
      .order('sort_order', { ascending: true }),
  ])

  if (subscriberError) {
    throw new Error(`Unable to load subscriber: ${subscriberError.message}`)
  }

  if (categoryError) {
    throw new Error(`Unable to load subscription categories: ${categoryError.message}`)
  }

  if (fieldError) {
    throw new Error(`Unable to load subscription category fields: ${fieldError.message}`)
  }

  return {
    subscriber: subscriberRow ? normalizeSubscriber(subscriberRow as SubscriberRow) : null,
    categories: ((categoryRows ?? []) as CategoryOptionRow[]).map(normalizeCategoryOption),
    categoryFields: ((fieldRows ?? []) as CategoryFieldRow[]).map(normalizeCategoryField),
  }
}

export async function getSubscribersPageData() {
  const supabase = await createClient()

  const [
    { data: subscriberRows, error: subscriberError },
    { data: categoryRows, error: categoryError },
    { data: groupRows, error: groupError },
    { data: planRows, error: planError },
    { data: branchRows, error: branchError },
    { data: modemRows, error: modemError },
    { data: fieldRows, error: fieldError },
  ] = await Promise.all([
    supabase
      .from('subscribers')
      .select(subscriberSelect)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscription_plan_categories')
      .select('id, name, icon_data_url')
      .order('name', { ascending: true }),
    supabase
      .from('subscription_plan_groups')
      .select(
        `
        id,
        name,
        subscription_plan_group_categories (
          category_id
        )
      `,
      )
      .order('name', { ascending: true }),
    supabase
      .from('subscription_plans')
      .select('id, plan_code, name, category_id, group_id, status')
      .order('name', { ascending: true }),
    supabase
      .from('branches')
      .select('id, branch_code, name, status')
      .order('name', { ascending: true }),
    supabase
      .from('modems')
      .select('id, modem_code, name, status')
      .order('name', { ascending: true }),
    supabase
      .from('subscription_category_fields')
      .select('id, category_id, field_key, label, field_type, placeholder, is_required, options, sort_order')
      .order('sort_order', { ascending: true }),
  ])

  if (subscriberError) {
    throw new Error(`Unable to load subscribers: ${subscriberError.message}`)
  }

  if (categoryError) {
    throw new Error(`Unable to load subscription categories: ${categoryError.message}`)
  }

  if (groupError) {
    throw new Error(`Unable to load subscription category groups: ${groupError.message}`)
  }

  if (planError) {
    throw new Error(`Unable to load subscription plans: ${planError.message}`)
  }

  if (branchError) {
    throw new Error(`Unable to load branches: ${branchError.message}`)
  }

  if (modemError) {
    throw new Error(`Unable to load modems: ${modemError.message}`)
  }

  if (fieldError) {
    throw new Error(`Unable to load subscription category fields: ${fieldError.message}`)
  }

  return {
    subscribers: ((subscriberRows ?? []) as SubscriberRow[]).map(normalizeSubscriber),
    categories: ((categoryRows ?? []) as CategoryOptionRow[]).map(normalizeCategoryOption),
    categoryGroups: ((groupRows ?? []) as CategoryGroupRow[]).map(normalizeCategoryGroup),
    plans: (planRows ?? []).map((plan) => ({
      id: plan.id,
      code: plan.plan_code,
      name: plan.name,
      categoryId: plan.category_id,
      groupId: plan.group_id,
      status: plan.status,
    })) as SubscriberPlanOption[],
    branches: (branchRows ?? []).map((branch) => ({
      id: branch.id,
      code: branch.branch_code,
      name: branch.name,
      status: branch.status,
    })) as SubscriberBranchOption[],
    modems: (modemRows ?? []).map((modem) => ({
      id: modem.id,
      code: modem.modem_code,
      name: modem.name,
      status: modem.status,
    })) as SubscriberModemOption[],
    categoryFields: ((fieldRows ?? []) as CategoryFieldRow[]).map(normalizeCategoryField),
  }
}

export async function createSubscriber(formData: FormData) {
  const accountNumber = getText(formData, 'accountNumber')
  const firstName = getText(formData, 'firstName')
  const lastName = getText(formData, 'lastName')
  const phoneNumber = getText(formData, 'phoneNumber')
  const city = getText(formData, 'city')
  const barangay = getText(formData, 'barangay')
  const subscriptionDetails = parseJsonRecord(getText(formData, 'subscriptionDetails'))

  if (!accountNumber || !firstName || !lastName || !phoneNumber || !city || !barangay) {
    throw new Error('Account number, name, phone number, city, and barangay are required')
  }

  const contractPicturePath = await uploadContractPicture(formData, accountNumber)
  const proceedToInstallation = getText(formData, 'proceedToInstallation') === '1'
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscribers')
    .insert({
      account_number: accountNumber,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      email: getNullableText(formData, 'email'),
      city,
      barangay,
      street_zone: getNullableText(formData, 'streetZone'),
      branch_id: getNullableText(formData, 'branchId'),
      contract_start: getNullableText(formData, 'contractStart'),
      contract_end: getNullableText(formData, 'contractEnd'),
      subscription_category_id: getNullableText(formData, 'subscriptionCategoryId'),
      subscription_group_id: getNullableText(formData, 'subscriptionGroupId'),
      subscription_plan_id: getNullableText(formData, 'subscriptionPlanId'),
      mac_address: getNullableText(formData, 'macAddress'),
      caid: getNullableText(formData, 'caid'),
      connection_type: getNullableText(formData, 'connectionType'),
      modem_id: getNullableText(formData, 'modemId'),
      subscription_details: subscriptionDetails,
      contract_picture_path: contractPicturePath,
      remarks: getNullableText(formData, 'remarks'),
      status: 'Pending',
    })
    .select(subscriberSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create subscriber: ${error.message}`)
  }

  const subscriber = normalizeSubscriber(data as SubscriberRow)

  if (proceedToInstallation) {
    const { error: installationError } = await supabase
      .from('installations')
      .insert({
        subscriber_id: subscriber.id,
        status: 'Pending',
        notes: subscriber.remarks,
      })

    if (installationError) {
      throw new Error(`Subscriber created, but unable to create installation: ${installationError.message}`)
    }
  }

  return subscriber
}

export async function updateSubscriber(subscriberId: string, formData: FormData) {
  const accountNumber = getText(formData, 'accountNumber')
  const firstName = getText(formData, 'firstName')
  const lastName = getText(formData, 'lastName')
  const phoneNumber = getText(formData, 'phoneNumber')
  const city = getText(formData, 'city')
  const barangay = getText(formData, 'barangay')
  const subscriptionDetails = parseJsonRecord(getText(formData, 'subscriptionDetails'))

  if (!accountNumber || !firstName || !lastName || !phoneNumber || !city || !barangay) {
    throw new Error('Account number, name, phone number, city, and barangay are required')
  }

  const contractPicturePath = await uploadContractPicture(formData, accountNumber)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscribers')
    .update({
      account_number: accountNumber,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      email: getNullableText(formData, 'email'),
      city,
      barangay,
      street_zone: getNullableText(formData, 'streetZone'),
      branch_id: getNullableText(formData, 'branchId'),
      contract_start: getNullableText(formData, 'contractStart'),
      contract_end: getNullableText(formData, 'contractEnd'),
      subscription_category_id: getNullableText(formData, 'subscriptionCategoryId'),
      subscription_group_id: getNullableText(formData, 'subscriptionGroupId'),
      subscription_plan_id: getNullableText(formData, 'subscriptionPlanId'),
      mac_address: getNullableText(formData, 'macAddress'),
      caid: getNullableText(formData, 'caid'),
      connection_type: getNullableText(formData, 'connectionType'),
      modem_id: getNullableText(formData, 'modemId'),
      subscription_details: subscriptionDetails,
      ...(contractPicturePath ? { contract_picture_path: contractPicturePath } : {}),
      remarks: getNullableText(formData, 'remarks'),
    })
    .eq('id', subscriberId)
    .select(subscriberSelect)
    .single()

  if (error) {
    throw new Error(`Unable to update subscriber: ${error.message}`)
  }

  return normalizeSubscriber(data as SubscriberRow)
}

export async function deleteSubscriber(subscriberId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscribers').delete().eq('id', subscriberId)

  if (error) {
    throw new Error(`Unable to delete subscriber: ${error.message}`)
  }
}
