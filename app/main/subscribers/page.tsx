'use client';

import SubscribersDataTable from './_components/data-table/data-table';
import { subscribers } from './_components/data-table/data';

export default function SubscribersPage() {
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.status === 'Active').length;
  const uniquePlans = new Set(subscribers.map((subscriber) => subscriber.plan)).size;

  return (
    <div className="min-w-0 w-full space-y-4">
      <div className='border-b pb-4'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Subscribers</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Manage subscriber accounts, service plans, contact details, and account status.
          </p>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Total subscribers</p>
          <p className='mt-1 text-2xl font-semibold'>{subscribers.length}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Active subscribers</p>
          <p className='mt-1 text-2xl font-semibold'>{activeSubscribers}</p>
        </div>
        <div className='rounded-md border bg-background px-4 py-3 shadow-xs'>
          <p className='text-xs font-medium text-muted-foreground'>Active plans</p>
          <p className='mt-1 text-2xl font-semibold'>{uniquePlans}</p>
        </div>
      </div>

      <SubscribersDataTable />
    </div>
  );
}
