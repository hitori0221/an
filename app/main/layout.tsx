import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { listServiceRequestCategories } from '@/lib/subscription-plans';
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url, role')
    .eq('id', claims.sub)
    .maybeSingle();
  const serviceRequestCategories = await listServiceRequestCategories();
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
      <RadixSidebarDemo user={user} serviceRequestCategories={serviceRequestCategories}>
        {children}
      </RadixSidebarDemo>
    </Suspense>
  );
}
