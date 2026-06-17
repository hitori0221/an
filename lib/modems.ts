import { createClient } from '@/lib/supabase/server'

import type { Modem } from '@/app/main/modems/_components/data-table/types'

type ModemRow = {
  id: string
  modem_code: string
  name: string
  status: Modem['status']
  updated_at: string
}

const modemSelect = `
  id,
  modem_code,
  name,
  status,
  updated_at
`

const formatModemDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const normalizeModem = (modem: ModemRow): Modem => ({
  id: modem.id,
  code: modem.modem_code,
  name: modem.name,
  status: modem.status,
  updatedAt: formatModemDate(modem.updated_at),
})

export async function listModems() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modems')
    .select(modemSelect)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Unable to load modems: ${error.message}`)
  }

  return ((data ?? []) as ModemRow[]).map(normalizeModem)
}

export async function createModem(input: Modem) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modems')
    .insert({
      modem_code: input.code,
      name: input.name,
      status: input.status,
    })
    .select(modemSelect)
    .single()

  if (error) {
    throw new Error(`Unable to create modem: ${error.message}`)
  }

  return normalizeModem(data as ModemRow)
}

export async function updateModem(input: Modem) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('modems')
    .update({
      modem_code: input.code,
      name: input.name,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select(modemSelect)
    .single()

  if (error) {
    throw new Error(`Unable to update modem: ${error.message}`)
  }

  return normalizeModem(data as ModemRow)
}

export async function deleteModem(modemId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('modems').delete().eq('id', modemId)

  if (error) {
    throw new Error(`Unable to delete modem: ${error.message}`)
  }
}
