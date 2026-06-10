import { listBranches } from '@/lib/branches'

import { BranchesClient } from './_components/branches-client'

export const dynamic = 'force-dynamic'

export default async function BranchesPage() {
  const branches = await listBranches()

  return <BranchesClient initialBranches={branches} />
}
