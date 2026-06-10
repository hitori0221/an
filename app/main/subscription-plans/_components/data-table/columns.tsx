'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  Ellipsis as MoreHorizontal,
  Pencil,
  TrashBin,
} from '@gravity-ui/icons'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PlanStatus, SubscriptionPlan } from './types'

export const subscriptionPlanColumnClassNames: Record<string, string> = {
  code: 'w-[14%] min-w-[124px]',
  name: 'w-[23%] min-w-[180px]',
  category: 'w-[13%] min-w-[118px]',
  billingType: 'w-[13%] min-w-[118px]',
  service: 'w-[18%] min-w-[150px]',
  price: 'w-[11%] min-w-[98px]',
  subscribers: 'w-[11%] min-w-[112px]',
  status: 'w-[10%] min-w-[104px]',
  action: 'w-[6%] min-w-[64px]',
}

const statusStyles: Record<PlanStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Draft: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Archived: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

type SubscriptionPlanColumnActions = {
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (plan: SubscriptionPlan) => void
}

export const getSubscriptionPlanColumns = ({
  onEdit,
  onDelete,
}: SubscriptionPlanColumnActions): ColumnDef<SubscriptionPlan>[] => [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Plan Code' />,
    accessorKey: 'code',
    cell: ({ row }) => (
      <span className='block truncate font-mono text-[13px] leading-tight text-foreground'>
        {row.getValue('code')}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Plan' />,
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='min-w-0'>
        <p className='truncate font-medium leading-tight text-foreground'>{row.original.name}</p>
        <p className='truncate text-xs text-muted-foreground'>Updated {row.original.updatedAt}</p>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Category' />,
    accessorKey: 'category',
    cell: ({ row }) => (
      <span className='inline-flex h-6 items-center rounded-md bg-muted/70 px-2 text-xs font-medium leading-tight text-foreground'>
        {row.getValue('category')}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Billing' />,
    accessorKey: 'billingType',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('billingType')}</span>
    ),
  },
  {
    id: 'service',
    header: ({ column }) => <SortableColumnHeader column={column} title='Service' />,
    accessorFn: (row) => `${row.speed} ${row.channels}`,
    cell: ({ row }) => (
      <div className='min-w-0'>
        <p className='truncate text-sm leading-tight text-foreground'>{row.original.speed}</p>
        <p className='truncate text-xs text-muted-foreground'>{row.original.channels}</p>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Price' />,
    accessorKey: 'price',
    cell: ({ row }) => (
      <span className='block text-right font-medium leading-tight text-foreground'>
        {currencyFormatter.format(row.getValue('price'))}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Subscribers' />,
    accessorKey: 'subscribers',
    cell: ({ row }) => (
      <span className='block text-right leading-tight text-muted-foreground'>{row.getValue('subscribers')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as PlanStatus

      return (
        <Badge
          variant='outline'
          className={cn('flex h-6 items-center gap-1.5 px-2 py-0.5 font-medium', statusStyles[status])}
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
              aria-label={`Open actions for ${row.original.name}`}
            >
              <MoreHorizontal aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuLabel className='truncate'>{row.original.code}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                <Pencil aria-hidden='true' />
                Edit
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onSelect={() => onDelete(row.original)}>
              <TrashBin aria-hidden='true' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
