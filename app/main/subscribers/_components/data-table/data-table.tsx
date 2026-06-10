'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/shared/data-table'

import { CreateSubscriberModal } from '../modals/create-subscriber-modal'
import { subscriberColumnClassNames, subscriberColumns } from './columns'
import { subscribers as initialSubscribers } from './data'
import type { Subscriber } from './types'

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

function renderSubscriberExpandedRow(row: Row<Subscriber>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Account Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.accountNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Phone Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Plan</p>
          <p className='text-sm font-medium text-foreground'>{row.original.plan}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Location</p>
          <p className='text-sm text-foreground'>{row.original.barangay}, {row.original.city}</p>
        </div>
      </div>
    </div>
  )
}

export default function SubscribersDataTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers)
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

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreateSubscriber = (subscriber: Subscriber) => {
    setSubscribers((currentSubscribers) => [subscriber, ...currentSubscribers])
    closeCreateModal()
  }

  return (
    <>
      <DataTable
        columns={subscriberColumns}
        data={filteredSubscribers}
        columnClassNames={subscriberColumnClassNames}
        itemLabel='subscribers'
        minWidthClassName='min-w-[892px]'
        renderExpandedRow={renderSubscriberExpandedRow}
      />
      <CreateSubscriberModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        nextAccountNumber={nextAccountNumber}
        onCancel={closeCreateModal}
        onSubmit={handleCreateSubscriber}
      />
    </>
  )
}
