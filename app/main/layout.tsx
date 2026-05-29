'use client';

import { RadixSidebarDemo } from './sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RadixSidebarDemo>{children}</RadixSidebarDemo>;
}
