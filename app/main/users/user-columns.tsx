'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Ellipsis as MoreHorizontal, Pencil, TrashBin } from '@gravity-ui/icons'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/animate-ui/components/radix/dropdown-menu'
import { SortableColumnHeader } from '@/components/data-table/shared/sortable-column-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SystemUser, SystemUserPermission } from '@/lib/system-user-types'

export const userColumnClassNames: Record<string, string> = {
  fullName: 'w-[34%] min-w-[260px]',
  permission: 'w-[26%] min-w-[190px]',
  lastSignInAt: 'w-[20%] min-w-[150px]',
  createdAt: 'w-[18%] min-w-[140px]',
  action: 'w-[10%] min-w-[64px]',
}

const permissionStyles: Record<SystemUserPermission, string> = {
  administrator: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  billing_management: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  operations: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}
const permissionLabels: Record<SystemUserPermission, string> = { administrator: 'Administrator', billing_management: 'Billing Management', operations: 'Operations' }

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : 'Never'

export function getUserColumns({ onEdit, onDelete }: { onEdit: (user: SystemUser) => void; onDelete: (user: SystemUser) => void }): ColumnDef<SystemUser>[] {
  return [
    {
      accessorKey: 'fullName',
      header: ({ column }) => <SortableColumnHeader column={column} title='User' />,
      cell: ({ row }) => {
        const user = row.original
        return <div className='flex min-w-0 items-center gap-2.5'>
          <Avatar className='size-8 shrink-0'><AvatarFallback className='text-xs'>{(user.fullName || user.email).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <div className='min-w-0'><p className='truncate font-medium leading-tight text-foreground'>{user.fullName || 'Unnamed user'}</p><p className='truncate text-xs text-muted-foreground'>{user.email}</p></div>
        </div>
      },
      filterFn: (row, _id, value) => `${row.original.fullName} ${row.original.email} ${row.original.permissionName} ${row.original.branchName ?? ''}`.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      accessorKey: 'permission',
      header: ({ column }) => <SortableColumnHeader column={column} title='Permission' />,
      cell: ({ row }) => <div className='flex flex-col items-start gap-1'><Badge variant='outline' className={cn('inline-flex h-6 items-center gap-1.5 px-2 py-0.5 font-medium', permissionStyles[row.original.permission])}><span className='size-1.5 rounded-full bg-current' aria-hidden='true' />{row.original.permissionName || permissionLabels[row.original.permission]}</Badge>{row.original.branchName && <span className='truncate text-xs text-muted-foreground'>{row.original.branchName}</span>}</div>,
    },
    {
      accessorKey: 'lastSignInAt',
      header: ({ column }) => <SortableColumnHeader column={column} title='Last Sign In' />,
      cell: ({ row }) => <span className='block truncate text-[13px] text-muted-foreground'>{formatDate(row.original.lastSignInAt)}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableColumnHeader column={column} title='Created' />,
      cell: ({ row }) => <span className='block truncate text-[13px] text-muted-foreground'>{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'action', enableSorting: false, header: () => <div className='text-right'>Action</div>,
      cell: ({ row }) => <div className='flex justify-end'><DropdownMenu><DropdownMenuTrigger asChild><Button type='button' variant='ghost' size='icon-sm' aria-label={`Open actions for ${row.original.fullName}`}><MoreHorizontal aria-hidden='true' /></Button></DropdownMenuTrigger><DropdownMenuContent align='end' className='w-36'><DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil aria-hidden='true' />Edit</DropdownMenuItem><DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}><TrashBin aria-hidden='true' />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>,
    },
  ]
}
