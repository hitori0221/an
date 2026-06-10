'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  Pencil,
  Ellipsis as MoreHorizontal,
  TrashBin,
} from '@gravity-ui/icons'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Branch, BranchStatus } from './types'

export const branchColumnClassNames: Record<string, string> = {
  code: 'w-[20%] min-w-[178px]',
  name: 'w-[24%] min-w-[160px]',
  address: 'w-[26%] min-w-[190px]',
  subscribers: 'w-[13%] min-w-[118px]',
  status: 'w-[11%] min-w-[112px]',
  action: 'w-[6%] min-w-[64px]',
}

const statusStyles: Record<BranchStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Maintenance: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

type GetBranchColumnsOptions = {
  onEdit: (branch: Branch) => void
  onDelete: (branch: Branch) => void
}

export const getBranchColumns = ({
  onEdit,
  onDelete,
}: GetBranchColumnsOptions): ColumnDef<Branch>[] => [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Branch Code' />,
    accessorKey: 'code',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        <span className='font-mono text-[13px] leading-tight text-foreground'>{row.getValue('code')}</span>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Branch' />,
    accessorKey: 'name',
    cell: ({ row }) => (
      <span className='block truncate font-medium leading-tight text-foreground'>{row.getValue('name')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Location' />,
    accessorKey: 'address',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.getValue('address')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Subscribers' />,
    accessorKey: 'subscribers',
    cell: ({ row }) => (
      <span className='block text-right font-medium leading-tight text-foreground'>{row.getValue('subscribers')}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BranchStatus

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
          <DropdownMenuContent align='end' className='w-36'>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
              <TrashBin />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
