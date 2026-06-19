import { getPaymentsPageData } from '@/lib/billing'

import { PaymentsClient } from '../billing/_components/data-table/payments-client'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const { payments, openInvoices, subscribers } = await getPaymentsPageData()

  return (
    <PaymentsClient
      initialPayments={payments}
      initialOpenInvoices={openInvoices}
      subscribers={subscribers}
    />
  )
}
