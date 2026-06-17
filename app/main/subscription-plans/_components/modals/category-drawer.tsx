'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AntennaSignal,
  BroadcastSignal,
  Cloud,
  Ellipsis as MoreHorizontal,
  Globe,
  Magnifier as Search,
  Pencil,
  Plus,
  Server,
  Signal,
  Smartphone,
  TrashBin,
  Tv,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  SubscriptionCategoryField,
  SubscriptionCategoryFieldType,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from '../data-table/types'
import {
  builtInNetworkingCategoryIcons,
  compressCategoryIcon,
  createBuiltInCategoryIconDataUrl,
  type BuiltInNetworkingCategoryIcon,
} from './category-icon-utils'

type CategorySummary = {
  id: string
  name: string
  iconDataUrl?: string | null
  plans: number
  subscribers: number
  groups?: string[]
}

type CategoryInput = {
  name: string
  iconDataUrl?: string | null
}

type CategoryDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategorySummary[]
  fields: SubscriptionCategoryField[]
  groups: SubscriptionPlanCategoryGroup[]
  startAddingMode?: 'category' | 'group'
  onCreateCategory?: (input: CategoryInput) => Promise<CategorySummary | null>
  onUpdateCategory?: (categoryId: string, input: CategoryInput) => Promise<SubscriptionPlanCategory | null>
  onDeleteCategory?: (categoryId: string) => Promise<boolean>
  onCreateField?: (categoryId: string, field: CategoryFieldInput) => Promise<SubscriptionCategoryField | null>
  onUpdateField?: (fieldId: string, field: CategoryFieldInput) => Promise<SubscriptionCategoryField | null>
  onDeleteField?: (fieldId: string) => Promise<boolean>
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
  iconDataUrl?: string | null
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

type FieldEditor =
  | {
      mode: 'create'
      categoryId: string
    }
  | {
      mode: 'edit'
      categoryId: string
      fieldId: string
    }

type FieldForm = {
  label: string
  type: SubscriptionCategoryFieldType
  placeholder: string
  required: boolean
  options: string
}

type CategoryFieldInput = {
  label: string
  type: SubscriptionCategoryFieldType
  placeholder?: string | null
  required?: boolean
  options?: string[]
  sortOrder?: number
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

const fieldTypes: { value: SubscriptionCategoryFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'password', label: 'Password' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'textarea', label: 'Long Text' },
]

const emptyFieldForm: FieldForm = {
  label: '',
  type: 'text',
  placeholder: '',
  required: false,
  options: '',
}

const acceptedIconTypes = 'image/png,image/jpeg,image/webp'
const presetIconComponents = {
  internet: Globe,
  wifi: Signal,
  router: AntennaSignal,
  fiber: BroadcastSignal,
  'cable-tv': Tv,
  iptv: Tv,
  phone: Smartphone,
  server: Server,
  combo: Cloud,
}

export function CategoryDrawer({
  open,
  onOpenChange,
  categories,
  fields,
  groups,
  startAddingMode,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateField,
  onUpdateField,
  onDeleteField,
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
  const [categoryIconDataUrl, setCategoryIconDataUrl] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editIconDataUrl, setEditIconDataUrl] = useState<string | null>(null)
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
  const [fieldEditor, setFieldEditor] = useState<FieldEditor | null>(null)
  const [fieldForm, setFieldForm] = useState<FieldForm>(emptyFieldForm)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [iconError, setIconError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isIconProcessing, setIsIconProcessing] = useState(false)

  useEffect(() => {
    if (!open || !startAddingMode) return

    setIsAdding(true)
    setAddMode(startAddingMode)
    setEditingItem(null)
    setEditName('')
    setEditIconDataUrl(null)
    setEditTargetCategoryIds([])
    setFieldEditor(null)
    setFieldForm(emptyFieldForm)
    setCategoryIconDataUrl(null)
    setIconError('')
    setSaveError('')
  }, [open, startAddingMode])

  const categoryList = useMemo(
    () =>
      [
        ...categories.map((category) => ({
          id: category.id,
          name: category.name,
          iconDataUrl: category.iconDataUrl,
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

  const fieldsByCategory = useMemo(
    () =>
      fields.reduce<Record<string, SubscriptionCategoryField[]>>((fieldMap, field) => {
        fieldMap[field.categoryId] = [...(fieldMap[field.categoryId] ?? []), field].sort(
          (first, second) => first.sortOrder - second.sortOrder,
        )

        return fieldMap
      }, {}),
    [fields],
  )

  const handleCategoryIconChange = async (
    file: File | null,
    mode: 'create' | 'edit',
  ) => {
    if (!file) return

    setIsIconProcessing(true)
    setIconError('')
    setSaveError('')

    try {
      const compressedIcon = await compressCategoryIcon(file)

      if (mode === 'create') {
        setCategoryIconDataUrl(compressedIcon)
      } else {
        setEditIconDataUrl(compressedIcon)
      }
    } catch (error) {
      setIconError(error instanceof Error ? error.message : 'Unable to prepare the category icon.')
    } finally {
      setIsIconProcessing(false)
    }
  }

  const handleBuiltInCategoryIconSelect = (
    icon: BuiltInNetworkingCategoryIcon,
    mode: 'create' | 'edit',
  ) => {
    setIconError('')
    setSaveError('')

    try {
      const iconDataUrl = createBuiltInCategoryIconDataUrl(icon)

      if (mode === 'create') {
        setCategoryIconDataUrl(iconDataUrl)
      } else {
        setEditIconDataUrl(iconDataUrl)
      }
    } catch (error) {
      setIconError(error instanceof Error ? error.message : 'Unable to prepare the category icon.')
    }
  }

  const clearCreateCategoryForm = () => {
    setCategoryName('')
    setCategoryIconDataUrl(null)
    setIconError('')
    setSaveError('')
  }

  const closeCreateDialog = () => {
    setIsAdding(false)
    clearCreateCategoryForm()
    setGroupName('')
  }

  const clearEditCategoryForm = () => {
    setEditingItem(null)
    setEditName('')
    setEditIconDataUrl(null)
    setEditTargetCategoryIds([])
    setIconError('')
    setSaveError('')
  }

  const handleSave = async () => {
    if (addMode === 'category') {
      const cleanName = categoryName.trim()

      if (!cleanName) return
      setSaveError('')

      const existingCategory = categoryList.find(
        (category) => category.name.toLowerCase() === cleanName.toLowerCase(),
      )
      const createdCategory = existingCategory
        ? null
        : await onCreateCategory?.({
            name: cleanName,
            iconDataUrl: categoryIconDataUrl,
          })
      const newCategoryId = createdCategory?.id ?? `added:${cleanName}:${Date.now()}`

      if (!existingCategory && onCreateCategory && !createdCategory) {
        setSaveError('Unable to save category. Try a smaller icon or check your connection.')
        return
      }

      if (!existingCategory && !createdCategory) {
        setAddedCategories((currentCategories) => [
          ...currentCategories,
          {
            id: newCategoryId,
            name: cleanName,
            iconDataUrl: categoryIconDataUrl,
            plans: 0,
            subscribers: 0,
          },
        ])
      }

      setTargetCategoryIds([existingCategory?.id ?? createdCategory?.id ?? newCategoryId])
      clearCreateCategoryForm()
      setIsAdding(false)
      setFieldEditor({
        mode: 'create',
        categoryId: existingCategory?.id ?? createdCategory?.id ?? newCategoryId,
      })
      setFieldForm(emptyFieldForm)
      setShowFieldErrors(false)
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
    setSaveError('')

    const sourceList = editingItem.type === 'category' ? categoryList : groupList
    const isDuplicate = sourceList.some(
      (item) => item.id !== editingItem.id && item.name.toLowerCase() === cleanName.toLowerCase(),
    )

    if (isDuplicate) return

    if (editingItem.type === 'category') {
      if (onUpdateCategory) {
        const updatedCategory = await onUpdateCategory(editingItem.id, {
          name: cleanName,
          iconDataUrl: editIconDataUrl,
        })

        if (!updatedCategory) {
          setSaveError('Unable to save category. Try a smaller icon or check your connection.')
          return
        }
      } else {
        setRenamedCategories((currentCategories) => ({
          ...currentCategories,
          [editingItem.id]: cleanName,
        }))
        setAddedCategories((currentCategories) =>
          currentCategories.map((currentCategory) =>
            currentCategory.id === editingItem.id
              ? {
                  ...currentCategory,
                  name: cleanName,
                  iconDataUrl: editIconDataUrl,
                }
              : currentCategory,
          ),
        )
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

    clearEditCategoryForm()
  }

  const handleEditStart = (item: EditableItem, name: string) => {
    setIsAdding(false)
    setEditingItem(item)
    setFieldEditor(null)
    setEditName(name)
    setEditIconDataUrl(
      item.type === 'category'
        ? categoryList.find((category) => category.id === item.id)?.iconDataUrl ?? null
        : null,
    )
    setEditTargetCategoryIds(
      item.type === 'group'
        ? groupList.find((group) => group.id === item.id)?.categoryIds ?? []
        : [],
    )
    setIconError('')
    setSaveError('')
  }

  const handleFieldEditStart = (categoryId: string, field: SubscriptionCategoryField) => {
    setIsAdding(false)
    setEditingItem(null)
    setFieldEditor({
      mode: 'edit',
      categoryId,
      fieldId: field.id,
    })
    setFieldForm({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder ?? '',
      required: field.required,
      options: field.options.join(', '),
    })
    setShowFieldErrors(false)
  }

  const handleFieldCreateStart = (categoryId: string) => {
    setIsAdding(false)
    setEditingItem(null)
    setFieldEditor({
      mode: 'create',
      categoryId,
    })
    setFieldForm(emptyFieldForm)
    setShowFieldErrors(false)
  }

  const handleFieldSave = async () => {
    if (!fieldEditor) return

    const cleanLabel = fieldForm.label.trim()
    const fieldOptions = fieldForm.options
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
    const hasErrors = !cleanLabel || (fieldForm.type === 'select' && fieldOptions.length === 0)

    setShowFieldErrors(hasErrors)
    if (hasErrors) return

    const categoryFields = fieldsByCategory[fieldEditor.categoryId] ?? []
    const sortOrder =
      fieldEditor.mode === 'edit'
        ? categoryFields.find((field) => field.id === fieldEditor.fieldId)?.sortOrder ?? 0
        : categoryFields.length * 10 + 10
    const input: CategoryFieldInput = {
      label: cleanLabel,
      type: fieldForm.type,
      placeholder: fieldForm.placeholder.trim() || null,
      required: fieldForm.required,
      options: fieldOptions,
      sortOrder,
    }
    const savedField =
      fieldEditor.mode === 'create'
        ? await onCreateField?.(fieldEditor.categoryId, input)
        : await onUpdateField?.(fieldEditor.fieldId, input)

    if (!savedField) return

    setFieldEditor(null)
    setFieldForm(emptyFieldForm)
    setShowFieldErrors(false)
  }

  const handleFieldDelete = async (fieldId: string) => {
    const wasDeleted = await onDeleteField?.(fieldId)

    if (!wasDeleted) return

    setFieldEditor((currentEditor) =>
      currentEditor?.mode === 'edit' && currentEditor.fieldId === fieldId ? null : currentEditor,
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
      clearEditCategoryForm()
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
      clearEditCategoryForm()
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

  const renderCategoryIcon = (iconDataUrl: string | null | undefined, name: string) => (
    <div className='flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40'>
      {iconDataUrl ? (
        <Image
          src={iconDataUrl}
          alt={`${name} icon`}
          width={40}
          height={40}
          unoptimized
          className='size-full scale-125 object-cover'
        />
      ) : (
        <span className='text-xs font-semibold uppercase text-muted-foreground'>
          {name.slice(0, 2)}
        </span>
      )}
    </div>
  )

  const renderCategoryIconField = (
    mode: 'create' | 'edit',
    iconDataUrl: string | null,
    labelId: string,
  ) => (
    <div className='grid gap-2'>
      <label className='text-sm font-medium' htmlFor={labelId}>
        Category icon
      </label>
      <div className='flex items-start gap-3 rounded-md border bg-background p-3'>
        {renderCategoryIcon(iconDataUrl, mode === 'create' ? categoryName || 'Category' : editName || 'Category')}
        <div className='min-w-0 flex-1 space-y-2'>
          <div className='grid grid-cols-3 gap-1.5'>
            {builtInNetworkingCategoryIcons.map((icon) => {
              const Icon = presetIconComponents[icon.value]

              return (
                <button
                  key={icon.value}
                  type='button'
                  className='flex min-w-0 items-center gap-1.5 rounded-md border bg-muted/20 px-2 py-1.5 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  onClick={() => handleBuiltInCategoryIconSelect(icon, mode)}
                >
                  <span
                    className='flex size-5 shrink-0 items-center justify-center rounded-full text-white shadow-xs'
                    style={{
                      background: `linear-gradient(135deg, ${icon.colors[0]}, ${icon.colors[1]})`,
                    }}
                    aria-hidden='true'
                  >
                    <Icon className='size-3.5' />
                  </span>
                  <span className='truncate'>{icon.label}</span>
                </button>
              )
            })}
          </div>
          <Input
            id={labelId}
            type='file'
            accept={acceptedIconTypes}
            disabled={isIconProcessing}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              void handleCategoryIconChange(file, mode)
              event.currentTarget.value = ''
            }}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-xs text-muted-foreground'>
              Stored inline after automatic compression.
            </p>
            {iconDataUrl ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => {
                  if (mode === 'create') {
                    setCategoryIconDataUrl(null)
                  } else {
                    setEditIconDataUrl(null)
                  }
                }}
              >
                Remove icon
              </Button>
            ) : null}
          </div>
          {isIconProcessing ? (
            <p className='text-xs text-muted-foreground'>Optimizing icon...</p>
          ) : null}
          {iconError ? <p className='text-xs text-destructive'>{iconError}</p> : null}
        </div>
      </div>
    </div>
  )

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

  const renderFieldEditor = (categoryId: string) => {
    if (fieldEditor?.categoryId !== categoryId) return null

    return (
      <div className='grid gap-3 rounded-md border bg-muted/20 p-3'>
        <div className='grid gap-2'>
          <label className='text-sm font-medium' htmlFor={`category-field-label-${categoryId}`}>
            Field label
          </label>
          <Input
            id={`category-field-label-${categoryId}`}
            value={fieldForm.label}
            onChange={(event) => setFieldForm((currentForm) => ({ ...currentForm, label: event.target.value }))}
            placeholder='Example: Device Serial'
            aria-invalid={showFieldErrors && !fieldForm.label.trim()}
          />
          {showFieldErrors && !fieldForm.label.trim() && (
            <p className='text-xs text-destructive'>Enter a field label.</p>
          )}
        </div>
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor={`category-field-type-${categoryId}`}>
              Field type
            </label>
            <Select
              value={fieldForm.type}
              onValueChange={(value) =>
                setFieldForm((currentForm) => ({
                  ...currentForm,
                  type: value as SubscriptionCategoryFieldType,
                }))
              }
            >
              <SelectTrigger id={`category-field-type-${categoryId}`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fieldTypes.map((fieldType) => (
                    <SelectItem key={fieldType.value} value={fieldType.value}>
                      {fieldType.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor={`category-field-placeholder-${categoryId}`}>
              Placeholder
            </label>
            <Input
              id={`category-field-placeholder-${categoryId}`}
              value={fieldForm.placeholder}
              onChange={(event) => setFieldForm((currentForm) => ({ ...currentForm, placeholder: event.target.value }))}
              placeholder='Optional'
            />
          </div>
        </div>
        {fieldForm.type === 'select' && (
          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor={`category-field-options-${categoryId}`}>
              Options
            </label>
            <Input
              id={`category-field-options-${categoryId}`}
              value={fieldForm.options}
              onChange={(event) => setFieldForm((currentForm) => ({ ...currentForm, options: event.target.value }))}
              placeholder='Option 1, Option 2, Option 3'
              aria-invalid={showFieldErrors && !fieldForm.options.trim()}
            />
            {showFieldErrors && !fieldForm.options.trim() && (
              <p className='text-xs text-destructive'>Enter at least one option.</p>
            )}
          </div>
        )}
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id={`category-field-required-${categoryId}`}
              type='button'
              checked={fieldForm.required}
              onCheckedChange={(checked) =>
                setFieldForm((currentForm) => ({ ...currentForm, required: Boolean(checked) }))
              }
              className='flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background text-primary shadow-xs outline-none data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
            >
              <CheckboxIndicator className='size-3' />
            </Checkbox>
            <label
              className='cursor-pointer text-sm font-medium text-foreground'
              htmlFor={`category-field-required-${categoryId}`}
            >
              Required
            </label>
          </div>
          <div className='flex shrink-0 justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                setFieldEditor(null)
                setFieldForm(emptyFieldForm)
                setShowFieldErrors(false)
              }}
            >
              Cancel
            </Button>
            <Button type='button' size='sm' onClick={handleFieldSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
              onClick={() => setIsAdding(true)}
            >
              <Plus data-icon='inline-start' />
              Add
            </Button>
          </div>
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
              {editingItem.type === 'category'
                ? renderCategoryIconField('edit', editIconDataUrl, 'edit-category-icon')
                : null}
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
                {saveError ? (
                  <p className='mr-auto self-center text-xs text-destructive'>{saveError}</p>
                ) : null}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={clearEditCategoryForm}
                >
                  Cancel
                </Button>
                <Button type='button' size='sm' onClick={handleEditSave} disabled={isIconProcessing}>
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
                <div className='flex min-w-0 items-center gap-3'>
                  {renderCategoryIcon(category.iconDataUrl, category.name)}
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-foreground'>{category.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {category.plans} plans - {category.subscribers} subscribers
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Badge variant='outline' className='h-6 px-2 font-medium'>
                    {category.plans}
                  </Badge>
                  {renderActions({ id: category.id, type: 'category' }, category.name)}
                </div>
              </div>
              <div className='flex flex-col gap-2 border-t pt-2'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-xs font-medium text-muted-foreground'>Fields</p>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleFieldCreateStart(category.id)}
                  >
                    <Plus data-icon='inline-start' />
                    Field
                  </Button>
                </div>
                {(fieldsByCategory[category.id] ?? []).length > 0 ? (
                  <div className='grid gap-1.5'>
                    {(fieldsByCategory[category.id] ?? []).map((field) => (
                      <div
                        key={field.id}
                        className='flex min-h-9 items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5'
                      >
                        <div className='min-w-0'>
                          <p className='truncate text-xs font-medium text-foreground'>{field.label}</p>
                          <p className='text-[11px] text-muted-foreground'>
                            {fieldTypes.find((fieldType) => fieldType.value === field.type)?.label ?? field.type}
                            {field.required ? ' - Required' : ''}
                          </p>
                        </div>
                        <div className='flex shrink-0 items-center gap-1'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-xs'
                            aria-label={`Edit ${field.label}`}
                            onClick={() => handleFieldEditStart(category.id, field)}
                          >
                            <Pencil aria-hidden='true' />
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-xs'
                            aria-label={`Delete ${field.label}`}
                            onClick={() => handleFieldDelete(field.id)}
                          >
                            <TrashBin aria-hidden='true' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground'>
                    No custom fields.
                  </p>
                )}
                {renderFieldEditor(category.id)}
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
                    {group.plans ?? 0} plans - {group.subscribers ?? 0} subscribers
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
      <Dialog open={isAdding} onOpenChange={(nextOpen) => {
        if (!nextOpen) closeCreateDialog()
      }}>
        <DialogContent className='max-h-[88vh] max-w-[520px] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{addMode === 'category' ? 'Create category' : 'Create group'}</DialogTitle>
            <DialogDescription>
              {addMode === 'category'
                ? 'Add a single top-level category.'
                : 'Create a group, then choose the categories it can use.'}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
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
              <div className='flex flex-col gap-3'>
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
                {renderCategoryIconField('create', categoryIconDataUrl, 'category-icon')}
              </div>
            ) : (
              <div className='flex flex-col gap-3'>
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
                    className='grid max-h-64 gap-2 overflow-y-auto pr-1'
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
              </div>
            )}
            {saveError ? (
              <p className='text-xs text-destructive'>{saveError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={closeCreateDialog}
            >
              Cancel
            </Button>
            <Button type='button' size='sm' onClick={handleSave} disabled={isIconProcessing}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
