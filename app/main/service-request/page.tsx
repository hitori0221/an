'use client'

import { useSearchParams } from 'next/navigation'

export default function ServiceRequestPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? 'Service Request'

  return (
    <div className='min-w-0 w-full'>
      <div className='rounded-md border bg-background px-5 py-6 shadow-xs'>
        <h1 className='text-xl font-semibold leading-tight text-foreground'>{category}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>No service requests yet.</p>
      </div>
    </div>
  )
}
