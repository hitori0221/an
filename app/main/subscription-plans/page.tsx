import { getSubscriptionPlansPageData } from '@/lib/subscription-plans'
import { SubscriptionPlansClient } from './_components/subscription-plans-client'

export const dynamic = 'force-dynamic'

export default async function SubscriptionPlansPage() {
  const { categories, groups, plans } = await getSubscriptionPlansPageData()

  return <SubscriptionPlansClient initialPlans={plans} categories={categories} groups={groups} />
}
