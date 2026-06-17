export type ModemStatus = 'Active' | 'Maintenance' | 'Inactive'

export type Modem = {
  id: string
  code: string
  name: string
  status: ModemStatus
  updatedAt: string
}
