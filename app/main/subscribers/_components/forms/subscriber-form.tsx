'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import { ChevronDown as ChevronDownIcon } from '@gravity-ui/icons'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
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
import { cn } from '@/lib/utils'

import type {
  Subscriber,
  SubscriberBranchOption,
  SubscriberCategoryField,
  SubscriberConnectionType,
  SubscriberModemOption,
  SubscriberPlanOption,
  SubscriberSubscriptionCategoryGroupOption,
  SubscriberSubscriptionCategoryOption,
} from '../data-table/types'

type SubscriberFormProps = {
  nextAccountNumber: string
  subscriber?: Subscriber | null
  submitLabel?: string
  categories: SubscriberSubscriptionCategoryOption[]
  categoryGroups: SubscriberSubscriptionCategoryGroupOption[]
  plans: SubscriberPlanOption[]
  branches: SubscriberBranchOption[]
  modems: SubscriberModemOption[]
  categoryFields: SubscriberCategoryField[]
  onCancel: () => void
  onSubmit: (formData: FormData) => Promise<boolean>
}

type FormState = {
  accountNumber: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  city: string
  barangay: string
  streetZone: string
  branchId: string
  contractStart: string
  contractEnd: string
  subscriptionCategoryId: string
  subscriptionGroupId: string
  subscriptionPlanId: string
  macAddress: string
  caid: string
  connectionType: SubscriberConnectionType | ''
  modemId: string
  remarks: string
}

const NO_MODEM_VALUE = 'no-modem'
const CATEGORY_VALUE_PREFIX = 'category:'
const GROUP_VALUE_PREFIX = 'group:'

const getCategoryInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'

function CategoryPickerIcon({
  name,
  iconDataUrl,
  className,
}: {
  name: string
  iconDataUrl?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'pointer-events-none relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-[10px] font-semibold leading-none text-muted-foreground shadow-xs',
        className,
      )}
      aria-hidden='true'
    >
      {iconDataUrl ? (
        <Image src={iconDataUrl} alt='' fill unoptimized sizes='28px' className='scale-125 object-cover' />
      ) : (
        getCategoryInitials(name)
      )}
    </span>
  )
}

const createInitialFormState = (nextAccountNumber: string, subscriber?: Subscriber | null): FormState => ({
  accountNumber: subscriber?.accountNumber ?? nextAccountNumber,
  firstName: subscriber?.firstName ?? '',
  lastName: subscriber?.lastName ?? '',
  phoneNumber: subscriber?.phoneNumber ?? '',
  email: subscriber?.email ?? '',
  city: subscriber?.city ?? '',
  barangay: subscriber?.barangay ?? '',
  streetZone: subscriber?.streetZone ?? '',
  branchId: subscriber?.branchId ?? '',
  contractStart: subscriber?.contractStart ?? '',
  contractEnd: subscriber?.contractEnd ?? '',
  subscriptionCategoryId: subscriber?.subscriptionCategoryId ?? '',
  subscriptionGroupId: subscriber?.subscriptionGroupId ?? '',
  subscriptionPlanId: subscriber?.subscriptionPlanId ?? '',
  macAddress: subscriber?.macAddress ?? '',
  caid: subscriber?.caid ?? '',
  connectionType: subscriber?.connectionType ?? '',
  modemId: subscriber?.modemId ?? '',
  remarks: subscriber?.remarks ?? '',
})

export function SubscriberForm({
  nextAccountNumber,
  subscriber,
  submitLabel = 'Add Subscriber',
  categories,
  categoryGroups,
  plans,
  branches,
  modems,
  categoryFields,
  onCancel,
  onSubmit,
}: SubscriberFormProps) {
  const [form, setForm] = useState<FormState>(() => createInitialFormState(nextAccountNumber, subscriber))
  const [categoryDetails, setCategoryDetails] = useState<Record<string, string>>(
    () => subscriber?.subscriptionDetails ?? {},
  )
  const [contractPicture, setContractPicture] = useState<File | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const subscriptionCategoryValue = form.subscriptionGroupId
    ? `${GROUP_VALUE_PREFIX}${form.subscriptionGroupId}`
    : form.subscriptionCategoryId
      ? `${CATEGORY_VALUE_PREFIX}${form.subscriptionCategoryId}`
      : ''

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.status === 'Active'),
    [branches],
  )
  const activeModems = useMemo(
    () => modems.filter((modem) => modem.status === 'Active'),
    [modems],
  )
  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === 'Active'),
    [plans],
  )
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const categoryGroupSections = useMemo(() => {
    const sections = categoryGroups
      .map((group) => {
        const groupCategories = group.categoryIds
          .map((categoryId) => categoryById.get(categoryId))
          .filter((category): category is SubscriberSubscriptionCategoryOption => Boolean(category))

        return {
          ...group,
          categories: groupCategories,
        }
      })
      .filter((group) => group.categories.length > 0)

    return { sections, singleCategories: categories }
  }, [categories, categoryById, categoryGroups])
  const selectedCategoryGroup = useMemo(
    () =>
      form.subscriptionGroupId
        ? categoryGroupSections.sections.find((group) => group.id === form.subscriptionGroupId) ?? null
        : null,
    [categoryGroupSections.sections, form.subscriptionGroupId],
  )
  const selectedCategory = useMemo(
    () => (form.subscriptionCategoryId ? categoryById.get(form.subscriptionCategoryId) ?? null : null),
    [categoryById, form.subscriptionCategoryId],
  )
  const selectedCategoryGroupIds = useMemo(
    () =>
      form.subscriptionGroupId
        ? [form.subscriptionGroupId]
        : categoryGroups
            .filter((group) => group.categoryIds.includes(form.subscriptionCategoryId))
            .map((group) => group.id),
    [categoryGroups, form.subscriptionCategoryId, form.subscriptionGroupId],
  )
  const selectedCategoryIds = useMemo(
    () => {
      if (form.subscriptionGroupId) {
        return categoryGroups.find((group) => group.id === form.subscriptionGroupId)?.categoryIds ?? []
      }

      return form.subscriptionCategoryId ? [form.subscriptionCategoryId] : []
    },
    [categoryGroups, form.subscriptionCategoryId, form.subscriptionGroupId],
  )
  const selectedCategoryFields = useMemo(
    () => {
      const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

      return categoryFields
        .filter((field) => selectedCategoryIds.includes(field.categoryId))
        .map((field) => ({
          ...field,
          detailKey: form.subscriptionGroupId ? `${field.categoryId}.${field.key}` : field.key,
          displayLabel: form.subscriptionGroupId
            ? `${categoryNameById.get(field.categoryId) ?? 'Category'} - ${field.label}`
            : field.label,
        }))
        .sort((first, second) => {
          const categorySort = selectedCategoryIds.indexOf(first.categoryId) - selectedCategoryIds.indexOf(second.categoryId)
          return categorySort === 0 ? first.sortOrder - second.sortOrder : categorySort
        })
    },
    [categories, categoryFields, form.subscriptionGroupId, selectedCategoryIds],
  )
  const availablePlans = useMemo(
    () =>
      activePlans.filter(
        (plan) =>
          selectedCategoryIds.length === 0 ||
          (plan.categoryId ? selectedCategoryIds.includes(plan.categoryId) : false) ||
          (plan.groupId ? selectedCategoryGroupIds.includes(plan.groupId) : false) ||
          plan.categoryId === null,
      ),
    [activePlans, selectedCategoryGroupIds, selectedCategoryIds],
  )

  useEffect(() => {
    setForm(createInitialFormState(nextAccountNumber, subscriber))
    setCategoryDetails(subscriber?.subscriptionDetails ?? {})
    setContractPicture(null)
    setShowErrors(false)
  }, [nextAccountNumber, subscriber])

  useEffect(() => {
    setForm((current) =>
      current.subscriptionPlanId && !availablePlans.some((plan) => plan.id === current.subscriptionPlanId)
        ? {
            ...current,
            subscriptionPlanId: '',
          }
        : current,
    )
  }, [availablePlans])

  useEffect(() => {
    setCategoryDetails((currentDetails) =>
      selectedCategoryFields.reduce<Record<string, string>>((details, field) => {
        details[field.detailKey] = currentDetails[field.detailKey] ?? ''
        return details
      }, {}),
    )
  }, [selectedCategoryFields])

  const requiredDynamicFieldMissing = selectedCategoryFields.some(
    (field) => field.required && !categoryDetails[field.detailKey]?.trim(),
  )
  const hasErrors =
    !form.accountNumber.trim() ||
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !form.phoneNumber.trim() ||
    !form.city.trim() ||
    !form.barangay.trim() ||
    !form.branchId ||
    (!form.subscriptionCategoryId && !form.subscriptionGroupId) ||
    !form.subscriptionPlanId ||
    !form.connectionType ||
    requiredDynamicFieldMissing

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateSubscriptionCategory = (value: string) => {
    if (value.startsWith(GROUP_VALUE_PREFIX)) {
      setForm((current) => ({
        ...current,
        subscriptionCategoryId: '',
        subscriptionGroupId: value.slice(GROUP_VALUE_PREFIX.length),
      }))
      return
    }

    setForm((current) => ({
      ...current,
      subscriptionCategoryId: value.startsWith(CATEGORY_VALUE_PREFIX)
        ? value.slice(CATEGORY_VALUE_PREFIX.length)
        : value,
      subscriptionGroupId: '',
    }))
  }

  const updateCategoryDetail = (key: string, value: string) => {
    setCategoryDetails((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetForm = () => {
    setForm(createInitialFormState(nextAccountNumber, subscriber))
    setCategoryDetails(subscriber?.subscriptionDetails ?? {})
    setContractPicture(null)
    setShowErrors(false)
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const submitSubscriber = async (proceedToInstallation: boolean) => {
    setShowErrors(true)

    if (hasErrors || isSubmitting) return

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value)
    })
    formData.set('modemId', form.modemId === NO_MODEM_VALUE ? '' : form.modemId)
    formData.append('subscriptionDetails', JSON.stringify(categoryDetails))
    if (proceedToInstallation) {
      formData.append('proceedToInstallation', '1')
    }
    if (contractPicture) {
      formData.append('contractPicture', contractPicture)
    }

    setIsSubmitting(true)
    const wasCreated = await onSubmit(formData)
    setIsSubmitting(false)

    if (wasCreated) resetForm()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitSubscriber(false)
  }

  const renderDynamicField = (
    field: SubscriberCategoryField & { detailKey: string; displayLabel: string },
  ) => {
    const value = categoryDetails[field.detailKey] ?? ''
    const fieldId = `subscriber-category-field-${field.id}`
    const invalid = showErrors && field.required && !value.trim()

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor={fieldId}>
            {field.displayLabel}
          </label>
          <textarea
            id={fieldId}
            value={value}
            onChange={(event) => updateCategoryDetail(field.detailKey, event.target.value)}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            className={cn(
              'min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
            )}
          />
          {invalid && <p className='text-xs text-destructive'>Enter {field.label.toLowerCase()}.</p>}
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.id} className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium' htmlFor={fieldId}>
            {field.displayLabel}
          </label>
          <Select value={value} onValueChange={(nextValue) => updateCategoryDetail(field.detailKey, nextValue)}>
            <SelectTrigger id={fieldId} className='w-full' aria-invalid={invalid}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {invalid && <p className='text-xs text-destructive'>Select {field.label.toLowerCase()}.</p>}
        </div>
      )
    }

    return (
      <div key={field.id} className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium' htmlFor={fieldId}>
          {field.displayLabel}
        </label>
        <Input
          id={fieldId}
          type={field.type}
          value={value}
          onChange={(event) => updateCategoryDetail(field.detailKey, event.target.value)}
          placeholder={field.placeholder}
          aria-invalid={invalid}
        />
        {invalid && <p className='text-xs text-destructive'>Enter {field.label.toLowerCase()}.</p>}
      </div>
    )
  }

  return (
    <form
      className='flex min-h-0 flex-1 flex-col [&_[data-slot=input]]:border-muted-foreground/25 [&_[data-slot=input]]:bg-muted/35 [&_[data-slot=input]]:shadow-sm [&_[data-slot=select-trigger]]:border-muted-foreground/25 [&_[data-slot=select-trigger]]:bg-muted/35 [&_[data-slot=select-trigger]]:shadow-sm [&_textarea]:border-muted-foreground/25 [&_textarea]:bg-muted/35 [&_textarea]:shadow-sm dark:[&_[data-slot=input]]:border-input dark:[&_[data-slot=input]]:bg-input/30 dark:[&_[data-slot=select-trigger]]:border-input dark:[&_[data-slot=select-trigger]]:bg-input/30 dark:[&_textarea]:border-input dark:[&_textarea]:bg-input/30'
      onSubmit={handleSubmit}
    >
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
          <div className='min-w-0 space-y-6'>
            <section className='space-y-4 border-b pb-5'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-account-number'>
                    Account Number
                  </label>
                  <Input
                    id='subscriber-account-number'
                    value={form.accountNumber}
                    onChange={(event) => updateField('accountNumber', event.target.value)}
                    className='font-mono'
                    aria-invalid={showErrors && !form.accountNumber.trim()}
                  />
                  {showErrors && !form.accountNumber.trim() && (
                    <p className='text-xs text-destructive'>Enter an account number.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-phone'>
                    Phone Number
                  </label>
                  <Input
                    id='subscriber-phone'
                    value={form.phoneNumber}
                    onChange={(event) => updateField('phoneNumber', event.target.value)}
                    aria-invalid={showErrors && !form.phoneNumber.trim()}
                  />
                  {showErrors && !form.phoneNumber.trim() && (
                    <p className='text-xs text-destructive'>Enter a phone number.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-first-name'>
                    First Name
                  </label>
                  <Input
                    id='subscriber-first-name'
                    value={form.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                    aria-invalid={showErrors && !form.firstName.trim()}
                  />
                  {showErrors && !form.firstName.trim() && (
                    <p className='text-xs text-destructive'>Enter the first name.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-last-name'>
                    Last Name
                  </label>
                  <Input
                    id='subscriber-last-name'
                    value={form.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                    aria-invalid={showErrors && !form.lastName.trim()}
                  />
                  {showErrors && !form.lastName.trim() && (
                    <p className='text-xs text-destructive'>Enter the last name.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5 sm:col-span-2'>
                  <label className='text-sm font-medium' htmlFor='subscriber-email'>
                    Email
                  </label>
                  <Input
                    id='subscriber-email'
                    type='email'
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className='space-y-4 border-b pb-5'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-city'>
                    City
                  </label>
                  <Input
                    id='subscriber-city'
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    aria-invalid={showErrors && !form.city.trim()}
                  />
                  {showErrors && !form.city.trim() && (
                    <p className='text-xs text-destructive'>Enter the city.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-barangay'>
                    Barangay
                  </label>
                  <Input
                    id='subscriber-barangay'
                    value={form.barangay}
                    onChange={(event) => updateField('barangay', event.target.value)}
                    aria-invalid={showErrors && !form.barangay.trim()}
                  />
                  {showErrors && !form.barangay.trim() && (
                    <p className='text-xs text-destructive'>Enter the barangay.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-street-zone'>
                    Street/Zone
                  </label>
                  <Input
                    id='subscriber-street-zone'
                    value={form.streetZone}
                    onChange={(event) => updateField('streetZone', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className='space-y-4 border-b pb-5'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-branch'>
                    Branch
                  </label>
                  <Select value={form.branchId} onValueChange={(value) => updateField('branchId', value)}>
                    <SelectTrigger id='subscriber-branch' className='w-full' aria-invalid={showErrors && !form.branchId}>
                      <SelectValue placeholder='Select branch' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {activeBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {showErrors && !form.branchId && (
                    <p className='text-xs text-destructive'>Select a branch.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-connection-type'>
                    Connection Type
                  </label>
                  <Select
                    value={form.connectionType}
                    onValueChange={(value) => updateField('connectionType', value)}
                  >
                    <SelectTrigger
                      id='subscriber-connection-type'
                      className='w-full'
                      aria-invalid={showErrors && !form.connectionType}
                    >
                      <SelectValue placeholder='Select connection' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='FTTH'>FTTH</SelectItem>
                        <SelectItem value='COAX'>COAX</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {showErrors && !form.connectionType && (
                    <p className='text-xs text-destructive'>Select a connection type.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-contract-start'>
                    Contract Start
                  </label>
                  <Input
                    id='subscriber-contract-start'
                    type='date'
                    value={form.contractStart}
                    onChange={(event) => updateField('contractStart', event.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-contract-end'>
                    Contract End
                  </label>
                  <Input
                    id='subscriber-contract-end'
                    type='date'
                    value={form.contractEnd}
                    onChange={(event) => updateField('contractEnd', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-mac-address'>
                    MAC Address
                  </label>
                  <Input
                    id='subscriber-mac-address'
                    value={form.macAddress}
                    onChange={(event) => updateField('macAddress', event.target.value)}
                    className='font-mono uppercase'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-caid'>
                    CAID
                  </label>
                  <Input
                    id='subscriber-caid'
                    value={form.caid}
                    onChange={(event) => updateField('caid', event.target.value)}
                    className='font-mono'
                  />
                </div>
                <div className='flex flex-col gap-1.5 sm:col-span-2'>
                  <label className='text-sm font-medium' htmlFor='subscriber-modem-type'>
                    Modem Type
                  </label>
                  <Select
                    value={form.modemId || NO_MODEM_VALUE}
                    onValueChange={(value) => updateField('modemId', value === NO_MODEM_VALUE ? '' : value)}
                  >
                    <SelectTrigger id='subscriber-modem-type' className='w-full'>
                      <SelectValue placeholder='Select modem type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={NO_MODEM_VALUE}>Unassigned</SelectItem>
                        {activeModems.map((modem) => (
                          <SelectItem key={modem.id} value={modem.id}>
                            {modem.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>

          <div className='min-w-0 space-y-6'>
            <section className='space-y-4 border-b pb-5'>
              <div className='grid gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-subscription-category'>
                    Subscription Category
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type='button'
                        variant='outline'
                        size='lg'
                        id='subscriber-subscription-category'
                        className='w-full justify-between px-3 font-normal'
                      aria-invalid={showErrors && !form.subscriptionCategoryId && !form.subscriptionGroupId}
                      >
                        {selectedCategoryGroup ? (
                          <span className='flex min-w-0 items-center gap-3'>
                            <span className='flex shrink-0 items-center'>
                              {selectedCategoryGroup.categories.slice(0, 3).map((category, index) => (
                                <CategoryPickerIcon
                                  key={category.id}
                                  name={category.name}
                                  iconDataUrl={category.iconDataUrl}
                                  className={index > 0 ? '-ml-2' : undefined}
                                />
                              ))}
                            </span>
                            <span className='min-w-0 text-left'>
                              <span className='block truncate text-sm text-foreground'>{selectedCategoryGroup.name}</span>
                              <span className='block truncate text-xs text-muted-foreground'>
                                {selectedCategoryGroup.categories.map((category) => category.name).join(' + ')}
                              </span>
                            </span>
                          </span>
                        ) : selectedCategory ? (
                          <span className='flex min-w-0 items-center gap-3'>
                            <CategoryPickerIcon
                              name={selectedCategory.name}
                              iconDataUrl={selectedCategory.iconDataUrl}
                            />
                            <span className='truncate text-sm text-foreground'>{selectedCategory.name}</span>
                          </span>
                        ) : (
                          <span className='truncate text-sm text-muted-foreground'>Select category</span>
                        )}
                        <ChevronDownIcon className='size-4 text-muted-foreground' aria-hidden='true' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='min-w-[360px]'>
                      <DropdownMenuRadioGroup value={subscriptionCategoryValue} onValueChange={updateSubscriptionCategory}>
                        {categoryGroupSections.sections.length > 0 && (
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className='px-2 pt-2 pb-1 text-[11px] font-medium uppercase text-muted-foreground'>
                              Group Categories
                            </DropdownMenuLabel>
                            {categoryGroupSections.sections.map((group) => (
                              <DropdownMenuRadioItem
                                key={group.id}
                                value={`${GROUP_VALUE_PREFIX}${group.id}`}
                                id={`subscriber-category-group-${group.id}`}
                                data-value={`subscriber-category-group-${group.id}`}
                                textValue={group.name}
                                className='min-h-12 py-2'
                              >
                                <span className='pointer-events-none flex min-w-0 flex-1 items-center gap-3'>
                                  <span className='flex shrink-0 items-center'>
                                    {group.categories.slice(0, 3).map((category, index) => (
                                      <CategoryPickerIcon
                                        key={category.id}
                                        name={category.name}
                                        iconDataUrl={category.iconDataUrl}
                                        className={index > 0 ? '-ml-2' : undefined}
                                      />
                                    ))}
                                  </span>
                                  <span className='min-w-0 flex-1'>
                                    <span className='block truncate'>{group.name}</span>
                                    <span className='block truncate text-xs text-muted-foreground'>
                                      {group.categories.map((category) => category.name).join(' + ')}
                                    </span>
                                  </span>
                                </span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuGroup>
                        )}
                        {categoryGroupSections.singleCategories.length > 0 && (
                          <DropdownMenuGroup>
                            {categoryGroupSections.sections.length > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className='px-2 pt-2 pb-1 text-[11px] font-medium uppercase text-muted-foreground'>
                              Single Categories
                            </DropdownMenuLabel>
                            {categoryGroupSections.singleCategories.map((category) => (
                              <DropdownMenuRadioItem
                                key={category.id}
                                value={`${CATEGORY_VALUE_PREFIX}${category.id}`}
                                id={`subscriber-category-${category.id}`}
                                data-value={`subscriber-category-${category.id}`}
                                textValue={category.name}
                                className='min-h-12 py-2'
                              >
                                <span className='pointer-events-none flex min-w-0 flex-1 items-center gap-3'>
                                  <CategoryPickerIcon name={category.name} iconDataUrl={category.iconDataUrl} />
                                  <span className='truncate'>{category.name}</span>
                                </span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuGroup>
                        )}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {showErrors && !form.subscriptionCategoryId && !form.subscriptionGroupId && (
                    <p className='text-xs text-destructive'>Select a subscription category.</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-subscription-plan'>
                    Subscription Plan
                  </label>
                  <Select
                    value={form.subscriptionPlanId}
                    onValueChange={(value) => updateField('subscriptionPlanId', value)}
                    disabled={availablePlans.length === 0}
                  >
                    <SelectTrigger
                      id='subscriber-subscription-plan'
                      className='w-full'
                      aria-invalid={showErrors && !form.subscriptionPlanId}
                    >
                      <SelectValue placeholder='Select plan' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {showErrors && !form.subscriptionPlanId && (
                    <p className='text-xs text-destructive'>Select a subscription plan.</p>
                  )}
                </div>
              </div>
            </section>

            {selectedCategoryFields.length > 0 && (
              <section className='space-y-4 border-b pb-5'>
                <div className='grid gap-4'>
                  {selectedCategoryFields.map(renderDynamicField)}
                </div>
              </section>
            )}

            <section className='space-y-4'>
              <div className='grid gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-contract-picture'>
                    Contract Picture
                  </label>
                  <Input
                    id='subscriber-contract-picture'
                    type='file'
                    accept='image/*'
                    onChange={(event) => setContractPicture(event.target.files?.[0] ?? null)}
                  />
                  {contractPicture && (
                    <p className='truncate text-xs text-muted-foreground'>{contractPicture.name}</p>
                  )}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium' htmlFor='subscriber-remarks'>
                    Remarks
                  </label>
                  <textarea
                    id='subscriber-remarks'
                    value={form.remarks}
                    onChange={(event) => updateField('remarks', event.target.value)}
                    className='min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className='flex shrink-0 justify-end gap-2 border-t bg-background p-4 sm:px-6'>
        <Button type='button' variant='outline' size='sm' onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type='submit' size='sm' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        {!subscriber && (
          <Button
            type='button'
            variant='secondary'
            size='sm'
            onClick={() => submitSubscriber(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Proceed to Installation'}
          </Button>
        )}
      </div>
    </form>
  )
}
