export type JobOrderStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Cancelled'

export type JobOrderPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export type ProblemCategory =
  | 'No Internet'
  | 'Slow Connection'
  | 'LOS / Fiber Cut'
  | 'Router Issue'
  | 'Billing Concern'
  | 'Relocation'
  | 'Other'

export type JobOrderActivity = {
  id: string
  title: string
  description: string
  timestamp: string
}

export type JobOrder = {
  id: string
  ticketNumber: string
  accountNumber: string
  subscriberName: string
  phoneNumber: string
  plan: string
  city: string
  barangay: string
  problemCategory: ProblemCategory
  problemDetails: string
  priority: JobOrderPriority
  technician: string
  status: JobOrderStatus
  createdDate: string
  lastUpdate: string
  activities: JobOrderActivity[]
}
