'use client'

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
  summaries,
  payments,
}: CollectionsClientProps) {
  const postedPayments = payments.filter((payment) => payment.status === 'Posted')
  const totalCollected = postedPayments.reduce((total, payment) => total + payment.amount, 0)
  const collectorCount = new Set(summaries.map((summary) => summary.collector)).size
  const averageCollection = summaries.length > 0 ? totalCollected / summaries.length : 0

  return (
    <div className='min-w-0 w-full space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Collections</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Review posted payment totals by date, collector, and method.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Total collected</p>
          <p className='mt-1 text-2xl font-semibold'>{currencyFormatter.format(totalCollected)}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Collectors</p>
          <p className='mt-1 text-2xl font-semibold'>{collectorCount}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Average group</p>
          <p className='mt-1 text-2xl font-semibold'>{currencyFormatter.format(averageCollection)}</p>
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
