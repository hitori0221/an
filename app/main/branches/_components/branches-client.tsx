'use client'

import { useState } from 'react'

import BranchesDataTable from './data-table/data-table'
import type { Branch } from './data-table/types'

type BranchesClientProps = {
  initialBranches: Branch[]
}

export function BranchesClient({ initialBranches }: BranchesClientProps) {
  const [branches, setBranches] = useState(initialBranches)
  const totalSubscribers = branches.reduce((total, branch) => total + branch.subscribers, 0)
  const maintenanceBranches = branches.filter((branch) => branch.status === 'Maintenance').length

  return (
    <div className='min-w-0 w-full space-y-4'>
      <div className='flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Manage Branch</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Manage branch locations, assigned staff, service coverage, and branch status.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Total branches</p>
          <p className='mt-1 text-2xl font-semibold'>{branches.length}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Covered subscribers</p>
          <p className='mt-1 text-2xl font-semibold'>{totalSubscribers}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Maintenance</p>
          <p className='mt-1 text-2xl font-semibold'>{maintenanceBranches}</p>
        </div>
      </div>

      <BranchesDataTable initialBranches={branches} onBranchesChange={setBranches} />
    </div>
  )
}
