export type BillingInvoiceStatus = 'Unpaid' | 'Partial' | 'Overdue' | 'Paid' | 'Void'

export type BillingPaymentStatus = 'Posted' | 'Void'

export type BillingSubscriptionStatus = 'Active' | 'Overdue' | 'Expired'

export type BillingPaymentMethod =
  | 'Cash'
  | 'GCash'
  | 'Bank Transfer'
  | 'Card'
  | 'Check'
  | 'Other'

export type BillingSubscriberOption = {
  id: string
  accountNumber: string
  name: string
  phoneNumber: string
  planId: string | null
  plan: string
  planPrice: number
  address: string
  expirationDate: string
  expirationDateValue: string
  billingStatus: BillingSubscriptionStatus
  branchId: string | null
}

export type BillingInvoice = {
  id: string
  invoiceNumber: string
  subscriberId: string
  accountNumber: string
  subscriberName: string
  phoneNumber: string
  planId: string | null
  plan: string
  billingPeriod: string
  invoiceDate: string
  invoiceDateValue: string
  servicePeriodStart: string
  servicePeriodStartValue: string
  servicePeriodEnd: string
  servicePeriodEndValue: string
  servicePeriod: string
  dueDate: string
  dueDateValue: string
  expirationDate: string
  expirationDateValue: string
  amount: number
  paidAmount: number
  balance: number
  status: BillingInvoiceStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type BillingInvoiceInput = {
  subscriberId: string
  billingPeriod: string
  dueDate: string
  expirationDate: string
  amount: number
  notes: string
}

export type BillingInvoiceGenerationInput = {
  billingPeriod: string
  notes: string
}

export type BillingInvoiceGenerationResult = {
  invoices: BillingInvoice[]
  generated: number
  skippedExisting: number
  skippedWithoutPlan: number
  skippedWithoutInstallation: number
  eligibleSubscribers: number
}

export type BillingInvoiceVoidAllResult = {
  voidedIds: string[]
  voided: number
  skippedWithPayments: number
  skippedUnavailable: number
}

export type BillingInvoiceDeleteAllResult = {
  deletedIds: string[]
  deleted: number
  skippedWithPayments: number
  skippedUnavailable: number
}

export type BillingPayment = {
  id: string
  subscriberId: string
  accountNumber: string
  subscriberName: string
  amount: number
  paymentDate: string
  paymentDateValue: string
  expirationDate: string
  expirationDateValue: string
  method: BillingPaymentMethod
  referenceNumber: string
  collector: string
  receiptPhotoPath: string
  notes: string
  status: BillingPaymentStatus
  createdAt: string
  branchId: string | null
}

export type BillingPaymentInput = {
  subscriberId: string
  expirationDate: string
  amount: number
  paymentDate: string
  method: BillingPaymentMethod
  referenceNumber: string
  collector: string
  receiptPhoto?: File | null
  notes: string
}

export type BillingCollectionSummary = {
  id: string
  paymentDate: string
  collector: string
  method: BillingPaymentMethod
  paymentCount: number
  totalAmount: number
  lastReferenceNumber: string
}

export type BillingExpirationAccount = {
  id: string
  accountNumber: string
  subscriberName: string
  phoneNumber: string
  plan: string
  expirationDate: string
  expirationDateValue: string
  remainingDays: number
  billingStatus: BillingSubscriptionStatus
  branchId: string | null
}
