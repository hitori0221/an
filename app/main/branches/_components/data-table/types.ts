export type BranchStatus = 'Active' | 'Maintenance' | 'Inactive'

export type Branch = {
  id: string
  name: string
  code: string
  address: string
  subscribers: number
  status: BranchStatus
  updatedAt: string
}
