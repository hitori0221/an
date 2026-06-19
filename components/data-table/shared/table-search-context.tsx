'use client'

import * as React from 'react'

import { getStrictContext } from '@/lib/get-strict-context'

type TableSearchContextValue = {
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
}

const [TableSearchProvider, useTableSearch] = getStrictContext<TableSearchContextValue>('TableSearchContext')

export { TableSearchProvider, useTableSearch }
