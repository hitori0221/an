'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis as MoreHorizontal, TrashBin } from '@gravity-ui/icons'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { BillingPayment, BillingPaymentStatus } from './types'

export const paymentColumnClassNames: Record<string, string> = {
  invoiceNumber: 'w-[15%] min-w-[134px]',
  subscriberName: 'w-[20%] min-w-[168px]',
  paymentDateValue: 'w-[13%] min-w-[112px]',
  paidUntilValue: 'w-[13%] min-w-[112px]',
  method: 'w-[14%] min-w-[122px]',
  collector: 'w-[16%] min-w-[132px]',
  receiptPhotoPath: 'w-[10%] min-w-[92px]',
  amount: 'w-[12%] min-w-[112px]',
  status: 'w-[9%] min-w-[98px]',
  action: 'w-[8%] min-w-[64px]',
}

const statusStyles: Record<BillingPaymentStatus, string> = {
  Posted: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Void: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

type GetPaymentColumnsOptions = {
  onDelete: (payment: BillingPayment) => void
}

export const getPaymentColumns = ({
  onDelete,
}: GetPaymentColumnsOptions): ColumnDef<BillingPayment>[] => [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Invoice' />,
    accessorKey: 'invoiceNumber',
    cell: ({ row }) => (
      <span className='block truncate text-[13px] font-medium leading-tight text-foreground'>
        {row.original.invoiceNumber}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Subscriber' />,
    accessorKey: 'subscriberName',
    cell: ({ row }) => (
      <div className='min-w-0'>
        <p className='truncate font-medium leading-tight text-foreground'>{row.original.subscriberName}</p>
        <p className='truncate font-mono text-xs text-muted-foreground'>{row.original.accountNumber}</p>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Date' />,
    accessorKey: 'paymentDateValue',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.paymentDate}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Paid until' />,
    accessorKey: 'paidUntilValue',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.paidUntil}</span>
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
    header: ({ column }) => <SortableColumnHeader column={column} title='Collector' />,
    accessorKey: 'collector',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-foreground'>{row.original.collector || '-'}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Receipt' />,
    accessorKey: 'receiptPhotoPath',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>
        {row.original.receiptPhotoPath ? 'Photo' : '-'}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Amount' />,
    accessorKey: 'amount',
    cell: ({ row }) => (
      <span className='block text-right font-medium leading-tight text-foreground'>
        {currencyFormatter.format(row.original.amount)}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BillingPaymentStatus

      return (
        <Badge
          variant='outline'
          className={cn('inline-flex h-6 items-center gap-1.5 px-2 py-0.5 font-medium', statusStyles[status])}
        >
          <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />
          {status}
        </Badge>
      )
    },
  },
  {
    id: 'action',
    enableSorting: false,
    header: () => <div className='text-right'>Action</div>,
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Open actions for ${row.original.invoiceNumber}`}
            >
              <MoreHorizontal aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuLabel>{row.original.invoiceNumber}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
              <TrashBin />
              Delete payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
