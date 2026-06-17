export type PlanStatus = 'Active' | 'Draft' | 'Archived'

export type SubscriptionPlan = {
  id: string
  code: string
  name: string
  categoryId: string | null
  groupId?: string | null
  categoryType?: 'category' | 'group'
  category: string
  categoryIcons?: SubscriptionPlanCategoryIcon[]
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
  iconDataUrl?: string | null
}

export type SubscriptionPlanCategoryIcon = Pick<SubscriptionPlanCategory, 'id' | 'name' | 'iconDataUrl'>

export type SubscriptionCategoryFieldType = 'text' | 'password' | 'number' | 'date' | 'select' | 'textarea'

export type SubscriptionCategoryField = {
  id: string
  categoryId: string
  key: string
  label: string
  type: SubscriptionCategoryFieldType
  placeholder?: string | null
  required: boolean
  options: string[]
  sortOrder: number
}

export type SubscriptionPlanCategoryGroup = {
  id: string
  name: string
  categoryIds: string[]
  plans?: number
  subscribers?: number
}
