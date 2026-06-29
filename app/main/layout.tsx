import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listServiceRequestCategories } from '@/lib/subscription-plans';
import { listBranches } from '@/lib/branches';
import { RadixSidebarDemo } from './sidebar';

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect('/login');
  }

  const { data: profile } = await createAdminClient()
    .from('profiles')
    .select('email, full_name, avatar_url, role, branch_id, branch:branches(name), system_role:system_roles(is_admin, branch_required, role_permissions(permission:permissions(resource, action)))')
    .eq('id', claims.sub)
    .maybeSingle();
  const systemRole = Array.isArray(profile?.system_role) ? profile.system_role[0] : profile?.system_role;
  const assignedBranch = Array.isArray(profile?.branch) ? profile.branch[0] : profile?.branch;
  const permissions = systemRole?.is_admin
    ? ['*']
    : (systemRole?.role_permissions ?? []).flatMap((entry) => {
        const related = entry.permission as unknown as { resource: string; action: string } | { resource: string; action: string }[] | null;
        const records = Array.isArray(related) ? related : related ? [related] : [];
        return records.map((permission) => `${permission.resource}.${permission.action}`);
      });
  const [serviceRequestCategories, branches] = await Promise.all([
    listServiceRequestCategories(),
    listBranches(),
  ]);
  const email = typeof claims.email === 'string' ? claims.email : profile?.email ?? '';
  const name = profile?.full_name || email.split('@')[0] || 'User';
  const user = {
    name,
    email,
    role: profile?.role ?? 'user',
    avatar: profile?.avatar_url ?? null,
  };

  return (
    <Suspense fallback={null}>
      <RadixSidebarDemo
        user={user}
        permissions={permissions}
        branchScope={systemRole?.branch_required ? profile?.branch_id ?? null : null}
        branchScopeName={systemRole?.branch_required ? assignedBranch?.name ?? null : null}
        serviceRequestCategories={serviceRequestCategories}
        branches={branches}
      >
        {children}
      </RadixSidebarDemo>
    </Suspense>
  );
}
