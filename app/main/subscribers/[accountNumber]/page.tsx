import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from '@gravity-ui/icons'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSubscriberDetailsPageData } from '@/lib/subscribers'

export const dynamic = 'force-dynamic'

type SubscriberDetailsPageProps = {
  params: Promise<{ accountNumber: string }>
}

const statusStyles: Record<string, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Suspended: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

const toDisplayLabel = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

function DetailItem({
  label,
  value,
  mono,
  featured,
}: {
  label: string
  value?: string | null
  mono?: boolean
  featured?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-md border bg-background px-3 py-2.5',
        featured && 'border-primary/20 bg-primary/5',
      )}
    >
      <p className='text-[11px] font-medium uppercase text-muted-foreground'>{label}</p>
      <p
        className={cn(
          'mt-1 break-words text-sm text-foreground',
          mono && 'font-mono',
          featured && 'text-base font-semibold leading-tight',
        )}
      >
        {value || '-'}
      </p>
    </div>
  )
}

function DetailSection({
  title,
  eyebrow,
  marker,
  children,
}: {
  title: string
  eyebrow?: string
  marker?: string
  children: React.ReactNode
}) {
  return (
    <section className='rounded-lg border bg-card p-5 shadow-xs'>
      <div className='flex items-center justify-between gap-3 border-b pb-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='h-9 w-1 shrink-0 rounded-full bg-primary' aria-hidden='true' />
          <div className='min-w-0'>
            {eyebrow && <p className='text-[11px] font-medium uppercase text-muted-foreground'>{eyebrow}</p>}
            <h2 className='text-base font-semibold leading-tight text-card-foreground'>{title}</h2>
          </div>
        </div>
        {marker && (
          <Badge variant='secondary' className='rounded-md font-mono text-[11px]'>
            {marker}
          </Badge>
        )}
      </div>
      <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
    </section>
  )
}

function ContactCard({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div className='min-w-0 rounded-lg border bg-background px-4 py-3 shadow-xs'>
      <p className='text-[11px] font-medium uppercase text-muted-foreground'>{label}</p>
      <p className={cn('mt-1 truncate text-sm font-medium text-foreground', mono && 'font-mono')}>{value || '-'}</p>
    </div>
  )
}

function ServicePanel({
  category,
  plan,
  connection,
}: {
  category?: string | null
  plan?: string | null
  connection?: string | null
}) {
  return (
    <div className='rounded-lg border bg-background p-5 shadow-xs'>
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-[11px] font-medium uppercase text-muted-foreground'>Current service</p>
          <h2 className='mt-1 truncate text-lg font-semibold leading-tight text-foreground'>{plan || '-'}</h2>
        </div>
        <Badge variant='outline' className='rounded-md'>
          {connection || 'No connection'}
        </Badge>
      </div>
      <div className='mt-4 rounded-md border bg-muted/35 px-3 py-2'>
        <p className='text-[11px] font-medium uppercase text-muted-foreground'>Subscription category</p>
        <p className='mt-1 text-sm font-medium text-foreground'>{category || '-'}</p>
      </div>
    </div>
  )
}

function IdentityHeader({
  initials,
  name,
  accountNumber,
  status,
}: {
  initials: string
  name: string
  accountNumber: string
  status: string
}) {
  return (
    <div className='flex min-w-0 items-start gap-4'>
      <div className='flex size-16 shrink-0 items-center justify-center rounded-lg border bg-primary text-xl font-semibold text-primary-foreground shadow-xs'>
        {initials || 'S'}
      </div>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='secondary' className='rounded-md font-mono text-[11px]'>
            {accountNumber}
          </Badge>
          <Badge
            variant='outline'
            className={cn('flex h-7 shrink-0 items-center gap-1.5 px-2.5 py-1 font-medium', statusStyles[status])}
          >
            <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />
            {status}
          </Badge>
        </div>
        <h1 className='mt-3 truncate text-3xl font-semibold leading-tight text-card-foreground'>{name}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Subscriber account record</p>
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value?: string | null
  detail?: string | null
  tone?: 'default' | 'solid'
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border bg-card px-4 py-3 shadow-xs',
        tone === 'solid' && 'border-primary/20 bg-primary/5',
      )}
    >
      <div className='flex items-start gap-3'>
        <span
          className={cn('mt-0.5 size-2.5 shrink-0 rounded-full bg-muted-foreground/30', tone === 'solid' && 'bg-primary')}
          aria-hidden='true'
        />
        <div className='min-w-0'>
          <p className='text-[11px] font-medium uppercase text-muted-foreground'>{label}</p>
          <p className='mt-1 truncate text-sm font-semibold text-foreground'>{value || '-'}</p>
          {detail && <p className='mt-1 truncate text-xs text-muted-foreground'>{detail}</p>}
        </div>
      </div>
    </div>
  )
}

function SideSection({
  title,
  accent,
  children,
}: {
  title: string
  accent?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn('rounded-lg border bg-card p-5 shadow-xs', accent && 'border-primary/20 bg-primary/5')}>
      <div className='flex items-center gap-2 border-b pb-3'>
        <span className='h-5 w-1 rounded-full bg-primary' aria-hidden='true' />
        <h2 className='text-sm font-semibold text-card-foreground'>{title}</h2>
      </div>
      <div className='mt-4 grid gap-3'>{children}</div>
    </section>
  )
}

export default async function SubscriberDetailsPage({ params }: SubscriberDetailsPageProps) {
  const { accountNumber } = await params
  const { subscriber, categories, categoryFields } = await getSubscriberDetailsPageData(accountNumber)

  if (!subscriber) notFound()

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))
  const detailLabelByKey = new Map<string, string>()

  categoryFields.forEach((field) => {
    detailLabelByKey.set(field.key, field.label)
    detailLabelByKey.set(
      `${field.categoryId}.${field.key}`,
      `${categoryNameById.get(field.categoryId) ?? 'Category'} - ${field.label}`,
    )
  })

  const subscriptionDetails = Object.entries(subscriber.subscriptionDetails)
  const initials = subscriber.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const contractWindow = [subscriber.contractStart, subscriber.contractEnd].filter(Boolean).join(' to ')

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <div className='overflow-hidden rounded-lg border bg-card shadow-xs'>
        <div className='flex items-center justify-between gap-3 border-b bg-muted/25 px-5 py-3'>
          <Button asChild variant='ghost' size='sm' className='-ml-2'>
            <Link href='/main/subscribers'>
              <ArrowLeft data-icon='inline-start' aria-hidden='true' />
              Subscribers
            </Link>
          </Button>
          <Badge variant='secondary' className='rounded-md'>
            Subscriber Details
          </Badge>
        </div>
        <div className='grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='flex min-w-0 flex-col gap-4'>
            <IdentityHeader
              initials={initials}
              name={subscriber.name}
              accountNumber={subscriber.accountNumber}
              status={subscriber.status}
            />
            <div className='grid gap-3 sm:grid-cols-3'>
              <ContactCard label='Phone' value={subscriber.phoneNumber} mono />
              <ContactCard label='Email' value={subscriber.email} />
              <ContactCard label='Branch' value={subscriber.branch} />
            </div>
          </div>
          <ServicePanel
            category={subscriber.subscriptionCategory}
            plan={subscriber.plan}
            connection={subscriber.connectionType}
          />
        </div>
      </div>

      <div className='grid gap-3 md:grid-cols-3'>
        <SummaryTile label='Service Plan' value={subscriber.plan} detail={subscriber.subscriptionCategory} tone='solid' />
        <SummaryTile label='Location' value={subscriber.city} detail={subscriber.barangay} />
        <SummaryTile label='Contract Window' value={contractWindow || '-'} detail={`Updated ${subscriber.updatedAt || '-'}`} />
      </div>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <DetailSection title='Account' eyebrow='Subscriber profile' marker='01'>
            <DetailItem label='Account Number' value={subscriber.accountNumber} mono featured />
            <DetailItem label='First Name' value={subscriber.firstName} />
            <DetailItem label='Last Name' value={subscriber.lastName} />
            <DetailItem label='Phone Number' value={subscriber.phoneNumber} mono />
            <DetailItem label='Email' value={subscriber.email} />
            <DetailItem label='Branch' value={subscriber.branch} />
          </DetailSection>

          <DetailSection title='Service' eyebrow='Provisioning' marker='02'>
            <DetailItem label='Category' value={subscriber.subscriptionCategory} featured />
            <DetailItem label='Plan' value={subscriber.plan} featured />
            <DetailItem label='Connection' value={subscriber.connectionType} featured />
            <DetailItem label='Modem Type' value={subscriber.modemType} />
            <DetailItem label='MAC Address' value={subscriber.macAddress} mono />
            <DetailItem label='CAID' value={subscriber.caid} mono />
          </DetailSection>

          {subscriptionDetails.length > 0 && (
            <DetailSection title='Category Fields' eyebrow='Custom details' marker='03'>
              {subscriptionDetails.map(([key, value]) => (
                <DetailItem
                  key={key}
                  label={detailLabelByKey.get(key) ?? toDisplayLabel(key.split('.').pop() ?? key)}
                  value={value}
                />
              ))}
            </DetailSection>
          )}
        </div>

        <div className='flex min-w-0 flex-col gap-4'>
          <SideSection title='Location' accent>
            <DetailItem label='City' value={subscriber.city} featured />
            <DetailItem label='Barangay' value={subscriber.barangay} />
            <DetailItem label='Street/Zone' value={subscriber.streetZone} />
          </SideSection>

          <SideSection title='Contract'>
            <DetailItem label='Contract Start' value={subscriber.contractStart} />
            <DetailItem label='Contract End' value={subscriber.contractEnd} />
            <DetailItem label='Contract Picture' value={subscriber.contractPicturePath} />
            <DetailItem label='Updated' value={subscriber.updatedAt} featured />
          </SideSection>

          <section className='rounded-lg border bg-card p-5 shadow-xs'>
            <div className='flex items-center gap-2 border-b pb-3'>
              <span className='h-5 w-1 rounded-full bg-primary' aria-hidden='true' />
              <h2 className='text-sm font-semibold text-card-foreground'>Remarks</h2>
            </div>
            <p className='mt-4 whitespace-pre-wrap break-words rounded-md border bg-background p-3 text-sm text-foreground'>
              {subscriber.remarks || '-'}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
