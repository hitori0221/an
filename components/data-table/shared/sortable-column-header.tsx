'use client'

import type { Column } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpArrowDown as ArrowUpDown,
} from '@gravity-ui/icons'

import { Button } from '@/components/ui/button'

type SortableColumnHeaderProps<TData> = {
  column: Column<TData>
  title: string
}

export function SortableColumnHeader<TData>({
  column,
  title,
}: SortableColumnHeaderProps<TData>) {
  const sortDirection = column.getIsSorted()
  const Icon =
    sortDirection === 'asc'
      ? ArrowUp
      : sortDirection === 'desc'
        ? ArrowDown
        : ArrowUpDown

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className='-ml-2 h-8 px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
      onClick={() => column.toggleSorting(sortDirection === 'asc')}
      aria-label={`Sort by ${title}`}
    >
      {title}
      <Icon className='ml-1 opacity-60' aria-hidden='true' />
    </Button>
  )
}
