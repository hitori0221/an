import { createClient } from '@/lib/supabase/server'
import { buildSubscriptionPlanCode } from '@/lib/subscription-plan-code'

import type {
  PlanStatus,
  SubscriptionCategoryField,
  SubscriptionCategoryFieldType,
  SubscriptionPlan,
  SubscriptionPlanCategoryIcon,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from '@/app/main/subscription-plans/_components/data-table/types'

type CategoryRow = {
  id: string
  name: string
  description: string | null
  icon_data_url: string | null
  created_at?: string
  updated_at?: string
}

type CategoryInput = {
  name: string
  iconDataUrl?: string | null
}

export type ServiceRequestCategory = {
  id: string
  name: string
  iconDataUrl?: string | null
  pendingCount: number
}

type SubscriptionPlanRow = {
  id: string
  category_id: string | null
  group_id: string | null
  plan_code: string
  name: string
  billing_type: SubscriptionPlan['billingType']
  speed: string
  channels: string
  price: number | string
  subscribers: number
  status: PlanStatus
  updated_at: string
  subscription_plan_categories:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
    | null
  subscription_plan_groups:
    | {
        id: string
        name: string
      }
    | {
        id: string
        name: string
      }[]
    | null
}

type SubscriberPlanCountRow = {
  subscription_plan_id: string | null
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

type CategoryFieldRow = {
  id: string
  category_id: string
  field_key: string
  label: string
  field_type: SubscriptionCategoryFieldType
  placeholder: string | null
  is_required: boolean
  options: unknown
  sort_order: number
}

type CategoryFieldInput = {
  label: string
  type: SubscriptionCategoryFieldType
  placeholder?: string | null
  required?: boolean
  options?: string[]
  sortOrder?: number
}

const formatPlanDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const normalizeCategory = (category: CategoryRow): SubscriptionPlanCategory => ({
  id: category.id,
  name: category.name,
  description: category.description,
  iconDataUrl: category.icon_data_url,
})

const normalizeCategoryIconDataUrl = (value: string | null | undefined) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) return null

  if (!/^data:image\/(jpeg|png|webp);base64,/i.test(trimmedValue)) {
    throw new Error('Category icon must be a JPEG, PNG, or WebP data URL')
  }

  if (trimmedValue.length > 131072) {
    throw new Error('Category icon is too large to store in the database')
  }

  return trimmedValue
}

const toFieldKey = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || `field_${Date.now()}`

const buildCategoryIconMaps = (
  categories: SubscriptionPlanCategory[],
  groups: SubscriptionPlanCategoryGroup[],
) => {
  const categoryIconById = new Map<string, SubscriptionPlanCategoryIcon>(
    categories.map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        iconDataUrl: category.iconDataUrl ?? null,
      },
    ]),
  )
  const groupCategoryIconsById = new Map<string, SubscriptionPlanCategoryIcon[]>(
    groups.map((group) => [
      group.id,
      group.categoryIds
        .map((categoryId) => categoryIconById.get(categoryId))
        .filter((category): category is SubscriptionPlanCategoryIcon => Boolean(category)),
    ]),
  )

  return {
    categoryIconById,
    groupCategoryIconsById,
  }
}

const normalizePlan = (
  plan: SubscriptionPlanRow,
  subscriberCountByPlanId = new Map<string, number>(),
  categoryIconById = new Map<string, SubscriptionPlanCategoryIcon>(),
  groupCategoryIconsById = new Map<string, SubscriptionPlanCategoryIcon[]>(),
): SubscriptionPlan => {
  const category = Array.isArray(plan.subscription_plan_categories)
    ? plan.subscription_plan_categories[0]
    : plan.subscription_plan_categories
  const group = Array.isArray(plan.subscription_plan_groups)
    ? plan.subscription_plan_groups[0]
    : plan.subscription_plan_groups
  const planTarget = group ?? category
  const categoryIcons = group?.id
    ? groupCategoryIconsById.get(group.id) ?? []
    : category?.id
      ? [
          categoryIconById.get(category.id) ?? {
            id: category.id,
            name: category.name,
            iconDataUrl: null,
          },
        ]
      : []

  return {
    id: plan.id,
    code: plan.plan_code,
    name: plan.name,
    categoryId: category?.id ?? null,
    groupId: group?.id ?? null,
    categoryType: group ? 'group' : 'category',
    category: planTarget?.name ?? 'Uncategorized',
    categoryIcons,
    billingType: plan.billing_type,
    speed: plan.speed,
    channels: plan.channels,
    price: Number(plan.price),
    subscribers: subscriberCountByPlanId.get(plan.id) ?? 0,
    status: plan.status,
    updatedAt: formatPlanDate(plan.updated_at),
  }
}

const buildSubscriberCountByPlanId = (subscribers: SubscriberPlanCountRow[] | null) =>
  (subscribers ?? []).reduce((counts, subscriber) => {
    if (!subscriber.subscription_plan_id) return counts

    counts.set(
      subscriber.subscription_plan_id,
      (counts.get(subscriber.subscription_plan_id) ?? 0) + 1,
    )

    return counts
  }, new Map<string, number>())

const getSubscriberCountByPlanId = async (planId: string) => {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_plan_id', planId)

  if (error) {
    throw new Error(`Unable to load subscription plan subscriber count: ${error.message}`)
  }

  return new Map([[planId, count ?? 0]])
}

const normalizeCategoryGroup = (group: CategoryGroupRow): SubscriptionPlanCategoryGroup => ({
  id: group.id,
  name: group.name,
  categoryIds: (group.subscription_plan_group_categories ?? []).map(
    (category) => category.category_id,
  ),
})

const normalizeCategoryField = (field: CategoryFieldRow): SubscriptionCategoryField => ({
  id: field.id,
  categoryId: field.category_id,
  key: field.field_key,
  label: field.label,
  type: field.field_type,
  placeholder: field.placeholder,
  required: field.is_required,
  options: Array.isArray(field.options)
    ? field.options.filter((option): option is string => typeof option === 'string')
    : [],
  sortOrder: field.sort_order,
})

export async function getSubscriptionPlansPageData() {
  const supabase = await createClient()

  const [
    { data: categoryRows, error: categoryError },
    { data: groupRows, error: groupError },
    { data: planRows, error: planError },
    { data: fieldRows, error: fieldError },
    { data: subscriberRows, error: subscriberError },
  ] = await Promise.all([
      supabase
        .from('subscription_plan_categories')
        .select('id, name, description, icon_data_url')
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
        .select(
          `
          id,
          category_id,
          group_id,
          plan_code,
          name,
          billing_type,
          speed,
          channels,
          price,
          subscribers,
          status,
          updated_at,
          subscription_plan_categories (
            id,
            name
          ),
          subscription_plan_groups (
            id,
            name
          )
        `,
        )
        .order('created_at', { ascending: true }),
      supabase
        .from('subscription_category_fields')
        .select('id, category_id, field_key, label, field_type, placeholder, is_required, options, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('subscribers')
        .select('subscription_plan_id')
        .not('subscription_plan_id', 'is', null),
    ])

  if (categoryError) {
    throw new Error(`Unable to load subscription plan categories: ${categoryError.message}`)
  }

  if (planError) {
    throw new Error(`Unable to load subscription plans: ${planError.message}`)
  }

  if (groupError) {
    throw new Error(`Unable to load subscription plan category groups: ${groupError.message}`)
  }

  if (fieldError) {
    throw new Error(`Unable to load subscription category fields: ${fieldError.message}`)
  }

  if (subscriberError) {
    throw new Error(`Unable to load subscription plan subscriber counts: ${subscriberError.message}`)
  }

  const categories = (categoryRows ?? []).map(normalizeCategory)
  const groups = ((groupRows ?? []) as CategoryGroupRow[]).map(normalizeCategoryGroup)
  const { categoryIconById, groupCategoryIconsById } = buildCategoryIconMaps(categories, groups)
  const subscriberCountByPlanId = buildSubscriberCountByPlanId(
    (subscriberRows ?? []) as SubscriberPlanCountRow[],
  )

  return {
    categories,
    groups,
    plans: ((planRows ?? []) as SubscriptionPlanRow[]).map((plan) =>
      normalizePlan(plan, subscriberCountByPlanId, categoryIconById, groupCategoryIconsById),
    ),
    fields: ((fieldRows ?? []) as CategoryFieldRow[]).map(normalizeCategoryField),
  }
}

export async function listSubscriptionPlanCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .select('id, name, description, icon_data_url')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Unable to load subscription plan categories: ${error.message}`)
  }

  return (data ?? []).map(normalizeCategory)
}

export async function listServiceRequestCategories(): Promise<ServiceRequestCategory[]> {
  const supabase = await createClient()
  const [
    { data: categoryRows, error: categoryError },
    { data: requestRows, error: requestError },
  ] = await Promise.all([
    supabase
      .from('subscription_plan_categories')
      .select('id, name, description, icon_data_url')
      .order('name', { ascending: true }),
    supabase
      .from('service_requests')
      .select('category_id')
      .eq('status', 'Pending'),
  ])

  if (categoryError) {
    throw new Error(`Unable to load service request categories: ${categoryError.message}`)
  }

  if (requestError) {
    throw new Error(`Unable to load service request category counts: ${requestError.message}`)
  }

  const pendingCountByCategoryId = (requestRows ?? []).reduce<Record<string, number>>((counts, request) => {
    counts[request.category_id] = (counts[request.category_id] ?? 0) + 1

    return counts
  }, {})

  return (categoryRows ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    iconDataUrl: category.icon_data_url,
    pendingCount: pendingCountByCategoryId[category.id] ?? 0,
  }))
}

export async function createSubscriptionPlanCategory(input: CategoryInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .insert({
      name: input.name.trim(),
      icon_data_url: normalizeCategoryIconDataUrl(input.iconDataUrl),
    })
    .select('id, name, description, icon_data_url')
    .single()

  if (error) {
    throw new Error(`Unable to create subscription plan category: ${error.message}`)
  }

  return normalizeCategory(data)
}

export async function updateSubscriptionPlanCategory(categoryId: string, input: CategoryInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .update({
      name: input.name.trim(),
      icon_data_url: normalizeCategoryIconDataUrl(input.iconDataUrl),
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .select('id, name, description, icon_data_url')
    .single()

  if (error) {
    throw new Error(`Unable to rename subscription plan category: ${error.message}`)
  }

  return normalizeCategory(data)
}

export async function deleteSubscriptionPlanCategory(categoryId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscription_plan_categories').delete().eq('id', categoryId)

  if (error) {
    throw new Error(`Unable to delete subscription plan category: ${error.message}`)
  }
}

export async function createSubscriptionCategoryField(
  categoryId: string,
  input: CategoryFieldInput,
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_category_fields')
    .insert({
      category_id: categoryId,
      field_key: toFieldKey(input.label),
      label: input.label.trim(),
      field_type: input.type,
      placeholder: input.placeholder?.trim() || null,
      is_required: input.required ?? false,
      options: input.options ?? [],
      sort_order: input.sortOrder ?? 0,
    })
    .select('id, category_id, field_key, label, field_type, placeholder, is_required, options, sort_order')
    .single()

  if (error) {
    throw new Error(`Unable to create subscription category field: ${error.message}`)
  }

  return normalizeCategoryField(data as CategoryFieldRow)
}

export async function updateSubscriptionCategoryField(
  fieldId: string,
  input: CategoryFieldInput,
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_category_fields')
    .update({
      label: input.label.trim(),
      field_type: input.type,
      placeholder: input.placeholder?.trim() || null,
      is_required: input.required ?? false,
      options: input.options ?? [],
      sort_order: input.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fieldId)
    .select('id, category_id, field_key, label, field_type, placeholder, is_required, options, sort_order')
    .single()

  if (error) {
    throw new Error(`Unable to update subscription category field: ${error.message}`)
  }

  return normalizeCategoryField(data as CategoryFieldRow)
}

export async function deleteSubscriptionCategoryField(fieldId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscription_category_fields').delete().eq('id', fieldId)

  if (error) {
    throw new Error(`Unable to delete subscription category field: ${error.message}`)
  }
}

export async function listSubscriptionPlanCategoryGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
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
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Unable to load subscription plan category groups: ${error.message}`)
  }

  return ((data ?? []) as CategoryGroupRow[]).map(normalizeCategoryGroup)
}

export async function createSubscriptionPlanCategoryGroup(name: string, categoryIds: string[]) {
  const supabase = await createClient()
  const { data: group, error: groupError } = await supabase
    .from('subscription_plan_groups')
    .insert({ name })
    .select('id, name')
    .single()

  if (groupError) {
    throw new Error(`Unable to create subscription plan category group: ${groupError.message}`)
  }

  if (categoryIds.length > 0) {
    const { error: categoriesError } = await supabase
      .from('subscription_plan_group_categories')
      .insert(categoryIds.map((categoryId) => ({ group_id: group.id, category_id: categoryId })))

    if (categoriesError) {
      await supabase.from('subscription_plan_groups').delete().eq('id', group.id)
      throw new Error(`Unable to assign subscription plan category group: ${categoriesError.message}`)
    }
  }

  return {
    id: group.id,
    name: group.name,
    categoryIds,
  }
}

export async function updateSubscriptionPlanCategoryGroup(
  groupId: string,
  name: string,
  categoryIds: string[],
) {
  const supabase = await createClient()
  const { data: group, error: groupError } = await supabase
    .from('subscription_plan_groups')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', groupId)
    .select('id, name')
    .single()

  if (groupError) {
    throw new Error(`Unable to rename subscription plan category group: ${groupError.message}`)
  }

  const { error: deleteError } = await supabase
    .from('subscription_plan_group_categories')
    .delete()
    .eq('group_id', groupId)

  if (deleteError) {
    throw new Error(`Unable to update subscription plan category group categories: ${deleteError.message}`)
  }

  if (categoryIds.length > 0) {
    const { error: insertError } = await supabase
      .from('subscription_plan_group_categories')
      .insert(categoryIds.map((categoryId) => ({ group_id: groupId, category_id: categoryId })))

    if (insertError) {
      throw new Error(`Unable to update subscription plan category group categories: ${insertError.message}`)
    }
  }

  return {
    id: group.id,
    name: group.name,
    categoryIds,
  }
}

export async function deleteSubscriptionPlanCategoryGroup(groupId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscription_plan_groups').delete().eq('id', groupId)

  if (error) {
    throw new Error(`Unable to delete subscription plan category group: ${error.message}`)
  }
}

export async function listSubscriptionPlans() {
  const supabase = await createClient()
  const [
    { data: categoryRows, error: categoryError },
    { data: groupRows, error: groupError },
    { data, error },
    { data: subscriberRows, error: subscriberError },
  ] = await Promise.all([
    supabase
      .from('subscription_plan_categories')
      .select('id, name, description, icon_data_url')
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
      .select(
        `
        id,
        category_id,
        group_id,
        plan_code,
        name,
        billing_type,
        speed,
        channels,
        price,
        subscribers,
        status,
        updated_at,
        subscription_plan_categories (
          id,
          name
        ),
        subscription_plan_groups (
          id,
          name
        )
      `,
      )
      .order('created_at', { ascending: true }),
    supabase
      .from('subscribers')
      .select('subscription_plan_id')
      .not('subscription_plan_id', 'is', null),
  ])

  if (categoryError) {
    throw new Error(`Unable to load subscription plan categories: ${categoryError.message}`)
  }

  if (groupError) {
    throw new Error(`Unable to load subscription plan category groups: ${groupError.message}`)
  }

  if (error) {
    throw new Error(`Unable to load subscription plans: ${error.message}`)
  }

  if (subscriberError) {
    throw new Error(`Unable to load subscription plan subscriber counts: ${subscriberError.message}`)
  }

  const categories = (categoryRows ?? []).map(normalizeCategory)
  const groups = ((groupRows ?? []) as CategoryGroupRow[]).map(normalizeCategoryGroup)
  const { categoryIconById, groupCategoryIconsById } = buildCategoryIconMaps(categories, groups)
  const subscriberCountByPlanId = buildSubscriberCountByPlanId(
    (subscriberRows ?? []) as SubscriberPlanCountRow[],
  )

  return ((data ?? []) as SubscriptionPlanRow[]).map((plan) =>
    normalizePlan(plan, subscriberCountByPlanId, categoryIconById, groupCategoryIconsById),
  )
}

export async function createSubscriptionPlan(input: SubscriptionPlan) {
  const supabase = await createClient()
  const planCode = (input.code.trim() || buildSubscriptionPlanCode({
    name: input.name,
    targetName: input.category,
    speed: input.speed,
    price: input.price,
  })).toUpperCase()

  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      plan_code: planCode,
      name: input.name,
      category_id: input.categoryType === 'group' ? null : input.categoryId,
      group_id: input.categoryType === 'group' ? input.groupId : null,
      billing_type: input.billingType,
      speed: input.speed,
      channels: input.channels,
      price: input.price,
      status: input.status,
    })
    .select(
      `
      id,
      category_id,
      group_id,
      plan_code,
      name,
      billing_type,
      speed,
      channels,
      price,
      subscribers,
      status,
      updated_at,
      subscription_plan_categories (
        id,
        name
      ),
      subscription_plan_groups (
        id,
        name
      )
    `,
    )
    .single()

  if (error) {
    throw new Error(`Unable to create subscription plan: ${error.message}`)
  }

  const subscriberCountByPlanId = await getSubscriberCountByPlanId(data.id)

  return normalizePlan(data as SubscriptionPlanRow, subscriberCountByPlanId)
}

export async function updateSubscriptionPlan(input: SubscriptionPlan) {
  const supabase = await createClient()
  const planCode = (input.code.trim() || buildSubscriptionPlanCode({
    name: input.name,
    targetName: input.category,
    speed: input.speed,
    price: input.price,
  })).toUpperCase()

  const { data, error } = await supabase
    .from('subscription_plans')
    .update({
      plan_code: planCode,
      name: input.name,
      category_id: input.categoryType === 'group' ? null : input.categoryId,
      group_id: input.categoryType === 'group' ? input.groupId : null,
      billing_type: input.billingType,
      speed: input.speed,
      channels: input.channels,
      price: input.price,
      status: input.status,
    })
    .eq('id', input.id)
    .select(
      `
      id,
      category_id,
      group_id,
      plan_code,
      name,
      billing_type,
      speed,
      channels,
      price,
      subscribers,
      status,
      updated_at,
      subscription_plan_categories (
        id,
        name
      ),
      subscription_plan_groups (
        id,
        name
      )
    `,
    )
    .single()

  if (error) {
    throw new Error(`Unable to update subscription plan: ${error.message}`)
  }

  const subscriberCountByPlanId = await getSubscriberCountByPlanId(data.id)

  return normalizePlan(data as SubscriptionPlanRow, subscriberCountByPlanId)
}

export async function deleteSubscriptionPlan(planId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscription_plans').delete().eq('id', planId)

  if (error) {
    throw new Error(`Unable to delete subscription plan: ${error.message}`)
  }
}
