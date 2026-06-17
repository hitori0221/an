'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import SubscriptionPlansDataTable from './data-table/data-table'
import type {
  SubscriptionCategoryField,
  SubscriptionCategoryFieldType,
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from './data-table/types'
import { CategoryDrawer } from './modals/category-drawer'

type SubscriptionPlansClientProps = {
  initialPlans: SubscriptionPlan[]
  categories: SubscriptionPlanCategory[]
  fields: SubscriptionCategoryField[]
  groups: SubscriptionPlanCategoryGroup[]
}

type CategoryFieldInput = {
  label: string
  type: SubscriptionCategoryFieldType
  placeholder?: string | null
  required?: boolean
  options?: string[]
  sortOrder?: number
}

type CategoryInput = {
  name: string
  iconDataUrl?: string | null
}

const readApiError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null

  return body?.error ?? fallback
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export function SubscriptionPlansClient({
  initialPlans,
  categories,
  fields,
  groups,
}: SubscriptionPlansClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState(initialPlans)
  const [subscriptionPlanCategories, setSubscriptionPlanCategories] = useState(categories)
  const [subscriptionCategoryFields, setSubscriptionCategoryFields] = useState(fields)
  const [subscriptionPlanCategoryGroups, setSubscriptionPlanCategoryGroups] = useState(groups)
  const categoryDrawerMode = searchParams.get('categoryDrawer')
  const totalSubscribers = subscriptionPlans.reduce((total, plan) => total + plan.subscribers, 0)
  const activePlans = subscriptionPlans.filter((plan) => plan.status === 'Active').length
  const averagePrice =
    subscriptionPlans.length > 0
      ? subscriptionPlans.reduce((total, plan) => total + plan.price, 0) / subscriptionPlans.length
      : 0
  const categorySummaries = useMemo(
    () =>
      Array.from(
        subscriptionPlanCategories
          .reduce((categoryMap, category) => {
            categoryMap.set(category.id, {
              id: category.id,
              name: category.name,
              iconDataUrl: category.iconDataUrl,
              plans: 0,
              subscribers: 0,
            })

            return categoryMap
          }, new Map<string, { id: string; name: string; iconDataUrl?: string | null; plans: number; subscribers: number; groups?: string[] }>())
          .values(),
      ).map((category) => {
        const matchingPlans = subscriptionPlans.filter((plan) => plan.categoryId === category.id)

        return {
          ...category,
          plans: matchingPlans.length,
          subscribers: matchingPlans.reduce((total, plan) => total + plan.subscribers, 0),
        }
      }),
    [subscriptionPlanCategories, subscriptionPlans],
  )
  const groupSummaries = useMemo(
    () =>
      subscriptionPlanCategoryGroups.map((group) => {
        const matchingPlans = subscriptionPlans.filter((plan) => plan.groupId === group.id)

        return {
          ...group,
          plans: matchingPlans.length,
          subscribers: matchingPlans.reduce((total, plan) => total + plan.subscribers, 0),
        }
      }),
    [subscriptionPlanCategoryGroups, subscriptionPlans],
  )

  const handleCreateCategory = async (input: CategoryInput) => {
    const response = await fetch('/api/subscription-plans/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error(
        'Unable to create subscription plan category',
        await readApiError(response, 'Unable to create subscription plan category'),
      )
      return null
    }

    const { category } = (await response.json()) as {
      category: SubscriptionPlanCategory
    }

    setSubscriptionPlanCategories((currentCategories) => [...currentCategories, category])

    return {
      ...category,
      plans: 0,
      subscribers: 0,
    }
  }

  const handleUpdateCategory = async (categoryId: string, input: CategoryInput) => {
    const response = await fetch(`/api/subscription-plans/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const message = await readApiError(response, 'Unable to update subscription plan category')
      console.error('Unable to update subscription plan category', message)
      return null
    }

    const { category: updatedCategory } = (await response.json()) as {
      category: SubscriptionPlanCategory
    }

    setSubscriptionPlanCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId
          ? {
              id: updatedCategory.id,
              name: updatedCategory.name,
              description: updatedCategory.description,
              iconDataUrl: updatedCategory.iconDataUrl,
            }
          : category,
      ),
    )
    setSubscriptionPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.categoryId === categoryId
          ? {
              ...plan,
              category: updatedCategory.name,
            }
          : plan,
      ),
    )

    return updatedCategory
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryHasPlans = subscriptionPlans.some((plan) => plan.categoryId === categoryId)

    if (categoryHasPlans) return false

    const response = await fetch(`/api/subscription-plans/categories/${categoryId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete subscription plan category', await response.json().catch(() => null))
      return false
    }

    setSubscriptionPlanCategories((currentCategories) =>
      currentCategories.filter((category) => category.id !== categoryId),
    )
    setSubscriptionCategoryFields((currentFields) =>
      currentFields.filter((field) => field.categoryId !== categoryId),
    )

    return true
  }

  const handleCreateField = async (categoryId: string, input: CategoryFieldInput) => {
    const response = await fetch(`/api/subscription-plans/categories/${categoryId}/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to create subscription category field', await response.json().catch(() => null))
      return null
    }

    const { field } = (await response.json()) as {
      field: SubscriptionCategoryField
    }

    setSubscriptionCategoryFields((currentFields) =>
      [...currentFields, field].sort((first, second) => first.sortOrder - second.sortOrder),
    )

    return field
  }

  const handleUpdateField = async (fieldId: string, input: CategoryFieldInput) => {
    const response = await fetch(`/api/subscription-plans/category-fields/${fieldId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to update subscription category field', await response.json().catch(() => null))
      return null
    }

    const { field } = (await response.json()) as {
      field: SubscriptionCategoryField
    }

    setSubscriptionCategoryFields((currentFields) =>
      currentFields
        .map((currentField) => (currentField.id === fieldId ? field : currentField))
        .sort((first, second) => first.sortOrder - second.sortOrder),
    )

    return field
  }

  const handleDeleteField = async (fieldId: string) => {
    const response = await fetch(`/api/subscription-plans/category-fields/${fieldId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete subscription category field', await response.json().catch(() => null))
      return false
    }

    setSubscriptionCategoryFields((currentFields) =>
      currentFields.filter((field) => field.id !== fieldId),
    )

    return true
  }

  const handleCreateGroup = async (name: string, categoryIds: string[]) => {
    const response = await fetch('/api/subscription-plans/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, categoryIds }),
    })

    if (!response.ok) {
      console.error('Unable to create subscription plan category group', await response.json().catch(() => null))
      return null
    }

    const { group } = (await response.json()) as {
      group: SubscriptionPlanCategoryGroup
    }

    setSubscriptionPlanCategoryGroups((currentGroups) => [...currentGroups, group])

    return group
  }

  const handleUpdateGroup = async (groupId: string, name: string, categoryIds: string[]) => {
    const response = await fetch(`/api/subscription-plans/groups/${groupId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, categoryIds }),
    })

    if (!response.ok) {
      console.error('Unable to update subscription plan category group', await response.json().catch(() => null))
      return null
    }

    const { group } = (await response.json()) as {
      group: SubscriptionPlanCategoryGroup
    }

    setSubscriptionPlanCategoryGroups((currentGroups) =>
      currentGroups.map((currentGroup) => (currentGroup.id === groupId ? group : currentGroup)),
    )

    return group
  }

  const handleDeleteGroup = async (groupId: string) => {
    const groupHasPlans = subscriptionPlans.some((plan) => plan.groupId === groupId)

    if (groupHasPlans) return false

    const response = await fetch(`/api/subscription-plans/groups/${groupId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete subscription plan category group', await response.json().catch(() => null))
      return false
    }

    setSubscriptionPlanCategoryGroups((currentGroups) =>
      currentGroups.filter((group) => group.id !== groupId),
    )

    return true
  }

  const handleCategoryOpenChange = (open: boolean) => {
    setIsCategoryOpen(open)

    if (open || categoryDrawerMode !== 'create') return

    const params = new URLSearchParams(searchParams.toString())
    params.delete('categoryDrawer')
    const queryString = params.toString()

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }

  return (
    <div className='min-w-0 w-full space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Subscription Plans</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Manage service plans, billing types, prices, and availability for subscriber accounts.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Active plans</p>
          <p className='mt-1 text-2xl font-semibold'>{activePlans}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Linked subscribers</p>
          <p className='mt-1 text-2xl font-semibold'>{totalSubscribers}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Average price</p>
          <p className='mt-1 text-2xl font-semibold'>{currencyFormatter.format(averagePrice)}</p>
        </div>
      </div>

      <SubscriptionPlansDataTable
        initialPlans={initialPlans}
        categories={subscriptionPlanCategories}
        groups={subscriptionPlanCategoryGroups}
        onPlansChange={setSubscriptionPlans}
      />
      <CategoryDrawer
        open={isCategoryOpen || categoryDrawerMode === 'create'}
        onOpenChange={handleCategoryOpenChange}
        categories={categorySummaries}
        fields={subscriptionCategoryFields}
        groups={groupSummaries}
        startAddingMode={categoryDrawerMode === 'create' ? 'category' : undefined}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onCreateField={handleCreateField}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
      />
    </div>
  )
}
