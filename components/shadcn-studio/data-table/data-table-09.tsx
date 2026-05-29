'use client'

import { Fragment } from 'react'
import { motion } from 'motion/react'

import type { ColumnDef } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Subscriber = {
  id: string
  name: string
  email: string
  status: string
  joinDate: string
}

const data: Subscriber[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Active',
    joinDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'Active',
    joinDate: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'Inactive',
    joinDate: '2024-03-10',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    status: 'Active',
    joinDate: '2024-04-05',
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    status: 'Active',
    joinDate: '2024-05-12',
  }
]

const columns: ColumnDef<Subscriber>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          {...{
            className: 'size-7 text-muted-foreground',
            onClick: row.getToggleExpandedHandler(),
            'aria-expanded': row.getIsExpanded(),
            'aria-label': row.getIsExpanded()
              ? `Collapse details for ${row.original.name}`
              : `Expand details for ${row.original.name}`,
            size: 'icon',
            variant: 'ghost'
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronUpIcon className='opacity-60' aria-hidden='true' />
          ) : (
            <ChevronDownIcon className='opacity-60' aria-hidden='true' />
          )}
        </Button>
      ) : (
        <div className='size-7' />
      )
    }
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => row.getValue('email')
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const isActive = status === 'Active'
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {status}
        </Badge>
      )
    }
  },
  {
    header: 'Join Date',
    accessorKey: 'joinDate',
    cell: ({ row }) => row.getValue('joinDate')
  }
]

const DataTableWithExpandableRowsDemo = () => {
  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  })

  return (
    <div className='w-full'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  <motion.tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className='[&:has([aria-expanded])]: [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0'
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                  {row.getIsExpanded() && (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={row.getVisibleCells().length} className='p-4'>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                          className='space-y-2 text-sm'
                        >
                          <div className='grid grid-cols-2 gap-4'>
                            <div>
                              <p className='font-semibold text-muted-foreground'>Subscriber ID</p>
                              <p>{row.original.id}</p>
                            </div>
                            <div>
                              <p className='font-semibold text-muted-foreground'>Email</p>
                              <p>{row.original.email}</p>
                            </div>
                            <div>
                              <p className='font-semibold text-muted-foreground'>Status</p>
                              <p>{row.original.status}</p>
                            </div>
                            <div>
                              <p className='font-semibold text-muted-foreground'>Join Date</p>
                              <p>{row.original.joinDate}</p>
                            </div>
                          </div>
                        </motion.div>
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
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Data table with expanding sub-rows</p>
    </div>
  )
}

export default DataTableWithExpandableRowsDemo
