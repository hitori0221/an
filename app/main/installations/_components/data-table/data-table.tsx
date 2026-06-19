'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Row } from '@tanstack/react-table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { DataTable } from '@/components/data-table/shared/data-table'
import { Button } from '@/components/ui/button'

import { InstallationModal } from '../modals/installation-modal'
import { installationColumnClassNames, getInstallationColumns } from './columns'
import type {
  Installation,
  InstallationInput,
  InstallationStatus,
  InstallationSubscriberOption,
} from './types'

type InstallationsDataTableProps = {
  initialInstallations: Installation[]
  initialInstallableSubscribers: InstallationSubscriberOption[]
}

function renderInstallationExpandedRow(row: Row<Installation>) {
  return (
    <div className='border-t bg-muted/20 px-4 py-3'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Installation ID</p>
          <p className='text-sm text-foreground'>{row.original.id}</p>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>Contact</p>
          <p className='text-sm text-foreground'>{row.original.phoneNumber}</p>
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

export default function InstallationsDataTable({
  initialInstallations,
  initialInstallableSubscribers,
}: InstallationsDataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [installations, setInstallations] = useState(initialInstallations)
  const [installableSubscribers, setInstallableSubscribers] = useState(initialInstallableSubscribers)
  const [editingInstallation, setEditingInstallation] = useState<Installation | null>(null)
  const [pendingDeleteInstallation, setPendingDeleteInstallation] = useState<Installation | null>(null)
  const isCreateOpen = searchParams.get('create') === '1'
  const modalSubscribers = useMemo(() => {
    if (!editingInstallation) return installableSubscribers

    return [
      {
        id: editingInstallation.subscriberId,
        accountNumber: editingInstallation.accountNumber,
        name: editingInstallation.name,
        phoneNumber: editingInstallation.phoneNumber,
        plan: editingInstallation.plan,
        branch: editingInstallation.branch,
        city: editingInstallation.city,
        barangay: editingInstallation.barangay,
        address: editingInstallation.address,
      },
      ...installableSubscribers,
    ]
  }, [editingInstallation, installableSubscribers])
  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleCreateInstallation = async (input: InstallationInput) => {
    const response = await fetch('/api/installations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to create installation', await response.json().catch(() => null))
      return false
    }

    const { installation } = (await response.json()) as {
      installation: Installation
    }

    setInstallations((currentInstallations) => [installation, ...currentInstallations])
    setInstallableSubscribers((currentSubscribers) =>
      currentSubscribers.filter((subscriber) => subscriber.id !== installation.subscriberId),
    )
    closeCreateModal()

    return true
  }

  const handleUpdateInstallation = async (input: InstallationInput) => {
    if (!editingInstallation) return false

    const installation = await updateInstallation(editingInstallation.id, input)
    if (!installation) return false

    setEditingInstallation(null)

    return true
  }

  const handleUpdateInstallationStatus = async (
    installation: Installation,
    status: InstallationStatus,
  ) => {
    await updateInstallation(installation.id, {
      subscriberId: installation.subscriberId,
      technician: installation.technician,
      crew: installation.crew,
      scheduleDate: installation.scheduleDateValue,
      installedAt: installation.installedAtValue,
      status,
      materials: installation.materials,
      notes: installation.notes,
    })
  }

  const updateInstallation = async (installationId: string, input: InstallationInput) => {
    const response = await fetch(`/api/installations/${installationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      console.error('Unable to update installation', await response.json().catch(() => null))
      return null
    }

    const { installation } = (await response.json()) as {
      installation: Installation
    }

    setInstallations((currentInstallations) =>
      currentInstallations.map((currentInstallation) =>
        currentInstallation.id === installation.id ? installation : currentInstallation,
      ),
    )

    return installation
  }

  const handleDeleteInstallation = async () => {
    if (!pendingDeleteInstallation) return

    const response = await fetch(`/api/installations/${pendingDeleteInstallation.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete installation', await response.json().catch(() => null))
      return
    }

    setInstallations((currentInstallations) =>
      currentInstallations.filter((installation) => installation.id !== pendingDeleteInstallation.id),
    )
    setInstallableSubscribers((currentSubscribers) => [
      {
        id: pendingDeleteInstallation.subscriberId,
        accountNumber: pendingDeleteInstallation.accountNumber,
        name: pendingDeleteInstallation.name,
        phoneNumber: pendingDeleteInstallation.phoneNumber,
        plan: pendingDeleteInstallation.plan,
        branch: pendingDeleteInstallation.branch,
        city: pendingDeleteInstallation.city,
        barangay: pendingDeleteInstallation.barangay,
        address: pendingDeleteInstallation.address,
      },
      ...currentSubscribers,
    ])
    setPendingDeleteInstallation(null)
  }

  const columns = getInstallationColumns({
    onEdit: setEditingInstallation,
    onStatusChange: (installation, status) => {
      void handleUpdateInstallationStatus(installation, status)
    },
    onDelete: setPendingDeleteInstallation,
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={installations}
        columnClassNames={installationColumnClassNames}
        itemLabel='installations'
        minWidthClassName='min-w-[878px]'
        renderExpandedRow={renderInstallationExpandedRow}
      />
      <InstallationModal
        open={isCreateOpen}
        subscribers={installableSubscribers}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        onCancel={closeCreateModal}
        onSubmit={handleCreateInstallation}
      />
      <InstallationModal
        open={Boolean(editingInstallation)}
        installation={editingInstallation}
        subscribers={modalSubscribers}
        onOpenChange={(open) => {
          if (!open) setEditingInstallation(null)
        }}
        onCancel={() => setEditingInstallation(null)}
        onSubmit={handleUpdateInstallation}
      />
      <Dialog
        open={Boolean(pendingDeleteInstallation)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteInstallation(null)
        }}
      >
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Delete installation?</DialogTitle>
            <DialogDescription>
              {pendingDeleteInstallation?.accountNumber} will be removed from the installation table.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setPendingDeleteInstallation(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleDeleteInstallation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
