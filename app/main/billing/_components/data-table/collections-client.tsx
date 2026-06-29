'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import { DataTable } from '@/components/data-table/shared/data-table'

import { collectionColumns, collectionColumnClassNames } from './collection-columns'
import type { BillingCollectionSummary, BillingPayment } from './types'

type CollectionsClientProps = {
  summaries: BillingCollectionSummary[]
  payments: BillingPayment[]
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export function CollectionsClient({
  payments,
}: CollectionsClientProps) {
  const branchFilter = useSearchParams().get('branch') ?? 'all'
  const postedPayments = payments.filter((payment) =>
    payment.status === 'Posted' && (branchFilter === 'all' || payment.branchId === branchFilter),
  )
  const summaries = useMemo(() => Array.from(
    postedPayments.reduce<Map<string, BillingCollectionSummary>>((summaryMap, payment) => {
      const key = `${payment.paymentDateValue}:${payment.collector}:${payment.method}`
      const current = summaryMap.get(key)

      if (current) {
        current.paymentCount += 1
        current.totalAmount += payment.amount
        current.lastReferenceNumber = payment.referenceNumber || current.lastReferenceNumber
      } else {
        summaryMap.set(key, {
          id: key,
          paymentDate: payment.paymentDate,
          collector: payment.collector || 'Unassigned',
          method: payment.method,
          paymentCount: 1,
          totalAmount: payment.amount,
          lastReferenceNumber: payment.referenceNumber,
        })
      }

      return summaryMap
    }, new Map()).values(),
  ), [postedPayments])
  const totalCollected = postedPayments.reduce((total, payment) => total + payment.amount, 0)
  const collectorCount = new Set(summaries.map((summary) => summary.collector)).size
  const averageCollection = summaries.length > 0 ? totalCollected / summaries.length : 0

  return (
    <div className='flex min-w-0 w-full flex-col gap-4'>
      <div className='flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='min-w-0 lg:max-w-md'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Collections</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Review posted payment totals by date, collector, and method.
          </p>
        </div>
        <div className='grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl lg:flex-1'>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Total collected</p>
            <p className='mt-0.5 text-xl font-semibold'>{currencyFormatter.format(totalCollected)}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Collectors</p>
            <p className='mt-0.5 text-xl font-semibold'>{collectorCount}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Average group</p>
            <p className='mt-0.5 text-xl font-semibold'>{currencyFormatter.format(averageCollection)}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={collectionColumns}
        data={summaries}
        columnClassNames={collectionColumnClassNames}
        itemLabel='collections'
        minWidthClassName='min-w-[816px]'
      />
    </div>
  )
}
