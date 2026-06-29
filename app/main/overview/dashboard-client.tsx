'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  RadioTower,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wifi,
  Wrench,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { DashboardData } from '@/lib/dashboard'

const revenueConfig = {
  revenue: { label: 'Collected', color: 'var(--chart-1)' },
} satisfies ChartConfig

const activityConfig = {
  installations: { label: 'Installations', color: 'var(--chart-1)' },
  tickets: { label: 'Service tickets', color: 'var(--chart-4)' },
} satisfies ChartConfig

const trendFor = (current: number, previous: number, suffix = '') => {
  if (previous === 0 && current === 0) return { direction: 'flat' as const, value: `0${suffix}` }
  if (previous === 0) return { direction: 'up' as const, value: `+${current}${suffix}` }

  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 1) return { direction: 'flat' as const, value: `0${suffix}` }

  return {
    direction: change > 0 ? 'up' as const : 'down' as const,
    value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
  }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const updatedAt = new Date(data.updatedAt)
  const currentMonth = updatedAt.toLocaleDateString('en-US', { month: 'long' })
  const currentDate = updatedAt.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const latestRevenue = data.revenue.at(-1)?.revenue ?? 0
  const previousRevenue = data.revenue.at(-2)?.revenue ?? 0
  const latestActivity = data.activity.at(-1)
  const previousActivity = data.activity.at(-2)
  const activeShare = data.totalSubscribers ? (data.metrics.activeSubscribers / data.totalSubscribers) * 100 : 0
  const metrics = [
    { label: 'Active subscribers', value: data.metrics.activeSubscribers.toLocaleString(), detail: `${data.totalSubscribers.toLocaleString()} total accounts`, icon: Users, accent: 'border-l-emerald-500/45 bg-emerald-500/[0.015]', iconAccent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', trendAccent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', trend: { direction: 'up' as const, value: `${activeShare.toFixed(0)}%`, label: 'active' } },
    { label: 'Monthly collections', value: `₱${data.metrics.monthlyCollections.toLocaleString()}`, detail: `${data.paidAccounts.toLocaleString()} paying accounts`, icon: Banknote, accent: 'border-l-blue-500/55 bg-blue-500/[0.025] shadow-blue-950/5', iconAccent: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', trendAccent: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', trend: { ...trendFor(latestRevenue, previousRevenue), label: 'vs last month' } },
    { label: 'Pending installations', value: data.metrics.pendingInstallations.toLocaleString(), detail: 'Pending, scheduled, or in progress', icon: RadioTower, accent: 'border-l-sky-500/40 bg-sky-500/[0.015]', iconAccent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', trendAccent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', trend: { ...trendFor(latestActivity?.installations ?? 0, previousActivity?.installations ?? 0), label: 'today' } },
    { label: 'Open service tickets', value: data.metrics.openJobOrders.toLocaleString(), detail: 'Excludes resolved and closed', icon: TicketCheck, accent: 'border-l-orange-500/45 bg-orange-500/[0.015]', iconAccent: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', trendAccent: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', trend: { ...trendFor(latestActivity?.tickets ?? 0, previousActivity?.tickets ?? 0), label: 'today' } },
  ]
  const collectionRate = data.totalSubscribers ? Math.min(100, (data.paidAccounts / data.totalSubscribers) * 100) : 0
  const totalInstalls = data.activity.reduce((sum, item) => sum + item.installations, 0)
  const totalTickets = data.activity.reduce((sum, item) => sum + item.tickets, 0)
  const serviceAreaCount = new Set(data.workOrders.map((order) => order.location).filter(Boolean)).size
  const fieldWorkSummary = data.workOrders.length === 0
    ? 'No active job orders right now'
    : `${data.workOrders.length} active ${data.workOrders.length === 1 ? 'job' : 'jobs'} across ${serviceAreaCount} ${serviceAreaCount === 1 ? 'service area' : 'service areas'}`

  return (
    <main id="dashboard" className="min-h-full overflow-hidden bg-muted/25">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-1 py-2 sm:gap-6 sm:p-6 lg:p-8">
        <section className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-fredoka text-[2rem] font-semibold leading-[1.05] tracking-tight sm:text-4xl">Good morning, team.</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">Here&apos;s the pulse of your network for {currentDate}.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button variant="outline" className="px-3 sm:px-4" asChild>
              <Link href="/main/job-orders"><Wrench data-icon="inline-start" />View job orders</Link>
            </Button>
            <Button className="px-3 sm:px-4" asChild>
              <Link href="/main/subscribers?create=1"><UserPlus data-icon="inline-start" />Add subscriber</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            const TrendIcon = metric.trend.direction === 'down' ? TrendingDown : metric.trend.direction === 'up' ? TrendingUp : Activity
            return (
              <Card key={metric.label} className={`gap-2 overflow-hidden border-border/70  py-2 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:gap-6 sm:py-6 ${metric.accent}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 px-2 pb-0 sm:px-6 sm:pb-3">
                  <div className="flex flex-col gap-1">
                    <CardDescription className="text-xs leading-tight sm:text-sm">{metric.label}</CardDescription>
                    <CardTitle className="text-xl tracking-tight sm:text-3xl">{metric.value}</CardTitle>
                    <span className={`mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none sm:text-xs ${metric.trendAccent}`}>
                      <TrendIcon className="size-3" />
                      <span>{metric.trend.value}</span>
                      <span className="hidden sm:inline">{metric.trend.label}</span>
                    </span>
                  </div>
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl ${metric.iconAccent}`}><Icon className="size-4 sm:size-5" /></div>
                </CardHeader>
                <CardContent className="hidden items-center gap-2 px-4 text-xs text-muted-foreground sm:flex sm:px-6">
                  <span>{metric.detail}</span>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue performance</CardTitle>
                <CardDescription>Collections against target, last six months</CardDescription>
              </div>
              <Badge variant="outline"><CalendarDays />Last 6 months</Badge>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                <AreaChart accessibilityLayer data={data.revenue} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.32} /><stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value / 1000}K`} width={58} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `₱${Number(value).toLocaleString()}`} />} />
                  <Area dataKey="revenue" type="monotone" fill="url(#fillRevenue)" stroke="var(--color-revenue)" strokeWidth={2.5} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Collection target</CardTitle>
              <CardDescription>{currentMonth} billing cycle</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#3B82F6_0%,#2563EB_55%,#1D4ED8_100%)] p-5 text-primary-foreground">
                <p className="text-sm opacity-75">Collected this month</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">₱{data.metrics.monthlyCollections.toLocaleString()}</p>
                <div className="mt-5 flex items-end justify-between gap-4 text-sm"><span className="opacity-75">Subscriber coverage</span><span className="font-medium">{collectionRate.toFixed(1)}%</span></div>
                <Progress value={collectionRate} className="mt-2 bg-primary-foreground/20 [&_[data-slot=progress-indicator]]:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Paid accounts</p><p className="mt-1 text-2xl font-semibold">{data.paidAccounts.toLocaleString()}</p></div>
                <div><p className="text-sm text-muted-foreground">Not yet paid</p><p className="mt-1 text-2xl font-semibold">{Math.max(0, data.totalSubscribers - data.paidAccounts).toLocaleString()}</p></div>
              </div>
              <Separator />
              <Button variant="ghost" className="justify-between" asChild><Link href="/main/collections">Open collections report<ArrowUpRight data-icon="inline-end" /></Link></Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Active field work</CardTitle><CardDescription>{fieldWorkSummary}</CardDescription></div>
              <Button variant="ghost" size="sm" asChild><Link href="/main/job-orders">View all<ChevronRight data-icon="inline-end" /></Link></Button>
            </CardHeader>
            <CardContent className="flex flex-col">
              {data.workOrders.length === 0 && (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleCheck className="size-5" /></div>
                  <div><p className="text-sm font-medium">All jobs are complete—nice!</p><p className="mt-1 text-xs text-muted-foreground">Zero jobs in the queue. Enjoy the calm while it lasts.</p></div>
                  <Button variant="outline" size="sm" asChild><Link href="/main/job-orders?create=1">Create job order</Link></Button>
                </div>
              )}
              {data.workOrders.map((order, index) => (
                <div key={order.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                    <Avatar className="size-10"><AvatarFallback>{order.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{order.customer}</p><p className="truncate text-xs text-muted-foreground">{order.type} · {order.location}</p></div>
                    <div className="hidden text-right sm:block"><p className="text-sm font-medium">{order.technician}</p><p className="text-xs text-muted-foreground">{order.ticketNumber}</p></div>
                    <Badge variant={order.status === 'In Progress' ? 'default' : 'secondary'}>{order.status}</Badge>
                    <Button variant="ghost" size="icon" aria-label={`Open ${order.ticketNumber}`} asChild><Link href={`/main/job-orders?q=${encodeURIComponent(order.ticketNumber)}`}><ArrowUpRight /></Link></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader><CardTitle>Operations this week</CardTitle><CardDescription>Completed installations and new tickets</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ChartContainer config={activityConfig} className="h-[210px] w-full">
                <BarChart accessibilityLayer data={data.activity}><CartesianGrid vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /><Bar dataKey="installations" fill="var(--color-installations)" radius={[4, 4, 0, 0]} /><Bar dataKey="tickets" fill="var(--color-tickets)" radius={[4, 4, 0, 0]} /></BarChart>
              </ChartContainer>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 rounded-xl bg-muted p-3"><Wifi className="size-4 text-primary" /><span className="text-xl font-semibold">{totalInstalls}</span><span className="text-xs text-muted-foreground">Installs</span></div>
                <div className="flex flex-col gap-1 rounded-xl bg-muted p-3"><Activity className="size-4 text-primary" /><span className="text-xl font-semibold">{totalTickets}</span><span className="text-xs text-muted-foreground">Tickets</span></div>
                <div className="flex flex-col gap-1 rounded-xl bg-muted p-3"><CircleCheck className="size-4 text-primary" /><span className="text-xl font-semibold">{totalInstalls}</span><span className="text-xs text-muted-foreground">Completed</span></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 pb-2 text-xs text-muted-foreground"><span>AN System · Operations overview</span><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />Loaded {updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></footer>
      </div>
    </main>
  )
}
