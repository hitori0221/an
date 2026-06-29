export const SYSTEM_USER_ROLES = ['user', 'staff', 'admin'] as const
export type SystemUserRole = (typeof SYSTEM_USER_ROLES)[number]
export const SYSTEM_USER_PERMISSIONS = ['administrator', 'billing_management', 'operations'] as const
export type SystemUserPermission = (typeof SYSTEM_USER_PERMISSIONS)[number]

export type SystemUser = {
  id: string
  email: string
  fullName: string
  role: SystemUserRole
  permission: SystemUserPermission
  permissionId: string
  permissionName: string
  branchRequired: boolean
  branchId: string | null
  branchName: string | null
  createdAt: string
  lastSignInAt: string | null
}
