'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { DataTable } from '@/components/data-table/shared/data-table'
import { Button } from '@/components/ui/button'

import { CreateSubscriberModal } from '../modals/create-subscriber-modal'
import { getSubscriberColumns, subscriberColumnClassNames } from './columns'
import type {
  Subscriber,
  SubscriberBranchOption,
  SubscriberCategoryField,
  SubscriberModemOption,
  SubscriberPlanOption,
  SubscriberSubscriptionCategoryGroupOption,
  SubscriberSubscriptionCategoryOption,
} from './types'

type SubscribersDataTableProps = {
  initialSubscribers: Subscriber[]
  categories: SubscriberSubscriptionCategoryOption[]
  categoryGroups: SubscriberSubscriptionCategoryGroupOption[]
  plans: SubscriberPlanOption[]
  branches: SubscriberBranchOption[]
  modems: SubscriberModemOption[]
  categoryFields: SubscriberCategoryField[]
}

const getNextAccountNumber = (subscribers: Subscriber[]) => {
  const template = subscribers[0]?.accountNumber ?? '1234-121221-0000'
  const lastSeparatorIndex = template.lastIndexOf('-')
  const prefix = lastSeparatorIndex === -1 ? '1234-121221' : template.slice(0, lastSeparatorIndex)
  const maxAccountSuffix = subscribers.reduce((max, subscriber) => {
    const suffix = Number(subscriber.accountNumber.split('-').at(-1))

    return Number.isFinite(suffix) ? Math.max(max, suffix) : max
  }, 0)

  return `${prefix}-${String(maxAccountSuffix + 1).padStart(4, '0')}`
}

const toDisplayLabel = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getCategoryInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'

function CategoryDetailsIcon({
  name,
  iconDataUrl,
}: {
  name: string
  iconDataUrl?: string | null
}) {
  return (
    <span className='relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-xs font-semibold text-muted-foreground shadow-xs'>
      {iconDataUrl ? (
        <Image src={iconDataUrl} alt='' fill unoptimized sizes='40px' className='scale-125 object-cover' />
      ) : (
        getCategoryInitials(name)
      )}
    </span>
  )
}

function renderSubscriberExpandedRow(
  row: Row<Subscriber>,
  categories: SubscriberSubscriptionCategoryOption[],
  categoryFields: SubscriberCategoryField[],
) {
  const subscriptionDetails = Object.entries(row.original.subscriptionDetails)
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const fieldLabelByKey = new Map(categoryFields.map((field) => [field.key, field.label]))
  const fieldLabelByCompositeKey = new Map(
    categoryFields.map<[string, string]>((field) => [`${field.categoryId}.${field.key}`, field.label]),
  )
  const groupedSubscriptionDetails = subscriptionDetails.reduce<
    Array<{
      categoryId: string | null
      categoryName: string
      iconDataUrl?: string | null
      entries: Array<{ key: string; label: string; value: string }>
    }>
  >((groups, [key, value]) => {
    const [categorySegment, fieldSegment] = key.includes('.') ? key.split('.', 2) : [null, key]
    const matchedCategory = categorySegment ? categoryById.get(categorySegment) : null
    const categoryId = matchedCategory?.id ?? row.original.subscriptionCategoryId ?? null
    const categoryName = (matchedCategory?.name ?? row.original.subscriptionCategory) || 'Subscription details'
    const label =
      fieldLabelByCompositeKey.get(key) ?? fieldLabelByKey.get(fieldSegment) ?? toDisplayLabel(fieldSegment)
    const existingGroup = groups.find((group) => group.categoryId === categoryId && group.categoryName === categoryName)

    if (existingGroup) {
      existingGroup.entries.push({ key, label, value })
      return groups
    }

    groups.push({
      categoryId,
      categoryName,
      iconDataUrl: matchedCategory?.iconDataUrl ?? (categoryId ? categoryById.get(categoryId)?.iconDataUrl : null),
      entries: [{ key, label, value }],
    })

    return groups
  }, [])

  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Account Number</p>
          <p className='text-sm text-foreground'>{row.original.accountNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Phone Number</p>
          <p className='text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Plan</p>
          <p className='text-sm font-medium text-foreground'>{row.original.plan}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Category</p>
          <p className='text-sm text-foreground'>{row.original.subscriptionCategory || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Branch</p>
          <p className='text-sm text-foreground'>{row.original.branch || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Location</p>
          <p className='text-sm text-foreground'>{row.original.streetZone ? `${row.original.streetZone}, ` : ''}{row.original.barangay}, {row.original.city}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Connection</p>
          <p className='text-sm text-foreground'>{row.original.connectionType || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Modem Type</p>
          <p className='text-sm text-foreground'>{row.original.modemType || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>MAC Address</p>
          <p className='text-sm text-foreground'>{row.original.macAddress || '-'}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>CAID</p>
          <p className='text-sm text-foreground'>{row.original.caid || '-'}</p>
        </div>
      </div>
      {subscriptionDetails.length > 0 && (
        <div className='mt-3 border-t pt-3'>
          {groupedSubscriptionDetails.map((group, index) => (
            <div
              key={group.categoryId ?? group.categoryName}
              className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${index > 0 ? 'border-t pt-3' : ''}`}
            >
              <div className='flex items-start gap-3 lg:min-h-[44px]'>
                <CategoryDetailsIcon name={group.categoryName} iconDataUrl={group.iconDataUrl} />
                <div className='min-w-0'>
                  <p className='truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Category
                  </p>
                  <p className='truncate text-sm font-semibold text-foreground'>{group.categoryName}</p>
                </div>
              </div>
              {group.entries.map((entry) => (
                <div key={entry.key} className='flex flex-col gap-1'>
                  <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    {entry.label}
                  </p>
                  <p className='text-sm text-foreground'>{entry.value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SubscribersDataTable({
  initialSubscribers,
  categories,
  categoryGroups,
  plans,
  branches,
  modems,
  categoryFields,
}: SubscribersDataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null)
  const [pendingDeleteSubscriber, setPendingDeleteSubscriber] = useState<Subscriber | null>(null)
  const statusFilter = searchParams.get('status') ?? 'all'
  const planFilter = searchParams.get('plan') ?? 'all'
  const filteredSubscribers = useMemo(
    () =>
      subscribers.filter((subscriber) => {
        const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter
        const matchesPlan = planFilter === 'all' || subscriber.plan === planFilter

        return matchesStatus && matchesPlan
      }),
    [planFilter, statusFilter, subscribers],
  )

  const isCreateOpen = searchParams.get('create') === '1'
  const nextAccountNumber = useMemo(() => getNextAccountNumber(subscribers), [subscribers])
  const columns = useMemo(
    () =>
      getSubscriberColumns({
        onView: (subscriber) => router.push(`/main/subscribers/${encodeURIComponent(subscriber.accountNumber)}`),
        onEdit: setEditingSubscriber,
        onDelete: setPendingDeleteSubscriber,
      }),
    [router],
  )

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreateSubscriber = async (formData: FormData) => {
    const shouldOpenInstallation = formData.get('proceedToInstallation') === '1'
    const response = await fetch('/api/subscribers', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      console.error('Unable to create subscriber', await response.json().catch(() => null))
      return false
    }

    const { subscriber } = (await response.json()) as {
      subscriber: Subscriber
    }

    setSubscribers((currentSubscribers) => [subscriber, ...currentSubscribers])
    closeCreateModal()
    if (shouldOpenInstallation) {
      router.push('/main/installations')
    }

    return true
  }

  const handleUpdateSubscriber = async (formData: FormData) => {
    if (!editingSubscriber) return false

    const response = await fetch(`/api/subscribers/${editingSubscriber.id}`, {
      method: 'PATCH',
      body: formData,
    })

    if (!response.ok) {
      console.error('Unable to update subscriber', await response.json().catch(() => null))
      return false
    }

    const { subscriber } = (await response.json()) as {
      subscriber: Subscriber
    }

    setSubscribers((currentSubscribers) =>
      currentSubscribers.map((currentSubscriber) =>
        currentSubscriber.id === subscriber.id ? subscriber : currentSubscriber,
      ),
    )
    setEditingSubscriber(null)

    return true
  }

  const handleDeleteSubscriber = async () => {
    if (!pendingDeleteSubscriber) return

    const response = await fetch(`/api/subscribers/${pendingDeleteSubscriber.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete subscriber', await response.json().catch(() => null))
      return
    }

    setSubscribers((currentSubscribers) =>
      currentSubscribers.filter((subscriber) => subscriber.id !== pendingDeleteSubscriber.id),
    )
    setEditingSubscriber((currentSubscriber) =>
      currentSubscriber?.id === pendingDeleteSubscriber.id ? null : currentSubscriber,
    )
    setPendingDeleteSubscriber(null)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredSubscribers}
        columnClassNames={subscriberColumnClassNames}
        itemLabel='subscribers'
        minWidthClassName='min-w-[892px]'
        renderExpandedRow={(row) => renderSubscriberExpandedRow(row, categories, categoryFields)}
      />
      <CreateSubscriberModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        nextAccountNumber={nextAccountNumber}
        categories={categories}
        categoryGroups={categoryGroups}
        plans={plans}
        branches={branches}
        modems={modems}
        categoryFields={categoryFields}
        onCancel={closeCreateModal}
        onSubmit={handleCreateSubscriber}
      />
      <CreateSubscriberModal
        open={Boolean(editingSubscriber)}
        onOpenChange={(open) => {
          if (!open) setEditingSubscriber(null)
        }}
        nextAccountNumber={editingSubscriber?.accountNumber ?? nextAccountNumber}
        subscriber={editingSubscriber}
        categories={categories}
        categoryGroups={categoryGroups}
        plans={plans}
        branches={branches}
        modems={modems}
        categoryFields={categoryFields}
        onCancel={() => setEditingSubscriber(null)}
        onSubmit={handleUpdateSubscriber}
      />
      <Dialog
        open={Boolean(pendingDeleteSubscriber)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteSubscriber(null)
        }}
      >
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Delete subscriber?</DialogTitle>
            <DialogDescription>
              {pendingDeleteSubscriber?.name} will be removed from the subscribers table.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setPendingDeleteSubscriber(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleDeleteSubscriber}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
