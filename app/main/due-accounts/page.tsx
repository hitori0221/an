import { getDueAccountsPageData } from '@/lib/billing'

import { DueAccountsClient } from '../billing/_components/data-table/due-accounts-client'

export const dynamic = 'force-dynamic'

export default async function DueAccountsPage() {
  const { invoices, subscribers, autoGenerationResult } = await getDueAccountsPageData()

  return (
    <DueAccountsClient
      initialInvoices={invoices}
      subscribers={subscribers}
      initialGenerationResult={autoGenerationResult.generated > 0 ? autoGenerationResult : null}
    />
  )
}
