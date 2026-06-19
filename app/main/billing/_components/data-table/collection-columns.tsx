'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'

import type { BillingCollectionSummary } from './types'

export const collectionColumnClassNames: Record<string, string> = {
  paymentDate: 'w-[18%] min-w-[132px]',
  collector: 'w-[24%] min-w-[164px]',
  method: 'w-[18%] min-w-[132px]',
  paymentCount: 'w-[16%] min-w-[118px]',
  totalAmount: 'w-[16%] min-w-[128px]',
  lastReferenceNumber: 'w-[18%] min-w-[142px]',
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

export const collectionColumns: ColumnDef<BillingCollectionSummary>[] = [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Date' />,
    accessorKey: 'paymentDate',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.paymentDate}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Collector' />,
    accessorKey: 'collector',
    cell: ({ row }) => (
      <span className='block truncate font-medium leading-tight text-foreground'>{row.original.collector}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Method' />,
    accessorKey: 'method',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.method}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Payments' />,
    accessorKey: 'paymentCount',
    cell: ({ row }) => (
      <span className='block text-right leading-tight text-muted-foreground'>{row.original.paymentCount}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Total' />,
    accessorKey: 'totalAmount',
    cell: ({ row }) => (
      <span className='block text-right font-medium leading-tight text-foreground'>
        {currencyFormatter.format(row.original.totalAmount)}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Last Ref' />,
    accessorKey: 'lastReferenceNumber',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>
        {row.original.lastReferenceNumber || '-'}
      </span>
    ),
  },
]
