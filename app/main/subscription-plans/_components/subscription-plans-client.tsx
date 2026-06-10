'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import SubscriptionPlansDataTable from './data-table/data-table'
import type {
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from './data-table/types'
import { CategoryDrawer } from './modals/category-drawer'

type SubscriptionPlansClientProps = {
  initialPlans: SubscriptionPlan[]
  categories: SubscriptionPlanCategory[]
  groups: SubscriptionPlanCategoryGroup[]
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export function SubscriptionPlansClient({
  initialPlans,
  categories,
  groups,
}: SubscriptionPlansClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState(initialPlans)
  const [subscriptionPlanCategories, setSubscriptionPlanCategories] = useState(categories)
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
              plans: 0,
              subscribers: 0,
            })

            return categoryMap
          }, new Map<string, { id: string; name: string; plans: number; subscribers: number; groups?: string[] }>())
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

  const handleCreateCategory = async (name: string) => {
    const response = await fetch('/api/subscription-plans/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      console.error('Unable to create subscription plan category', await response.json().catch(() => null))
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

  const handleRenameCategory = async (categoryId: string, name: string) => {
    const response = await fetch(`/api/subscription-plans/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      console.error('Unable to rename subscription plan category', await response.json().catch(() => null))
      return
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

  useEffect(() => {
    if (categoryDrawerMode === 'create') {
      setIsCategoryOpen(true)
    }
  }, [categoryDrawerMode])

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
        open={isCategoryOpen}
        onOpenChange={handleCategoryOpenChange}
        categories={categorySummaries}
        groups={groupSummaries}
        startAddingMode={categoryDrawerMode === 'create' ? 'category' : undefined}
        onCreateCategory={handleCreateCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
      />
    </div>
  )
}
