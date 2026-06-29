import { listServiceRequests, type ServiceRequestStatus } from '@/lib/service-requests'
import { ServiceRequestsClient } from './service-requests-client'

export const dynamic = 'force-dynamic'

export default async function ServiceRequestPage({ searchParams }: {
  searchParams: Promise<{ category?: string; status?: string }>
}) {
  const params = await searchParams
  const category = params.category ?? ''
  const status: ServiceRequestStatus | 'All' = params.status === 'Verified' || params.status === 'All'
    ? params.status : 'Pending'
  const data = category ? await listServiceRequests(category, status) : { category: null, requests: [] }

  return <ServiceRequestsClient category={data.category?.name ?? category} status={status} requests={data.requests} />
}
