'use client'

import { Fragment, ReactNode, useDeferredValue, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

import type {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from '@gravity-ui/icons'

import { Highlight, HighlightItem } from '@/components/animate-ui/primitives/effects/highlight'
import { Collapsible, CollapsibleContent } from '@/components/animate-ui/primitives/radix/collapsible'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useTableSearch } from './table-search-context'

const DEFAULT_PAGE_SIZE = 15
const MIN_PAGE_SIZE = 5
const TABLE_HEADER_HEIGHT = 37
const TABLE_ROW_HEIGHT = 41
const PAGINATION_TOP_MARGIN = 12
const PAGE_BOTTOM_GAP = 32

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  columnClassNames: Record<string, string>
  itemLabel: string
  minWidthClassName: string
  renderExpandedRow?: (row: Row<TData>) => ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  columnClassNames,
  itemLabel,
  minWidthClassName,
  renderExpandedRow,
}: DataTableProps<TData, TValue>) {
  const { search } = useTableSearch()
  const globalFilter = useDeferredValue(search)
  const rootRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  useLayoutEffect(() => {
    const updatePageSize = () => {
      const root = rootRef.current
      if (!root) return

      const paginationHeight = paginationRef.current?.getBoundingClientRect().height ?? 0
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      const availableHeight =
        viewportHeight -
        root.getBoundingClientRect().top -
        paginationHeight -
        PAGINATION_TOP_MARGIN -
        TABLE_HEADER_HEIGHT -
        PAGE_BOTTOM_GAP
      const pageSize = Math.max(MIN_PAGE_SIZE, Math.floor(availableHeight / TABLE_ROW_HEIGHT))

      setPagination((current) =>
        current.pageSize === pageSize
          ? current
          : {
              pageIndex: 0,
              pageSize,
            },
      )
    }

    updatePageSize()

    const resizeObserver = new ResizeObserver(updatePageSize)
    resizeObserver.observe(document.documentElement)
    if (rootRef.current) resizeObserver.observe(rootRef.current)
    if (paginationRef.current) resizeObserver.observe(paginationRef.current)
    window.addEventListener('resize', updatePageSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePageSize)
    }
  }, [])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowCanExpand: () => Boolean(renderExpandedRow),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div ref={rootRef} className='min-w-0 w-full'>
      <Highlight
        hover
        controlledItems
        mode='parent'
        forceUpdateBounds
        boundsOffset={{ top: -1, left: -1, width: 2, height: 1 }}
        className='bg-sidebar-accent/80'
        containerClassName='relative max-w-full overflow-hidden rounded-md border bg-background shadow-xs [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden'
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      >
        <Table className={cn('table-fixed', minWidthClassName)}>
          <TableHeader className='bg-muted/25'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn('h-9 overflow-hidden border-b px-3', columnClassNames[header.column.id])}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <HighlightItem
                    asChild
                    value={row.id}
                    activeClassName='bg-sidebar-accent/80'
                  >
                    <motion.tr
                      data-state={row.getIsSelected() && 'selected'}
                      className='border-b transition-colors data-[state=selected]:bg-muted h-[41px]'
                      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'overflow-hidden px-3 py-1.5 h-full [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-1',
                            columnClassNames[cell.column.id],
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  </HighlightItem>
                  {renderExpandedRow && (
                    <TableRow className={row.getIsExpanded() ? 'border-b hover:bg-transparent' : 'border-0 hover:bg-transparent'}>
                      <TableCell colSpan={row.getVisibleCells().length} className='p-0'>
                        <Collapsible open={row.getIsExpanded()}>
                          <CollapsibleContent
                            keepRendered
                            className='text-sm'
                            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            animate={
                              row.getIsExpanded()
                                ? { opacity: 1, height: 'auto', overflow: 'hidden' }
                                : { opacity: 0, height: 0, overflow: 'hidden' }
                            }
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                          >
                            {renderExpandedRow(row)}
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Highlight>
      <div ref={paginationRef} className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} {itemLabel}
        </p>
        <div className='flex items-center justify-end gap-2'>
          <p className='mr-2 text-sm text-muted-foreground'>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <Button
            type='button'
            variant='outline'
            size='icon-xs'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label='Go to first page'
          >
            <ChevronsLeft aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-xs'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label='Go to previous page'
          >
            <ChevronLeft aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-xs'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label='Go to next page'
          >
            <ChevronRight aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-xs'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label='Go to last page'
          >
            <ChevronsRight aria-hidden='true' />
          </Button>
        </div>
      </div>
    </div>
  )
}
