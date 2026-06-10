import { createClient } from '@/lib/supabase/server'

import type {
  PlanStatus,
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from '@/app/main/subscription-plans/_components/data-table/types'

type CategoryRow = {
  id: string
  name: string
  description: string | null
  created_at?: string
  updated_at?: string
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

type CategoryGroupRow = {
  id: string
  name: string
  subscription_plan_group_categories:
    | {
        category_id: string
      }[]
    | null
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
})

const normalizePlan = (plan: SubscriptionPlanRow): SubscriptionPlan => {
  const category = Array.isArray(plan.subscription_plan_categories)
    ? plan.subscription_plan_categories[0]
    : plan.subscription_plan_categories
  const group = Array.isArray(plan.subscription_plan_groups)
    ? plan.subscription_plan_groups[0]
    : plan.subscription_plan_groups
  const planTarget = group ?? category

  return {
    id: plan.id,
    code: plan.plan_code,
    name: plan.name,
    categoryId: category?.id ?? null,
    groupId: group?.id ?? null,
    categoryType: group ? 'group' : 'category',
    category: planTarget?.name ?? 'Uncategorized',
    billingType: plan.billing_type,
    speed: plan.speed,
    channels: plan.channels,
    price: Number(plan.price),
    subscribers: plan.subscribers,
    status: plan.status,
    updatedAt: formatPlanDate(plan.updated_at),
  }
}

const normalizeCategoryGroup = (group: CategoryGroupRow): SubscriptionPlanCategoryGroup => ({
  id: group.id,
  name: group.name,
  categoryIds: (group.subscription_plan_group_categories ?? []).map(
    (category) => category.category_id,
  ),
})

export async function getSubscriptionPlansPageData() {
  const supabase = await createClient()

  const [
    { data: categoryRows, error: categoryError },
    { data: groupRows, error: groupError },
    { data: planRows, error: planError },
  ] = await Promise.all([
      supabase
        .from('subscription_plan_categories')
        .select('id, name, description')
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

  return {
    categories: (categoryRows ?? []).map(normalizeCategory),
    groups: ((groupRows ?? []) as CategoryGroupRow[]).map(normalizeCategoryGroup),
    plans: ((planRows ?? []) as SubscriptionPlanRow[]).map(normalizePlan),
  }
}

export async function listSubscriptionPlanCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .select('id, name, description')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Unable to load subscription plan categories: ${error.message}`)
  }

  return (data ?? []).map(normalizeCategory)
}

export async function createSubscriptionPlanCategory(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .insert({ name })
    .select('id, name, description')
    .single()

  if (error) {
    throw new Error(`Unable to create subscription plan category: ${error.message}`)
  }

  return normalizeCategory(data)
}

export async function renameSubscriptionPlanCategory(categoryId: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plan_categories')
    .update({ name })
    .eq('id', categoryId)
    .select('id, name, description')
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
  const { data, error } = await supabase
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
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Unable to load subscription plans: ${error.message}`)
  }

  return ((data ?? []) as SubscriptionPlanRow[]).map(normalizePlan)
}

export async function createSubscriptionPlan(input: SubscriptionPlan) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      plan_code: input.code,
      name: input.name,
      category_id: input.categoryType === 'group' ? null : input.categoryId,
      group_id: input.categoryType === 'group' ? input.groupId : null,
      billing_type: input.billingType,
      speed: input.speed,
      channels: input.channels,
      price: input.price,
      subscribers: input.subscribers,
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

  return normalizePlan(data as SubscriptionPlanRow)
}

export async function updateSubscriptionPlan(input: SubscriptionPlan) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({
      plan_code: input.code,
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

  return normalizePlan(data as SubscriptionPlanRow)
}

export async function deleteSubscriptionPlan(planId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscription_plans').delete().eq('id', planId)

  if (error) {
    throw new Error(`Unable to delete subscription plan: ${error.message}`)
  }
}
