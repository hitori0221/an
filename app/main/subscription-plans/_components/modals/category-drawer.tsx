'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Ellipsis as MoreHorizontal,
  Magnifier as Search,
  Pencil,
  Plus,
  TrashBin,
} from '@gravity-ui/icons'

import {
  Checkbox,
  CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { SubscriptionPlanCategoryGroup } from '../data-table/types'

type CategorySummary = {
  id: string
  name: string
  plans: number
  subscribers: number
  groups?: string[]
}

type CategoryDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategorySummary[]
  groups: SubscriptionPlanCategoryGroup[]
  startAddingMode?: 'category' | 'group'
  onCreateCategory?: (name: string) => Promise<CategorySummary | null>
  onRenameCategory?: (categoryId: string, name: string) => Promise<void>
  onDeleteCategory?: (categoryId: string) => Promise<boolean>
  onCreateGroup?: (name: string, categoryIds: string[]) => Promise<SubscriptionPlanCategoryGroup | null>
  onUpdateGroup?: (
    groupId: string,
    name: string,
    categoryIds: string[],
  ) => Promise<SubscriptionPlanCategoryGroup | null>
  onDeleteGroup?: (groupId: string) => Promise<boolean>
}

type CategoryItem = {
  id: string
  name: string
  plans: number
  subscribers: number
}

type GroupItem = {
  id: string
  name: string
  categoryIds: string[]
  plans?: number
  subscribers?: number
}

type EditableItem = {
  id: string
  type: 'category' | 'group'
}

type PendingDeleteItem =
  | {
      id: string
      name: string
      type: 'category'
      plans: number
      subscribers: number
    }
  | {
      id: string
      name: string
      type: 'group'
      categoryCount: number
      plans: number
      subscribers: number
    }

export function CategoryDrawer({
  open,
  onOpenChange,
  categories,
  groups,
  startAddingMode,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: CategoryDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
  const [isAdding, setIsAdding] = useState(false)
  const [addMode, setAddMode] = useState<'category' | 'group'>('category')
  const [categoryName, setCategoryName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editTargetCategoryIds, setEditTargetCategoryIds] = useState<string[]>([])
  const [targetCategoryIds, setTargetCategoryIds] = useState<string[]>(
    categories[0]?.id ? [categories[0].id] : [],
  )
  const [addedCategories, setAddedCategories] = useState<CategoryItem[]>([])
  const [addedGroups, setAddedGroups] = useState<GroupItem[]>([])
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([])
  const [deletedGroupIds, setDeletedGroupIds] = useState<string[]>([])
  const [renamedCategories, setRenamedCategories] = useState<Record<string, string>>({})
  const [renamedGroups, setRenamedGroups] = useState<Record<string, string>>({})
  const [pendingDeleteItem, setPendingDeleteItem] = useState<PendingDeleteItem | null>(null)

  useEffect(() => {
    if (!open || !startAddingMode) return

    setIsAdding(true)
    setAddMode(startAddingMode)
    setEditingItem(null)
    setEditName('')
    setEditTargetCategoryIds([])
  }, [open, startAddingMode])

  const categoryList = useMemo(
    () =>
      [
        ...categories.map((category) => ({
          id: category.id,
          name: category.name,
          plans: category.plans,
          subscribers: category.subscribers,
        })),
        ...addedCategories,
      ]
        .filter((category) => !deletedCategoryIds.includes(category.id))
        .map((category) => ({
          ...category,
          name: renamedCategories[category.id] ?? category.name,
        })),
    [addedCategories, categories, deletedCategoryIds, renamedCategories],
  )

  const groupList = useMemo(
    () =>
      [
        ...groups,
        ...addedGroups,
      ]
        .filter((group) => !deletedGroupIds.includes(group.id))
        .map((group) => ({
          ...group,
          name: renamedGroups[group.id] ?? group.name,
          categoryIds: group.categoryIds.filter((categoryId) =>
            categoryList.some((category) => category.id === categoryId),
          ),
        })),
    [addedGroups, categoryList, deletedGroupIds, groups, renamedGroups],
  )

  useEffect(() => {
    if (targetCategoryIds.length > 0 || categoryList.length === 0) return

    setTargetCategoryIds([categoryList[0].id])
  }, [categoryList, targetCategoryIds.length])

  const filteredCategoryList = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()

    if (!normalizedSearchQuery) return categoryList

    return categoryList.filter((category) =>
      category.name.toLowerCase().includes(normalizedSearchQuery),
    )
  }, [categoryList, searchQuery])

  const filteredGroupList = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()

    if (!normalizedSearchQuery) return groupList

    return groupList.filter(
      (group) =>
        group.name.toLowerCase().includes(normalizedSearchQuery) ||
        group.categoryIds.some((categoryId) => {
          const category = categoryList.find((currentCategory) => currentCategory.id === categoryId)
          return category?.name.toLowerCase().includes(normalizedSearchQuery)
        }),
    )
  }, [categoryList, groupList, searchQuery])

  const handleSave = async () => {
    if (addMode === 'category') {
      const cleanName = categoryName.trim()

      if (!cleanName) return

      const existingCategory = categoryList.find(
        (category) => category.name.toLowerCase() === cleanName.toLowerCase(),
      )
      const createdCategory = existingCategory ? null : await onCreateCategory?.(cleanName)
      const newCategoryId = createdCategory?.id ?? `added:${cleanName}:${Date.now()}`

      if (!existingCategory && !createdCategory) {
        setAddedCategories((currentCategories) => [
          ...currentCategories,
          {
            id: newCategoryId,
            name: cleanName,
            plans: 0,
            subscribers: 0,
          },
        ])
      }

      setTargetCategoryIds([existingCategory?.id ?? createdCategory?.id ?? newCategoryId])
      setCategoryName('')
      setIsAdding(false)
      return
    }

    const cleanGroupName = groupName.trim()

    if (!cleanGroupName || targetCategoryIds.length === 0) return

    const existingGroup = groupList.find(
      (group) => group.name.toLowerCase() === cleanGroupName.toLowerCase(),
    )

    if (!existingGroup) {
      const createdGroup = await onCreateGroup?.(cleanGroupName, targetCategoryIds)

      if (!createdGroup) {
        setAddedGroups((currentGroups) => [
          ...currentGroups,
          {
            id: `group:${cleanGroupName}:${Date.now()}`,
            name: cleanGroupName,
            categoryIds: targetCategoryIds,
          },
        ])
      }
    }

    setGroupName('')
    setIsAdding(false)
  }

  const handleEditSave = async () => {
    const cleanName = editName.trim()

    if (!editingItem || !cleanName) return

    const sourceList = editingItem.type === 'category' ? categoryList : groupList
    const isDuplicate = sourceList.some(
      (item) => item.id !== editingItem.id && item.name.toLowerCase() === cleanName.toLowerCase(),
    )

    if (isDuplicate) return

    if (editingItem.type === 'category') {
      if (onRenameCategory) {
        await onRenameCategory(editingItem.id, cleanName)
      } else {
        setRenamedCategories((currentCategories) => ({
          ...currentCategories,
          [editingItem.id]: cleanName,
        }))
      }
    } else {
      const group = groupList.find((currentGroup) => currentGroup.id === editingItem.id)
      const nextCategoryIds = editTargetCategoryIds.length > 0 ? editTargetCategoryIds : group?.categoryIds ?? []

      if (nextCategoryIds.length === 0) return

      if (onUpdateGroup) {
        const updatedGroup = await onUpdateGroup(editingItem.id, cleanName, nextCategoryIds)

        if (!updatedGroup) return
      } else {
        setRenamedGroups((currentGroups) => ({
          ...currentGroups,
          [editingItem.id]: cleanName,
        }))
        setAddedGroups((currentGroups) =>
          currentGroups.map((currentGroup) =>
            currentGroup.id === editingItem.id
              ? {
                  ...currentGroup,
                  categoryIds: nextCategoryIds,
                }
              : currentGroup,
          ),
        )
      }
    }

    setEditingItem(null)
    setEditName('')
    setEditTargetCategoryIds([])
  }

  const handleEditStart = (item: EditableItem, name: string) => {
    setIsAdding(false)
    setEditingItem(item)
    setEditName(name)
    setEditTargetCategoryIds(
      item.type === 'group'
        ? groupList.find((group) => group.id === item.id)?.categoryIds ?? []
        : [],
    )
  }

  const handleCategoryDelete = async (categoryId: string) => {
    if (onDeleteCategory) {
      const wasDeleted = await onDeleteCategory(categoryId)

      if (!wasDeleted) return
    } else {
      setDeletedCategoryIds((currentCategoryIds) =>
        currentCategoryIds.includes(categoryId) ? currentCategoryIds : [...currentCategoryIds, categoryId],
      )
    }
    setTargetCategoryIds((currentCategoryIds) =>
      currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId),
    )
    setAddedGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        categoryIds: group.categoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId),
      })),
    )
    if (editingItem?.type === 'category' && editingItem.id === categoryId) {
      setEditingItem(null)
      setEditName('')
    }
  }

  const handleGroupDelete = async (groupId: string) => {
    if (onDeleteGroup) {
      const wasDeleted = await onDeleteGroup(groupId)

      if (!wasDeleted) return
    }

    setDeletedGroupIds((currentGroupIds) =>
      currentGroupIds.includes(groupId) ? currentGroupIds : [...currentGroupIds, groupId],
    )
    if (editingItem?.type === 'group' && editingItem.id === groupId) {
      setEditingItem(null)
      setEditName('')
    }
  }

  const requestDelete = (item: EditableItem, name: string) => {
    if (item.type === 'category') {
      const category = categoryList.find((currentCategory) => currentCategory.id === item.id)

      if (!category) return

      setPendingDeleteItem({
        id: category.id,
        name: category.name,
        type: 'category',
        plans: category.plans,
        subscribers: category.subscribers,
      })
      return
    }

    const group = groupList.find((currentGroup) => currentGroup.id === item.id)

    if (!group) return

    setPendingDeleteItem({
      id: group.id,
      name,
      type: 'group',
      categoryCount: group.categoryIds.length,
      plans: group.plans ?? 0,
      subscribers: group.subscribers ?? 0,
    })
  }

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return

    if (pendingDeleteItem.type === 'category') {
      if (pendingDeleteItem.plans > 0) return

      await handleCategoryDelete(pendingDeleteItem.id)
    } else {
      if (pendingDeleteItem.plans > 0) return

      await handleGroupDelete(pendingDeleteItem.id)
    }

    setPendingDeleteItem(null)
  }

  const toggleTargetCategory = (categoryId: string) => {
    setTargetCategoryIds((currentCategoryIds) =>
      currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
        : [...currentCategoryIds, categoryId],
    )
  }

  const toggleEditTargetCategory = (categoryId: string) => {
    setEditTargetCategoryIds((currentCategoryIds) =>
      currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
        : [...currentCategoryIds, categoryId],
    )
  }

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    })
  }

  const renderActions = (item: EditableItem, name: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`Open actions for ${name}`}
        >
          <MoreHorizontal aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-36'>
        <DropdownMenuItem onSelect={() => handleEditStart(item, name)}>
          <Pencil aria-hidden='true' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onSelect={() => requestDelete(item, name)}
        >
          <TrashBin aria-hidden='true' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='w-full sm:w-[420px]' side='right'>
        <SheetHeader className='pr-12'>
          <div className='min-w-0'>
            <SheetTitle>Categories</SheetTitle>
            <SheetDescription>
              Manage the categories and grouped plan sets used by subscription plans.
            </SheetDescription>
          </div>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4'>
          <div className='flex items-center gap-2 pt-1'>
            <div className='relative min-w-0 flex-1'>
              <Search className='pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground' />
              <Input
                aria-label='Search categories'
                className='h-8 border-transparent bg-background/40 pl-8 pr-7 text-sm shadow-none hover:bg-muted/50 focus-visible:bg-background dark:bg-transparent dark:hover:bg-muted/40 dark:focus-visible:bg-background'
                placeholder='Search categories'
                type='search'
                value={searchQuery}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <Button
              type='button'
              className='shrink-0'
              size='sm'
              onClick={() => setIsAdding((isOpen) => !isOpen)}
            >
              <Plus data-icon='inline-start' />
              Add
            </Button>
          </div>
          {isAdding && (
            <div className='flex flex-col gap-3 rounded-md border bg-muted/20 p-3'>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-foreground'>
                  {addMode === 'category' ? 'Create category' : 'Create group'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {addMode === 'category'
                    ? 'Add a single top-level category.'
                    : 'Create a group, then choose the categories it can use.'}
                </p>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant={addMode === 'category' ? 'secondary' : 'ghost'}
                  size='sm'
                  onClick={() => setAddMode('category')}
                >
                  Category
                </Button>
                <Button
                  type='button'
                  variant={addMode === 'group' ? 'secondary' : 'ghost'}
                  size='sm'
                  onClick={() => setAddMode('group')}
                >
                  Group
                </Button>
              </div>
              {addMode === 'category' ? (
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium' htmlFor='category-name'>
                    Category name
                  </label>
                  <Input
                    id='category-name'
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder='Example: Enterprise'
                  />
                </div>
              ) : (
                <>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium' htmlFor='group-name'>
                      Group name
                    </label>
                    <Input
                      id='group-name'
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder='Example: Combo Fiber + Cable'
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium' id='target-categories'>
                      Categories
                    </label>
                    <div
                      aria-labelledby='target-categories'
                      className='grid gap-2'
                      role='group'
                    >
                      {categoryList.map((category) => {
                        const isSelected = targetCategoryIds.includes(category.id)
                        const checkboxId = `target-category-${category.id.replace(/[^a-z0-9]+/g, '-')}`

                        return (
                          <div
                            key={category.id}
                            className='flex min-h-9 items-center gap-2 rounded-md border bg-background px-3 py-2'
                          >
                            <Checkbox
                              id={checkboxId}
                              type='button'
                              checked={isSelected}
                              onCheckedChange={() => toggleTargetCategory(category.id)}
                              className='flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background text-primary shadow-xs outline-none data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                            >
                              <CheckboxIndicator className='size-3' />
                            </Checkbox>
                            <label
                              className='min-w-0 flex-1 cursor-pointer truncate text-sm font-medium text-foreground'
                              htmlFor={checkboxId}
                            >
                              {category.name}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
              <div className='flex justify-end gap-2'>
                <Button type='button' variant='ghost' size='sm' onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type='button' size='sm' onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          )}
          {editingItem && (
            <div className='flex flex-col gap-3 rounded-md border bg-muted/20 p-3'>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-foreground'>
                  Edit {editingItem.type}
                </p>
                <p className='text-xs text-muted-foreground'>Update the name shown in this drawer.</p>
              </div>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium' htmlFor='edit-name'>
                  Name
                </label>
                <Input
                  id='edit-name'
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder='Example: Enterprise'
                />
              </div>
              {editingItem.type === 'group' && (
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium' id='edit-target-categories'>
                    Categories
                  </label>
                  <div
                    aria-labelledby='edit-target-categories'
                    className='grid gap-2'
                    role='group'
                  >
                    {categoryList.map((category) => {
                      const isSelected = editTargetCategoryIds.includes(category.id)
                      const checkboxId = `edit-target-category-${category.id.replace(/[^a-z0-9]+/g, '-')}`

                      return (
                        <div
                          key={category.id}
                          className='flex min-h-9 items-center gap-2 rounded-md border bg-background px-3 py-2'
                        >
                          <Checkbox
                            id={checkboxId}
                            type='button'
                            checked={isSelected}
                            onCheckedChange={() => toggleEditTargetCategory(category.id)}
                            className='flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background text-primary shadow-xs outline-none data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                          >
                            <CheckboxIndicator className='size-3' />
                          </Checkbox>
                          <label
                            className='min-w-0 flex-1 cursor-pointer truncate text-sm font-medium text-foreground'
                            htmlFor={checkboxId}
                          >
                            {category.name}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setEditingItem(null)
                    setEditName('')
                    setEditTargetCategoryIds([])
                  }}
                >
                  Cancel
                </Button>
                <Button type='button' size='sm' onClick={handleEditSave}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {filteredCategoryList.map((category) => (
            <div
              key={category.id}
              className='flex flex-col gap-2 rounded-md border bg-background px-3 py-2'
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-foreground'>{category.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {category.plans} plans · {category.subscribers} subscribers
                  </p>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='outline' className='h-6 px-2 font-medium'>
                    {category.plans}
                  </Badge>
                  {renderActions({ id: category.id, type: 'category' }, category.name)}
                </div>
              </div>
            </div>
          ))}

          {filteredGroupList.map((group) => (
            <div
              key={group.id}
              className='flex flex-col gap-2 rounded-md border bg-background px-3 py-2'
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-foreground'>{group.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {group.plans ?? 0} plans · {group.subscribers ?? 0} subscribers
                  </p>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='outline' className='h-6 px-2 font-medium'>
                    Group
                  </Badge>
                  {renderActions({ id: group.id, type: 'group' }, group.name)}
                </div>
              </div>
              {group.categoryIds.length > 0 && (
                <div className='flex flex-wrap gap-1.5 border-t pt-2'>
                  {group.categoryIds.map((categoryId) => {
                    const category = categoryList.find((currentCategory) => currentCategory.id === categoryId)

                    if (!category) return null

                    return (
                      <span
                        key={categoryId}
                        className='inline-flex h-6 items-center rounded-md bg-muted/70 px-2 text-xs font-medium text-foreground'
                      >
                        {category.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {filteredCategoryList.length === 0 && filteredGroupList.length === 0 && (
            <div className='rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground'>
              No categories found.
            </div>
          )}
        </div>
        </SheetContent>
      </Sheet>
      <Dialog open={Boolean(pendingDeleteItem)} onOpenChange={(nextOpen) => {
        if (!nextOpen) setPendingDeleteItem(null)
      }}>
        <DialogContent className='max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {pendingDeleteItem?.plans && pendingDeleteItem.plans > 0
                ? `${pendingDeleteItem.type === 'category' ? 'Category' : 'Group'} is in use`
                : `Delete ${pendingDeleteItem?.type ?? 'item'}?`}
            </DialogTitle>
            <DialogDescription>
              {pendingDeleteItem?.type === 'category' && pendingDeleteItem.plans > 0
                ? `${pendingDeleteItem.name} is connected to ${pendingDeleteItem.plans} plans and ${pendingDeleteItem.subscribers} subscribers. Move those plans to another category before deleting it.`
                : pendingDeleteItem?.type === 'category'
                  ? `${pendingDeleteItem.name} will be removed from categories and group links. No subscription plans are assigned to it.`
                  : pendingDeleteItem?.type === 'group' && pendingDeleteItem.plans > 0
                    ? `${pendingDeleteItem.name} is connected to ${pendingDeleteItem.plans} plans and ${pendingDeleteItem.subscribers} subscribers. Move those plans to another category or group before deleting it.`
                  : pendingDeleteItem
                    ? `${pendingDeleteItem.name} will be removed as a group. Its ${pendingDeleteItem.categoryCount} category links will be removed, but the categories and plans will stay.`
                    : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setPendingDeleteItem(null)}
            >
              Cancel
            </Button>
            {!pendingDeleteItem?.plans ? (
              <Button type='button' variant='destructive' size='sm' onClick={confirmDelete}>
                Delete
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
