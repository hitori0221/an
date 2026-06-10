'use client'

import type { Row } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/shared/data-table'

import { installationColumnClassNames, installationColumns } from './columns'
import { installations } from './data'
import type { Installation } from './types'

function renderInstallationExpandedRow(row: Row<Installation>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Installation ID</p>
          <p className='font-mono text-sm text-foreground'>{row.original.id}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Contact</p>
          <p className='font-mono text-sm text-foreground'>{row.original.phoneNumber}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Lead / Crew</p>
          <p className='text-sm font-medium text-foreground'>{row.original.technician}</p>
          <p className='text-xs text-muted-foreground'>{row.original.crew}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Address</p>
          <p className='text-sm text-foreground'>{row.original.address}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Materials</p>
          <p className='text-sm text-foreground'>{row.original.materials}</p>
        </div>
        <div className='flex flex-col gap-1 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Notes</p>
          <p className='text-sm text-foreground'>{row.original.notes}</p>
        </div>
      </div>
    </div>
  )
}

export default function InstallationsDataTable() {
  return (
    <DataTable
      columns={installationColumns}
      data={installations}
      columnClassNames={installationColumnClassNames}
      itemLabel='installations'
      minWidthClassName='min-w-[878px]'
      renderExpandedRow={renderInstallationExpandedRow}
    />
  )
}
