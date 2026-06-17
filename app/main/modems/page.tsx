import { listModems } from '@/lib/modems'

import { ModemsClient } from './_components/modems-client'

export const dynamic = 'force-dynamic'

export default async function ModemsPage() {
  const modems = await listModems()

  return <ModemsClient initialModems={modems} />
}
