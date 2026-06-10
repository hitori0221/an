'use client'

import { useEffect, useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/animate-ui/components/radix/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  PlanStatus,
  SubscriptionPlan,
  SubscriptionPlanCategory,
  SubscriptionPlanCategoryGroup,
} from '../data-table/types'

type BillingType = SubscriptionPlan['billingType']

type EditPlanDrawerProps = {
  plan: SubscriptionPlan | null
  categories: SubscriptionPlanCategory[]
  groups: SubscriptionPlanCategoryGroup[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (plan: SubscriptionPlan) => void
}

const billingTypes: BillingType[] = ['Prepaid', 'Postpaid']
const planStatuses: PlanStatus[] = ['Active', 'Draft', 'Archived']

const emptyForm = {
  code: '',
  name: '',
  planTarget: '',
  billingType: 'Prepaid' as BillingType,
  speed: '',
  channels: '',
  price: '',
  status: 'Draft' as PlanStatus,
}

export function EditPlanDrawer({
  plan,
  categories,
  groups,
  open,
  onOpenChange,
  onSubmit,
}: EditPlanDrawerProps) {
  const [form, setForm] = useState(emptyForm)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    if (!plan) return

    setForm({
      code: plan.code,
      name: plan.name,
      planTarget: plan.categoryType === 'group' && plan.groupId
        ? `group:${plan.groupId}`
        : plan.categoryId
          ? `category:${plan.categoryId}`
          : '',
      billingType: plan.billingType,
      speed: plan.speed === '-' ? '' : plan.speed,
      channels: plan.channels === '-' ? '' : plan.channels,
      price: String(plan.price),
      status: plan.status,
    })
    setShowErrors(false)
  }, [plan])

  const handleSubmit = () => {
    if (!plan) return

    const cleanCode = form.code.trim().toUpperCase()
    const cleanName = form.name.trim()
    const [targetType, targetId] = form.planTarget.split(':') as ['category' | 'group', string]
    const selectedCategory = targetType === 'category'
      ? categories.find((category) => category.id === targetId)
      : null
    const selectedGroup = targetType === 'group'
      ? groups.find((group) => group.id === targetId)
      : null
    const selectedTarget = selectedGroup ?? selectedCategory
    const price = Number(form.price)
    const hasErrors = !cleanCode || !cleanName || !selectedTarget || !Number.isFinite(price) || price < 0

    setShowErrors(hasErrors)
    if (hasErrors) return

    onSubmit({
      ...plan,
      code: cleanCode,
      name: cleanName,
      categoryId: selectedCategory?.id ?? null,
      groupId: selectedGroup?.id ?? null,
      categoryType: selectedGroup ? 'group' : 'category',
      category: selectedTarget.name,
      billingType: form.billingType,
      speed: form.speed.trim() || '-',
      channels: form.channels.trim() || '-',
      price,
      status: form.status,
      updatedAt: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:w-[420px]' side='right'>
        <SheetHeader className='pr-12'>
          <div className='min-w-0'>
            <SheetTitle>Edit Plan</SheetTitle>
            <SheetDescription>
              Update the plan details used for subscriber assignment, import, and export.
            </SheetDescription>
          </div>
        </SheetHeader>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4'>
          <div className='grid gap-1.5'>
            <label className='text-sm font-medium' htmlFor='edit-plan-code'>
              Plan Code
            </label>
            <Input
              id='edit-plan-code'
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder='INT-LITE-25'
              className='font-mono uppercase'
              aria-invalid={showErrors && !form.code.trim()}
            />
            {showErrors && !form.code.trim() && (
              <p className='text-xs text-destructive'>Enter a plan code.</p>
            )}
          </div>
          <div className='grid gap-1.5'>
            <label className='text-sm font-medium' htmlFor='edit-plan-name'>
              Plan name
            </label>
            <Input
              id='edit-plan-name'
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder='AN Fiber 150mbps'
              aria-invalid={showErrors && !form.name.trim()}
            />
            {showErrors && !form.name.trim() && (
              <p className='text-xs text-destructive'>Enter a plan name.</p>
            )}
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <label className='text-sm font-medium' htmlFor='edit-plan-category'>
                Category
              </label>
              <Select
                value={form.planTarget}
                onValueChange={(value) => setForm((current) => ({ ...current, planTarget: value }))}
              >
                <SelectTrigger id='edit-plan-category' className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={`category:${category.id}`}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={`group:${group.id}`}>
                      {group.name} (Group)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <label className='text-sm font-medium' htmlFor='edit-plan-billing'>
                Billing
              </label>
              <Select
                value={form.billingType}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, billingType: value as BillingType }))
                }
              >
                <SelectTrigger id='edit-plan-billing' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingTypes.map((billingType) => (
                    <SelectItem key={billingType} value={billingType}>
                      {billingType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='grid gap-1.5'>
            <label className='text-sm font-medium' htmlFor='edit-plan-status'>
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, status: value as PlanStatus }))
              }
            >
              <SelectTrigger id='edit-plan-status' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {planStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <label className='text-sm font-medium' htmlFor='edit-plan-speed'>
                Speed
              </label>
              <Input
                id='edit-plan-speed'
                value={form.speed}
                onChange={(event) => setForm((current) => ({ ...current, speed: event.target.value }))}
                placeholder='150 Mbps'
              />
            </div>
            <div className='grid gap-1.5'>
              <label className='text-sm font-medium' htmlFor='edit-plan-channels'>
                Channels
              </label>
              <Input
                id='edit-plan-channels'
                value={form.channels}
                onChange={(event) =>
                  setForm((current) => ({ ...current, channels: event.target.value }))
                }
                placeholder='75 channels'
              />
            </div>
          </div>
          <div className='grid gap-1.5'>
            <label className='text-sm font-medium' htmlFor='edit-plan-price'>
              Price (PHP)
            </label>
            <div className='relative'>
              <span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                PHP
              </span>
              <Input
                id='edit-plan-price'
                inputMode='numeric'
                className='pl-10'
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder='1299'
                aria-invalid={showErrors && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)}
              />
            </div>
            {showErrors && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) && (
              <p className='text-xs text-destructive'>Enter a valid price.</p>
            )}
          </div>
        </div>
        <SheetFooter className='border-t bg-muted/10'>
          <Button type='button' variant='ghost' size='sm' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' size='sm' onClick={handleSubmit}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
