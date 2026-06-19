import { getJobOrdersPageData } from '@/lib/job-orders'

import JobOrdersDataTable from './_components/data-table/data-table'

export const dynamic = 'force-dynamic'

export default async function JobOrdersPage() {
  const { jobOrders, subscribers, nextTicketNumber } = await getJobOrdersPageData()

  return (
    <div className='min-w-0 w-full'>
      <JobOrdersDataTable
        initialJobOrders={jobOrders}
        subscribers={subscribers}
        initialNextTicketNumber={nextTicketNumber}
      />
    </div>
  )
}
