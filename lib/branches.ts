import { createClient } from '@/lib/supabase/server'

import type { Branch } from '@/app/main/branches/_components/data-table/types'

type BranchRow = {
  id: string
  branch_code: string
  name: string
  address: string
  subscriber_count: { count: number }[] | { count: number } | null
  status: Branch['status']
  updated_at: string
}

const branchSelect = `
  id,
  branch_code,
  name,
  address,
  subscriber_count:subscribers(count),
  status,
  updated_at
`

const formatBranchDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const normalizeBranch = (branch: BranchRow): Branch => ({
  id: branch.id,
  code: branch.branch_code,
  name: branch.name,
  address: branch.address,
  subscribers: Array.isArray(branch.subscriber_count)
    ? (branch.subscriber_count[0]?.count ?? 0)
    : (branch.subscriber_count?.count ?? 0),
  status: branch.status,
  updatedAt: formatBranchDate(branch.updated_at),
})

export async function listBranches() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branches')
    .select(branchSelect)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Unable to load branches: ${error.message}`)
  }

  return ((data ?? []) as BranchRow[]).map(normalizeBranch)
}

export async function createBranch(input: Branch) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branches')
    .insert({
      branch_code: input.code,
      name: input.name,
      address: input.address,
      status: input.status,
    })
    .select(branchSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create branch: ${error.message}`)
  }

  return normalizeBranch(data as BranchRow)
}

export async function updateBranch(input: Branch) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branches')
    .update({
      branch_code: input.code,
      name: input.name,
      address: input.address,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select(branchSelect)
    .single()

  if (error) {
    throw new Error(`Unable to update branch: ${error.message}`)
  }

  return normalizeBranch(data as BranchRow)
}

export async function deleteBranch(branchId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('branches').delete().eq('id', branchId)

  if (error) {
    throw new Error(`Unable to delete branch: ${error.message}`)
  }
}
