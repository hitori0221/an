'use client'

import Image from 'next/image'
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

import type { PlanStatus, SubscriptionPlan, SubscriptionPlanCategoryIcon } from './types'

export const subscriptionPlanColumnClassNames: Record<string, string> = {
  code: 'w-[14%] min-w-[124px]',
  name: 'w-[23%] min-w-[180px]',
  category: 'w-[15%] min-w-[154px]',
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

const visibleCategoryIconCount = 4

const getCategoryInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'

function CategoryIcon({
  category,
  index,
}: {
  category: SubscriptionPlanCategoryIcon
  index: number
}) {
  return (
    <span
      className={cn(
        'relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-[10px] font-semibold leading-none text-muted-foreground shadow-xs',
        index > 0 && '-ml-2',
      )}
      title={category.name}
    >
      {category.iconDataUrl ? (
        <Image
          src={category.iconDataUrl}
          alt=''
          fill
          unoptimized
          sizes='28px'
          className='scale-125 object-cover'
        />
      ) : (
        getCategoryInitials(category.name)
      )}
    </span>
  )
}

function CategoryBadge({ plan }: { plan: SubscriptionPlan }) {
  const categoryIcons =
    plan.categoryIcons && plan.categoryIcons.length > 0
      ? plan.categoryIcons
      : [
          {
            id: plan.categoryId ?? plan.groupId ?? plan.id,
            name: plan.category,
            iconDataUrl: null,
          },
        ]
  const visibleIcons = categoryIcons.slice(0, visibleCategoryIconCount)
  const hiddenIconCount = Math.max(categoryIcons.length - visibleIcons.length, 0)

  return (
    <span className='inline-flex max-w-full items-center gap-2 text-xs font-medium leading-tight text-foreground'>
      <span className='flex min-w-0 shrink-0 items-center' aria-hidden='true'>
        {visibleIcons.map((category, index) => (
          <CategoryIcon key={category.id} category={category} index={index} />
        ))}
        {hiddenIconCount > 0 ? (
          <span className='-ml-2 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted px-1 text-[10px] font-semibold leading-none text-muted-foreground shadow-xs'>
            +{hiddenIconCount}
          </span>
        ) : null}
      </span>
      <span className='truncate'>{plan.category}</span>
    </span>
  )
}

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
      <span className='block truncate text-[13px] leading-tight text-foreground'>
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
    cell: ({ row }) => <CategoryBadge plan={row.original} />,
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
