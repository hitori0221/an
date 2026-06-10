'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Ellipsis as MoreHorizontal,
} from '@gravity-ui/icons'

import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Subscriber } from './types'

export const subscriberColumnClassNames: Record<string, string> = {
  accountNumber: 'w-[20%] min-w-[178px]',
  name: 'w-[17%] min-w-[138px]',
  phoneNumber: 'w-[14%] min-w-[124px]',
  plan: 'w-[13%] min-w-[116px]',
  city: 'w-[10%] min-w-[92px]',
  barangay: 'w-[12%] min-w-[108px]',
  status: 'w-[9%] min-w-[88px]',
  action: 'w-[6%] min-w-[64px]',
}

const statusStyles: Record<string, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Suspended: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

export const subscriberColumns: ColumnDef<Subscriber>[] = [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Account Number' />,
    accessorKey: 'accountNumber',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        <Button
          className='size-7 text-muted-foreground hover:text-foreground'
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          aria-label={
            row.getIsExpanded()
              ? `Collapse details for ${row.original.name}`
              : `Expand details for ${row.original.name}`
          }
          size='icon'
          variant='ghost'
        >
          {row.getIsExpanded() ? (
            <ChevronUpIcon className='opacity-60' aria-hidden='true' />
          ) : (
            <ChevronDownIcon className='opacity-60' aria-hidden='true' />
          )}
        </Button>
        <span className='font-mono text-[13px] leading-tight text-foreground'>{row.getValue('accountNumber')}</span>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Name' />,
    accessorKey: 'name',
    cell: ({ row }) => (
      <span className='block truncate font-medium leading-tight text-foreground'>{row.getValue('name')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Phone Number' />,
    accessorKey: 'phoneNumber',
    cell: ({ row }) => (
      <span className='font-mono text-xs leading-tight text-muted-foreground'>{row.getValue('phoneNumber')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Plan' />,
    accessorKey: 'plan',
    cell: ({ row }) => (
      <span className='inline-flex h-6 items-center rounded-md bg-muted/70 px-2 text-xs font-medium leading-tight text-foreground'>
        {row.getValue('plan')}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='City' />,
    accessorKey: 'city',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('city')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Barangay' />,
    accessorKey: 'barangay',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('barangay')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string

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
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`Open actions for ${row.original.name}`}
        >
          <MoreHorizontal aria-hidden='true' />
        </Button>
      </div>
    ),
  },
]
