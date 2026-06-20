'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  CreditCard,
  Ellipsis as MoreHorizontal,
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

import type { BillingInvoice, BillingInvoiceStatus } from './types'

export const invoiceColumnClassNames: Record<string, string> = {
  invoiceNumber: 'w-[15%] min-w-[134px]',
  subscriberName: 'w-[18%] min-w-[160px]',
  servicePeriod: 'w-[17%] min-w-[176px]',
  dueDateValue: 'w-[12%] min-w-[112px]',
  amount: 'w-[12%] min-w-[112px]',
  balance: 'w-[12%] min-w-[112px]',
  status: 'w-[11%] min-w-[104px]',
  action: 'w-[8%] min-w-[64px]',
}

const statusStyles: Record<BillingInvoiceStatus, string> = {
  Unpaid: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
  Partial: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Overdue: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Paid: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Void: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

type GetInvoiceColumnsOptions = {
  onPostPayment: (invoice: BillingInvoice) => void
  onVoid: (invoice: BillingInvoice) => void
}

export const getInvoiceColumns = ({
  onPostPayment,
  onVoid,
}: GetInvoiceColumnsOptions): ColumnDef<BillingInvoice>[] => [
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Invoice' />,
    accessorKey: 'invoiceNumber',
    cell: ({ row }) => (
      <div className='flex items-center gap-2 font-medium'>
        <Button
          className='size-7 text-muted-foreground hover:text-foreground'
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          aria-label={
            row.getIsExpanded()
              ? `Collapse invoice details for ${row.original.invoiceNumber}`
              : `Expand invoice details for ${row.original.invoiceNumber}`
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
        <span className='text-[13px] leading-tight text-foreground'>{row.getValue('invoiceNumber')}</span>
      </div>
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
    header: ({ column }) => <SortableColumnHeader column={column} title='Service' />,
    accessorKey: 'servicePeriod',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.servicePeriod}</span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Due' />,
    accessorKey: 'dueDateValue',
    cell: ({ row }) => (
      <span className='block truncate leading-tight text-muted-foreground'>{row.original.dueDate}</span>
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
    header: ({ column }) => <SortableColumnHeader column={column} title='Balance' />,
    accessorKey: 'balance',
    cell: ({ row }) => (
      <span className='block text-right font-medium leading-tight text-foreground'>
        {currencyFormatter.format(row.original.balance)}
      </span>
    ),
  },
  {
    header: ({ column }) => <SortableColumnHeader column={column} title='Status' />,
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BillingInvoiceStatus

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
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={row.original.status === 'Paid' || row.original.status === 'Void'}
                onClick={() => onPostPayment(row.original)}
              >
                <CreditCard />
                Post payment
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              disabled={row.original.paidAmount > 0 || row.original.status === 'Void'}
              onClick={() => onVoid(row.original)}
            >
              <TrashBin />
              Void invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
