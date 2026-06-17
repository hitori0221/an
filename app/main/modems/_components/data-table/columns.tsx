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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { Modem, ModemStatus } from './types'

export const modemColumnClassNames: Record<string, string> = {
  code: 'w-[28%] min-w-[180px]',
  name: 'w-[42%] min-w-[220px]',
  status: 'w-[20%] min-w-[132px]',
  action: 'w-[10%] min-w-[64px]',
}

const statusStyles: Record<ModemStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Maintenance: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

type GetModemColumnsOptions = {
  onEdit: (modem: Modem) => void
  onDelete: (modem: Modem) => void
}

export const getModemColumns = ({
  onEdit,
  onDelete,
}: GetModemColumnsOptions): ColumnDef<Modem>[] => [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Modem Code' />,
    accessorKey: 'code',
    cell: ({ row }) => (
      <span className='block truncate text-[13px] leading-tight text-foreground'>
        {row.getValue('code')}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Modem Name' />,
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='min-w-0'>
        <p className='truncate font-medium leading-tight text-foreground'>{row.original.name}</p>
        <p className='truncate text-xs text-muted-foreground'>Updated {row.original.updatedAt}</p>
      </div>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as ModemStatus

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
              aria-label={`Open actions for ${row.original.name}`}
            >
              <MoreHorizontal aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-36'>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil aria-hidden='true' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
              <TrashBin aria-hidden='true' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
