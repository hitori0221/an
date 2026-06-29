'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { DataTable } from '@/components/data-table/shared/data-table'

import { PaymentModal } from '../modals/payment-modal'
import { getExpirationColumns, expirationColumnClassNames } from './expiration-columns'
import type {
  BillingExpirationAccount,
  BillingPayment,
  BillingPaymentInput,
  BillingSubscriberOption,
  BillingSubscriptionStatus,
} from './types'

type ExpirationsClientProps = {
  accounts: BillingExpirationAccount[]
  subscribers: BillingSubscriberOption[]
}

const readApiError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null

  return body?.error ?? fallback
}

const paymentInputToFormData = (input: BillingPaymentInput) => {
  const formData = new FormData()

  formData.set('subscriberId', input.subscriberId)
  formData.set('expirationDate', input.expirationDate)
  formData.set('amount', String(input.amount))
  formData.set('paymentDate', input.paymentDate)
  formData.set('method', input.method)
  formData.set('referenceNumber', input.referenceNumber)
  formData.set('collector', input.collector)
  formData.set('notes', input.notes)

  if (input.receiptPhoto) {
    formData.set('receiptPhoto', input.receiptPhoto)
  }

  return formData
}

const formatDisplayDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const parseDateValue = (value: string) => {
  const [yearValue, monthValue, dayValue] = value.split('-').map(Number)

  return new Date(yearValue, monthValue - 1, dayValue)
}

const getRemainingDays = (expirationDate: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayInMs = 24 * 60 * 60 * 1000

  return Math.ceil((parseDateValue(expirationDate).getTime() - today) / dayInMs)
}

export function ExpirationsClient({
  accounts: initialAccounts,
  subscribers,
}: ExpirationsClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const branchFilter = useSearchParams().get('branch') ?? 'all'
  const visibleAccounts = branchFilter === 'all'
    ? accounts
    : accounts.filter((account) => account.branchId === branchFilter)
  const [paymentAccount, setPaymentAccount] = useState<BillingExpirationAccount | null>(null)
  const expiredAccounts = visibleAccounts.filter((account) => account.remainingDays < 0).length
  const expiringSoonAccounts = visibleAccounts.filter(
    (account) => account.remainingDays >= 0 && account.remainingDays <= 7,
  ).length
  const activeAccounts = visibleAccounts.filter((account) => account.remainingDays > 7).length
  const columns = useMemo(
    () =>
      getExpirationColumns({
        onPostPayment: setPaymentAccount,
      }),
    [],
  )

  const handleCreatePayment = async (input: BillingPaymentInput) => {
    const response = await fetch('/api/billing/payments', {
      method: 'POST',
      body: paymentInputToFormData(input),
    })

    if (!response.ok) {
      console.error('Unable to post payment', await readApiError(response, 'Unable to post payment'))
      return false
    }

    const { payment } = (await response.json()) as { payment: BillingPayment }
    const remainingDays = getRemainingDays(payment.expirationDateValue)
    const billingStatus: BillingSubscriptionStatus = remainingDays < 0 ? 'Expired' : 'Active'

    setAccounts((currentAccounts) =>
      currentAccounts
        .map((account) =>
          account.id === payment.subscriberId
            ? {
                ...account,
                expirationDate: formatDisplayDate(payment.expirationDateValue),
                expirationDateValue: payment.expirationDateValue,
                remainingDays,
                billingStatus,
              }
            : account,
        )
        .sort((first, second) => first.remainingDays - second.remainingDays),
    )
    setPaymentAccount(null)

    return true
  }

  return (
    <div className='flex min-w-0 w-full flex-col gap-4'>
      <div className='flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='min-w-0 lg:max-w-md'>
          <h1 className='text-2xl font-semibold leading-tight text-foreground'>Expirations</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            Track subscriber renewal countdowns and see who is expired or close to expiry.
          </p>
        </div>
        <div className='grid w-full gap-2 sm:grid-cols-3 lg:max-w-2xl lg:flex-1'>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Expired</p>
            <p className='mt-0.5 text-xl font-semibold'>{expiredAccounts}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>Expiring in 7 days</p>
            <p className='mt-0.5 text-xl font-semibold'>{expiringSoonAccounts}</p>
          </div>
          <div className='rounded-md border bg-background px-4 py-2.5 shadow-xs'>
            <p className='text-xs font-medium text-muted-foreground'>More than 7 days left</p>
            <p className='mt-0.5 text-xl font-semibold'>{activeAccounts}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visibleAccounts}
        columnClassNames={expirationColumnClassNames}
        itemLabel='accounts'
        minWidthClassName='min-w-[936px]'
      />
      <PaymentModal
        open={Boolean(paymentAccount)}
        subscribers={subscribers}
        defaultSubscriberId={paymentAccount?.id}
        onOpenChange={(open) => {
          if (!open) setPaymentAccount(null)
        }}
        onCancel={() => setPaymentAccount(null)}
        onSubmit={handleCreatePayment}
      />
    </div>
  )
}
