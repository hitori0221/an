import { getCollectionsPageData } from '@/lib/billing'

import { CollectionsClient } from '../billing/_components/data-table/collections-client'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const { payments, summaries } = await getCollectionsPageData()

  return <CollectionsClient payments={payments} summaries={summaries} />
}
