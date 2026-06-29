import { getExpirationsPageData } from '@/lib/billing'

import { ExpirationsClient } from '../billing/_components/data-table/expirations-client'

export const dynamic = 'force-dynamic'

export default async function ExpirationsPage() {
  const { accounts, subscribers } = await getExpirationsPageData()

  return <ExpirationsClient accounts={accounts} subscribers={subscribers} />
}
