export type InstallationStatus =
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Installed'
  | 'Failed'
  | 'Cancelled'

export type Installation = {
  id: string
  subscriberId: string
  accountNumber: string
  name: string
  plan: string
  branch: string
  city: string
  barangay: string
  technician: string
  crew: string
  scheduleDate: string
  scheduleDateValue: string
  status: InstallationStatus
  phoneNumber: string
  address: string
  materials: string
  notes: string
  updatedAt: string
}

export type InstallationInput = {
  subscriberId: string
  technician: string
  crew: string
  scheduleDate: string
  status: InstallationStatus
  materials: string
  notes: string
}

export type InstallationSubscriberOption = {
  id: string
  accountNumber: string
  name: string
  phoneNumber: string
  plan: string
  branch: string
  city: string
  barangay: string
  address: string
}
