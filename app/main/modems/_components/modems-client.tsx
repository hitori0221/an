'use client'

import { useState } from 'react'

import ModemsDataTable from './data-table/data-table'
import type { Modem } from './data-table/types'

type ModemsClientProps = {
  initialModems: Modem[]
}

export function ModemsClient({ initialModems }: ModemsClientProps) {
  const [modems, setModems] = useState(initialModems)
  const activeModems = modems.filter((modem) => modem.status === 'Active').length
  const maintenanceModems = modems.filter((modem) => modem.status === 'Maintenance').length

  return (
    <div className='min-w-0 w-full space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Manage Modem</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Manage modem inventory codes, modem names, and operating status.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Total modems</p>
          <p className='mt-1 text-2xl font-semibold'>{modems.length}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Active</p>
          <p className='mt-1 text-2xl font-semibold'>{activeModems}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Maintenance</p>
          <p className='mt-1 text-2xl font-semibold'>{maintenanceModems}</p>
        </div>
      </div>

      <ModemsDataTable initialModems={modems} onModemsChange={setModems} />
    </div>
  )
}
