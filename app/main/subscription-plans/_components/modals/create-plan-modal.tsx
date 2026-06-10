'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
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

type CreatePlanModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: SubscriptionPlanCategory[]
  groups: SubscriptionPlanCategoryGroup[]
  onCancel: () => void
  onSubmit: (plan: SubscriptionPlan) => void
}

const billingTypes: BillingType[] = ['Prepaid', 'Postpaid']
const planStatuses: PlanStatus[] = ['Active', 'Draft', 'Archived']

const defaultForm = {
  code: '',
  name: '',
  planTarget: '',
  billingType: 'Prepaid' as BillingType,
  status: 'Draft' as PlanStatus,
  speed: '',
  channels: '',
  price: '',
}

export function CreatePlanModal({
  open,
  onOpenChange,
  categories,
  groups,
  onCancel,
  onSubmit,
}: CreatePlanModalProps) {
  const [form, setForm] = useState(defaultForm)
  const [showErrors, setShowErrors] = useState(false)
  const defaultPlanTarget = categories[0]?.id
    ? `category:${categories[0].id}`
    : groups[0]?.id
      ? `group:${groups[0].id}`
      : ''
  useEffect(() => {
    if (!open || form.planTarget || !defaultPlanTarget) return

    setForm((current) => ({ ...current, planTarget: defaultPlanTarget }))
  }, [defaultPlanTarget, form.planTarget, open])

  const resetForm = () => {
    setForm({
      ...defaultForm,
      planTarget: defaultPlanTarget,
    })
    setShowErrors(false)
  }

  const handleSubmit = () => {
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
      id: `pending-${Date.now()}`,
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
      subscribers: 0,
      status: form.status,
      updatedAt: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    })
    resetForm()
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[600px] flex-col overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-2rem)]'
        from='top'
      >
        <DialogHeader className='border-b p-4 pr-12 sm:p-6'>
          <DialogTitle className='text-base'>Add Plan</DialogTitle>
          <DialogDescription>Create a subscription plan for subscriber accounts.</DialogDescription>
        </DialogHeader>
        <div className='overflow-y-auto p-4 sm:p-5'>
          <div className='grid gap-4'>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-code'>
                Plan code
              </label>
              <Input
                id='plan-code'
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder='INT-LITE-25'
                className='font-mono text-[15px] uppercase sm:text-sm'
                aria-invalid={showErrors && !form.code.trim()}
              />
              {showErrors && !form.code.trim() && (
                <p className='text-xs text-destructive'>Enter a plan code.</p>
              )}
            </div>
            <div className='grid gap-1.5'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-name'>
                Plan name
              </label>
              <Input
                id='plan-name'
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder='AN Fiber 150mbps'
                className='text-[15px] sm:text-sm'
                aria-invalid={showErrors && !form.name.trim()}
              />
              {showErrors && !form.name.trim() && (
                <p className='text-xs text-destructive'>Enter a plan name.</p>
              )}
            </div>
            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='grid gap-1.5'>
                <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-category'>
                  Category
                </label>
                <Select
                  value={form.planTarget || defaultPlanTarget}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, planTarget: value }))
                  }
                >
                  <SelectTrigger id='plan-category' className='h-10 w-full bg-background/40'>
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
                <label className='text-[13px] font-medium sm:text-sm' htmlFor='billing-type'>
                  Billing
                </label>
                <Select
                  value={form.billingType}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, billingType: value as BillingType }))
                  }
                >
                  <SelectTrigger id='billing-type' className='h-10 w-full bg-background/40'>
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
              <div className='grid gap-1.5'>
                <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-status'>
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, status: value as PlanStatus }))
                  }
                >
                  <SelectTrigger id='plan-status' className='h-10 w-full bg-background/40'>
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
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='grid gap-1.5'>
                <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-speed'>
                  Speed
                </label>
                <Input
                  id='plan-speed'
                  value={form.speed}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, speed: event.target.value }))
                  }
                  placeholder='150 Mbps'
                  className='text-[15px] sm:text-sm'
                />
              </div>
              <div className='grid gap-1.5'>
                <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-channels'>
                  Channels
                </label>
                <Input
                  id='plan-channels'
                  value={form.channels}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, channels: event.target.value }))
                  }
                  placeholder='75 channels'
                  className='text-[15px] sm:text-sm'
                />
              </div>
            </div>
            <div className='grid w-full gap-1.5 sm:max-w-[220px]'>
              <label className='text-[13px] font-medium sm:text-sm' htmlFor='plan-price'>
                Price (PHP)
              </label>
              <div className='relative'>
                <span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground sm:text-sm'>
                  PHP
                </span>
                <Input
                  id='plan-price'
                  inputMode='numeric'
                  className='pl-10 text-[15px] sm:text-sm'
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: event.target.value }))
                  }
                  placeholder='1299'
                  aria-invalid={showErrors && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)}
                />
              </div>
              {showErrors && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) && (
                <p className='text-xs text-destructive'>Enter a valid price.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className='border-t bg-muted/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-4'>
          <Button type='button' variant='ghost' size='sm' onClick={handleCancel}>
            Cancel
          </Button>
          <Button type='button' size='sm' onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
