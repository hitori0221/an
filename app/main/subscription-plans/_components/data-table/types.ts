export type PlanStatus = 'Active' | 'Draft' | 'Archived'

export type SubscriptionPlan = {
  id: string
  code: string
  name: string
  categoryId: string | null
  groupId?: string | null
  categoryType?: 'category' | 'group'
  category: string
  billingType: 'Prepaid' | 'Postpaid'
  speed: string
  channels: string
  price: number
  subscribers: number
  status: PlanStatus
  updatedAt: string
}

export type SubscriptionPlanCategory = {
  id: string
  name: string
  description?: string | null
}

export type SubscriptionPlanCategoryGroup = {
  id: string
  name: string
  categoryIds: string[]
  plans?: number
  subscribers?: number
}
