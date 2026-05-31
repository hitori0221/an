'use client'

import type { Row } from '@tanstack/react-table'

import { DataTable } from '@/components/shadcn-studio/data-table/shared/data-table'

import { subscriberColumnClassNames, subscriberColumns } from './columns'
import { subscribers } from './data'
import type { Subscriber } from './types'

function renderSubscriberExpandedRow(row: Row<Subscriber>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Account Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.accountNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Phone Number</p>
          <p className='font-mono text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Plan</p>
          <p className='text-sm font-medium text-foreground'>{row.original.plan}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Location</p>
          <p className='text-sm text-foreground'>{row.original.barangay}, {row.original.city}</p>
        </div>
      </div>
    </div>
  )
}

export default function SubscribersDataTable() {
  return (
    <DataTable
      columns={subscriberColumns}
      data={subscribers}
      columnClassNames={subscriberColumnClassNames}
      itemLabel='subscribers'
      minWidthClassName='min-w-[892px]'
      renderExpandedRow={renderSubscriberExpandedRow}
    />
  )
}
