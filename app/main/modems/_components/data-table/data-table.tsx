'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

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

import { ModemModal } from '../modals/modem-modal'
import { getModemColumns, modemColumnClassNames } from './columns'
import type { Modem } from './types'

type ModemsDataTableProps = {
  initialModems: Modem[]
  onModemsChange?: (modems: Modem[]) => void
}

export default function ModemsDataTable({
  initialModems,
  onModemsChange,
}: ModemsDataTableProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modems, setModems] = useState(initialModems)
  const [editingModem, setEditingModem] = useState<Modem | null>(null)
  const [pendingDeleteModem, setPendingDeleteModem] = useState<Modem | null>(null)
  const isCreateOpen = searchParams.get('create') === '1'

  const updateModems = (getModems: (currentModems: Modem[]) => Modem[]) => {
    setModems((currentModems) => {
      const nextModems = getModems(currentModems)
      onModemsChange?.(nextModems)

      return nextModems
    })
  }

  const closeCreateModal = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('create')
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const columns = useMemo(
    () =>
      getModemColumns({
        onEdit: setEditingModem,
        onDelete: setPendingDeleteModem,
      }),
    [],
  )

  const handleDeleteModem = async () => {
    if (!pendingDeleteModem) return

    const response = await fetch(`/api/modems/${pendingDeleteModem.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.error('Unable to delete modem', await response.json().catch(() => null))
      return
    }

    updateModems((currentModems) =>
      currentModems.filter((currentModem) => currentModem.id !== pendingDeleteModem.id),
    )
    setEditingModem((currentModem) =>
      currentModem?.id === pendingDeleteModem.id ? null : currentModem,
    )
    setPendingDeleteModem(null)
  }

  const handleCreateModem = async (modem: Modem) => {
    const response = await fetch('/api/modems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modem),
    })

    if (!response.ok) {
      console.error('Unable to create modem', await response.json().catch(() => null))
      return
    }

    const { modem: createdModem } = (await response.json()) as {
      modem: Modem
    }

    updateModems((currentModems) => [createdModem, ...currentModems])
    closeCreateModal()
  }

  const handleUpdateModem = async (updatedModem: Modem) => {
    const response = await fetch(`/api/modems/${updatedModem.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedModem),
    })

    if (!response.ok) {
      console.error('Unable to update modem', await response.json().catch(() => null))
      return
    }

    const { modem: savedModem } = (await response.json()) as {
      modem: Modem
    }

    updateModems((currentModems) =>
      currentModems.map((modem) => (modem.id === savedModem.id ? savedModem : modem)),
    )
    setEditingModem(null)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={modems}
        columnClassNames={modemColumnClassNames}
        itemLabel='modems'
        minWidthClassName='min-w-[640px]'
      />
      <ModemModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
        }}
        onCancel={closeCreateModal}
        onSubmit={handleCreateModem}
      />
      <ModemModal
        modem={editingModem}
        open={Boolean(editingModem)}
        onOpenChange={(open) => {
          if (!open) setEditingModem(null)
        }}
        onCancel={() => setEditingModem(null)}
        onSubmit={handleUpdateModem}
      />
      <Dialog
        open={Boolean(pendingDeleteModem)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteModem(null)
        }}
      >
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Delete modem?</DialogTitle>
            <DialogDescription>
              {pendingDeleteModem?.name} will be removed from Manage Modem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type='button' variant='ghost' size='sm' onClick={() => setPendingDeleteModem(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' size='sm' onClick={handleDeleteModem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
