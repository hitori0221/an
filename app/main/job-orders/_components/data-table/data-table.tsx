'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/shared/data-table'

import { CreateJobOrderSheet } from '../modals/create-job-order-sheet'
import { getJobOrderColumns, jobOrderColumnClassNames } from './columns'
import type { JobOrder, JobOrderInput, JobOrderStatus, JobOrderSubscriberOption } from './types'

type JobOrdersDataTableProps = {
  initialJobOrders: JobOrder[]
  subscribers: JobOrderSubscriberOption[]
  initialNextTicketNumber: string
}

const getNextTicketNumber = (jobOrders: JobOrder[]) => {
  const currentYear = new Date().getFullYear()
  const maxTicketNumber = jobOrders.reduce((max, jobOrder) => {
    const numericId = Number(jobOrder.ticketNumber.split('-').at(-1))

    return Number.isFinite(numericId) ? Math.max(max, numericId) : max
  }, 0)

  return `JO-${currentYear}-${String(maxTicketNumber + 1).padStart(4, '0')}`
}

function renderJobOrderExpandedRow(row: Row<JobOrder>) {
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
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Location</p>
          <p className='text-sm text-foreground'>{row.original.barangay}, {row.original.city}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Assigned Technician</p>
          <p className='text-sm font-medium text-foreground'>{row.original.technician}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Problem Category</p>
          <p className='text-sm text-foreground'>{row.original.problemCategory}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Created Date</p>
          <p className='text-sm text-foreground'>{row.original.createdDate}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Last Update</p>
          <p className='text-sm text-foreground'>{row.original.lastUpdate}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-4'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Problem Details</p>
          <p className='text-sm text-foreground'>{row.original.problemDetails}</p>
        </div>
      </div>
    </div>
  )
}

const readApiError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null

  return body?.error ?? fallback
}

export default function JobOrdersDataTable({
  initialJobOrders,
  subscribers,
  initialNextTicketNumber,
}: JobOrdersDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(initialJobOrders)

  const isCreateOpen = searchParams.get('create') === '1'
  const nextTicketNumber = useMemo(
    () => (jobOrders.length > 0 ? getNextTicketNumber(jobOrders) : initialNextTicketNumber),
    [initialNextTicketNumber, jobOrders],
  )
  const openJobOrders = jobOrders.filter(
    (jobOrder) => !['Resolved', 'Closed', 'Cancelled'].includes(jobOrder.status),
  ).length
  const assignedJobOrders = jobOrders.filter((jobOrder) => jobOrder.status === 'Assigned').length
  const resolvedJobOrders = jobOrders.filter((jobOrder) => jobOrder.status === 'Resolved').length

  const closeCreateDrawer = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `?${params.toString()}` : '/main/job-orders', {
      scroll: false,
    })
  }

  const handleCreateJobOrder = async (input: JobOrderInput) => {
    const response = await fetch('/api/job-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to create job order', await readApiError(response, 'Unable to create job order'))
      return false
    }

    const { jobOrder } = (await response.json()) as { jobOrder: JobOrder }

    setJobOrders((currentJobOrders) => [jobOrder, ...currentJobOrders])
    closeCreateDrawer()

    return true
  }

  const handleStatusChange = useCallback(async (jobOrderId: string, status: JobOrderStatus) => {
    const response = await fetch(`/api/job-orders/${jobOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      console.error('Unable to update job order', await readApiError(response, 'Unable to update job order'))
      return
    }

    const { jobOrder } = (await response.json()) as { jobOrder: JobOrder }

    setJobOrders((currentJobOrders) =>
      currentJobOrders.map((currentJobOrder) =>
        currentJobOrder.id === jobOrderId ? jobOrder : currentJobOrder,
      ),
    )
  }, [])
  const columns = useMemo(() => getJobOrderColumns(handleStatusChange), [handleStatusChange])

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Job Orders</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Track subscriber service tickets, technician assignments, and repair progress.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Open job orders</p>
          <p className='mt-1 text-2xl font-semibold'>{openJobOrders}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Assigned</p>
          <p className='mt-1 text-2xl font-semibold'>{assignedJobOrders}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Resolved</p>
          <p className='mt-1 text-2xl font-semibold'>{resolvedJobOrders}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={jobOrders}
        columnClassNames={jobOrderColumnClassNames}
        itemLabel='job orders'
        minWidthClassName='min-w-[784px]'
        renderExpandedRow={renderJobOrderExpandedRow}
      />
      <CreateJobOrderSheet
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateDrawer()
        }}
        nextTicketNumber={nextTicketNumber}
        subscribers={subscribers}
        onCancel={closeCreateDrawer}
        onSubmit={handleCreateJobOrder}
      />
    </div>
  )
}
