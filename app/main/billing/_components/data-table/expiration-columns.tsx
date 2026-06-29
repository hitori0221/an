'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { CreditCard } from '@gravity-ui/icons'

import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { BillingExpirationAccount, BillingSubscriptionStatus } from './types'

export const expirationColumnClassNames: Record<string, string> = {
  subscriberName: 'w-[25%] min-w-[200px]',
  phoneNumber: 'w-[14%] min-w-[124px]',
  plan: 'w-[20%] min-w-[168px]',
  expirationDateValue: 'w-[16%] min-w-[132px]',
  remainingDays: 'w-[13%] min-w-[124px]',
  billingStatus: 'w-[12%] min-w-[104px]',
  action: 'w-[8%] min-w-[72px]',
}

const statusStyles: Record<BillingSubscriptionStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Overdue: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Expired: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
}

const formatRemainingDays = (days: number) => {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} expired`
  if (days === 0) return 'Expires today'

  return `${days} day${days === 1 ? '' : 's'} left`
}

type GetExpirationColumnsOptions = {
  onPostPayment: (account: BillingExpirationAccount) => void
}

export const getExpirationColumns = ({
  onPostPayment,
}: GetExpirationColumnsOptions): ColumnDef<BillingExpirationAccount>[] => [
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
    header: ({ column }) => <SortableColumnHeader column={column} title='Contact' />,
    accessorKey: 'phoneNumber',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.phoneNumber || '-'}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Plan' />,
    accessorKey: 'plan',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.plan || '-'}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Expires' />,
    accessorKey: 'expirationDateValue',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.expirationDate}</span>
    ),
  },
  {
    header: ({ column }) => (
      <div className='flex justify-end'>
        <SortableColumnHeader column={column} title='Remaining' className='ml-0' />
      </div>
    ),
    accessorKey: 'remainingDays',
    cell: ({ row }) => (
      <span className='block truncate text-right font-medium leading-tight text-foreground'>
        {formatRemainingDays(row.original.remainingDays)}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'billingStatus',
    cell: ({ row }) => {
      const status = row.getValue('billingStatus') as BillingSubscriptionStatus

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
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`Post payment for ${row.original.subscriberName}`}
          onClick={() => onPostPayment(row.original)}
        >
          <CreditCard aria-hidden='true' />
        </Button>
      </div>
    ),
  },
]
