export type SubscriberStatus = 'Active' | 'Inactive' | 'Pending'

export type SubscriberConnectionType = 'FTTH' | 'COAX'

export type SubscriberCategoryFieldType = 'text' | 'password' | 'number' | 'date' | 'select' | 'textarea'

export type SubscriberSubscriptionCategoryOption = {
  id: string
  name: string
  iconDataUrl?: string | null
}

export type SubscriberSubscriptionCategoryGroupOption = {
  id: string
  name: string
  categoryIds: string[]
}

export type SubscriberPlanOption = {
  id: string
  code: string
  name: string
  categoryId: string | null
  groupId: string | null
  status: string
}

export type SubscriberBranchOption = {
  id: string
  code: string
  name: string
  status: string
}

export type SubscriberModemOption = {
  id: string
  code: string
  name: string
  status: string
}

export type SubscriberCategoryField = {
  id: string
  categoryId: string
  key: string
  label: string
  type: SubscriberCategoryFieldType
  placeholder: string
  required: boolean
  options: string[]
  sortOrder: number
}

export type Subscriber = {
  id: string
  accountNumber: string
  firstName: string
  lastName: string
  name: string
  phoneNumber: string
  email: string
  city: string
  barangay: string
  streetZone: string
  branchId: string | null
  branch: string
  contractStart: string
  contractEnd: string
  nextBillingDate: string
  dueDate: string
  expirationDate: string
  subscriptionCategoryId: string | null
  subscriptionGroupId: string | null
  subscriptionCategory: string
  subscriptionPlanId: string | null
  plan: string
  macAddress: string
  caid: string
  connectionType: SubscriberConnectionType | null
  modemId: string | null
  modemType: string
  subscriptionDetails: Record<string, string>
  contractPicturePath: string
  remarks: string
  status: SubscriberStatus
  updatedAt: string
}
