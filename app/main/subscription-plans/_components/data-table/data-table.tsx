'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { DataTable } from '@/components/data-table/shared/data-table'

import { CreatePlanModal } from '../modals/create-plan-modal'
import { EditPlanDrawer } from '../modals/edit-plan-drawer'
import { getSubscriptionPlanColumns, subscriptionPlanColumnClassNames } from './columns'
import type {
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from './types'

type SubscriptionPlansDataTableProps = {
  initialPlans: SubscriptionPlan[]
  categories: SubscriptionPlanCategory[]
  groups: SubscriptionPlanCategoryGroup[]
  onPlansChange?: (plans: SubscriptionPlan[]) => void
}

export default function SubscriptionPlansDataTable({
  initialPlans,
  categories,
  groups,
  onPlansChange,
}: SubscriptionPlansDataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(initialPlans)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const statusFilter = searchParams.get('status') ?? 'all'
  const categoryFilter = searchParams.get('category') ?? 'all'
  const filteredPlans = useMemo(
    () =>
      subscriptionPlans.filter((plan) => {
        const matchesStatus = statusFilter === 'all' || plan.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || plan.category === categoryFilter

        return matchesStatus && matchesCategory
      }),
    [categoryFilter, statusFilter, subscriptionPlans],
  )
  const isCreateOpen = searchParams.get('create') === '1'

  const updatePlans = (getPlans: (currentPlans: SubscriptionPlan[]) => SubscriptionPlan[]) => {
    setSubscriptionPlans((currentPlans) => {
      const nextPlans = getPlans(currentPlans)
      onPlansChange?.(nextPlans)

      return nextPlans
    })
  }

  const columns = useMemo(
    () =>
      getSubscriptionPlanColumns({
        onEdit: setEditingPlan,
        onDelete: async (plan) => {
          const response = await fetch(`/api/subscription-plans/plans/${plan.id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            console.error('Unable to delete subscription plan', await response.json().catch(() => null))
            return
          }

          updatePlans((currentPlans) => currentPlans.filter((currentPlan) => currentPlan.id !== plan.id))
          setEditingPlan((currentPlan) => (currentPlan?.id === plan.id ? null : currentPlan))
        },
      }),
    [],
  )

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreatePlan = async (plan: SubscriptionPlan) => {
    const response = await fetch('/api/subscription-plans/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    })

    if (!response.ok) {
      console.error('Unable to create subscription plan', await response.json().catch(() => null))
      return
    }

    const { plan: createdPlan } = (await response.json()) as {
      plan: SubscriptionPlan
    }

    updatePlans((currentPlans) => [
      createdPlan,
      ...currentPlans,
    ])
    closeCreateModal()
  }

  const handleUpdatePlan = async (updatedPlan: SubscriptionPlan) => {
    const response = await fetch(`/api/subscription-plans/plans/${updatedPlan.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPlan),
    })

    if (!response.ok) {
      console.error('Unable to update subscription plan', await response.json().catch(() => null))
      return
    }

    const { plan: savedPlan } = (await response.json()) as {
      plan: SubscriptionPlan
    }

    updatePlans((currentPlans) =>
      currentPlans.map((plan) => (plan.id === savedPlan.id ? savedPlan : plan)),
    )
    setEditingPlan(null)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredPlans}
        columnClassNames={subscriptionPlanColumnClassNames}
        itemLabel='plans'
        minWidthClassName='min-w-[920px]'
      />
      <CreatePlanModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        categories={categories}
        groups={groups}
        onCancel={closeCreateModal}
        onSubmit={handleCreatePlan}
      />
      <EditPlanDrawer
        open={Boolean(editingPlan)}
        plan={editingPlan}
        categories={categories}
        groups={groups}
        onOpenChange={(open) => {
          if (!open) setEditingPlan(null)
        }}
        onSubmit={handleUpdatePlan}
      />
    </>
  )
}
