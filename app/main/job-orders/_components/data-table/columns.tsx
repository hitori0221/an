'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Ellipsis as MoreHorizontal,
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

import type { JobOrder, JobOrderPriority, JobOrderStatus } from './types'

export const jobOrderColumnClassNames: Record<string, string> = {
  ticketNumber: 'w-[15%] min-w-[136px]',
  subscriberName: 'w-[16%] min-w-[138px]',
  problemCategory: 'w-[16%] min-w-[138px]',
  priority: 'w-[10%] min-w-[88px]',
  technician: 'w-[14%] min-w-[122px]',
  status: 'w-[12%] min-w-[112px]',
  createdDate: 'w-[11%] min-w-[112px]',
  action: 'w-[6%] min-w-[64px]',
}

const statusStyles: Record<JobOrderStatus, string> = {
  Open: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Assigned: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  'In Progress': 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Resolved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Closed: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  Cancelled: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
}

const priorityStyles: Record<JobOrderPriority, string> = {
  Low: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  Medium: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  High: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Urgent: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
}

export const jobOrderColumns: ColumnDef<JobOrder>[] = [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Ticket Number' />,
    accessorKey: 'ticketNumber',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        <Button
          className='size-7 text-muted-foreground hover:text-foreground'
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          aria-label={
            row.getIsExpanded()
              ? `Collapse job order details for ${row.original.ticketNumber}`
              : `Expand job order details for ${row.original.ticketNumber}`
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
        <span className='font-mono text-[13px] leading-tight text-foreground'>{row.getValue('ticketNumber')}</span>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Subscriber' />,
    accessorKey: 'subscriberName',
    cell: ({ row }) => (
      <span className='block truncate font-medium leading-tight text-foreground'>{row.getValue('subscriberName')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Problem' />,
    accessorKey: 'problemCategory',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('problemCategory')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Priority' />,
    accessorKey: 'priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as JobOrderPriority

      return (
        <Badge
          variant='outline'
          className={cn('flex h-6 items-center px-2 py-0.5 font-medium', priorityStyles[priority])}
        >
          {priority}
        </Badge>
      )
    },
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Technician' />,
    accessorKey: 'technician',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-foreground'>{row.getValue('technician')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as JobOrderStatus

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
    header: ({ column }) => <SortableColumnHeader column={column} title='Created' />,
    accessorKey: 'createdDate',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('createdDate')}</span>
    ),
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
              aria-label={`Open actions for ${row.original.ticketNumber}`}
            >
              <MoreHorizontal aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuLabel>{row.original.ticketNumber}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <span>Assign technician</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Mark resolved</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive'>
              <span>Cancel ticket</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
