'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Check, Ellipsis as MoreHorizontal } from '@gravity-ui/icons'

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
import type { ServiceRequest, ServiceRequestStatus } from '@/lib/service-requests'

export const serviceRequestColumnClassNames: Record<string, string> = {
  subscriberName: 'w-[23%] min-w-[190px]',
  plan: 'w-[16%] min-w-[132px]',
  paymentDate: 'w-[13%] min-w-[112px]',
  expirationDate: 'w-[13%] min-w-[112px]',
  remark: 'w-[19%] min-w-[160px]',
  status: 'w-[10%] min-w-[98px]',
  action: 'w-[6%] min-w-[64px]',
}

const statusStyles: Record<ServiceRequestStatus, string> = {
  Pending: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Verified: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export const getServiceRequestColumns = ({ onVerify }: {
  onVerify: (request: ServiceRequest) => void
}): ColumnDef<ServiceRequest>[] => [
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
    header: ({ column }) => <SortableColumnHeader column={column} title='Plan' />,
    accessorKey: 'plan',
    cell: ({ row }) => <span className='block truncate leading-tight text-muted-foreground'>{row.original.plan}</span>,
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Payment date' />,
    accessorKey: 'paymentDate',
    cell: ({ row }) => <span className='block truncate leading-tight text-muted-foreground'>{row.original.paymentDate}</span>,
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Expires' />,
    accessorKey: 'expirationDate',
    cell: ({ row }) => <span className='block truncate leading-tight text-muted-foreground'>{row.original.expirationDate}</span>,
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Remark' />,
    accessorKey: 'remark',
    cell: ({ row }) => <span className='block truncate leading-tight text-muted-foreground'>{row.original.remark || '-'}</span>,
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const value = row.original.status
      return (
        <Badge variant='outline' className={cn('inline-flex h-6 items-center gap-1.5 px-2 py-0.5 font-medium', statusStyles[value])}>
          <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />{value}
        </Badge>
      )
    },
  },
  {
    id: 'action', enableSorting: false,
    header: () => <div className='text-right'>Action</div>,
    cell: ({ row }) => row.original.status === 'Pending' ? (
      <div className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type='button' variant='ghost' size='icon-sm' aria-label={`Open actions for ${row.original.subscriberName}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuLabel>{row.original.subscriberName}</DropdownMenuLabel><DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onVerify(row.original)}><Check />Verify request</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : <div />,
  },
]
