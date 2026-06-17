import { getInstallationsPageData } from '@/lib/installations'

import InstallationsDataTable from './_components/data-table/data-table'

export const dynamic = 'force-dynamic'

export default async function InstallationsPage() {
  const { installations, installableSubscribers } = await getInstallationsPageData()

  return (
    <div className='min-w-0 w-full'>
      <InstallationsDataTable
        initialInstallations={installations}
        initialInstallableSubscribers={installableSubscribers}
      />
    </div>
  )
}
