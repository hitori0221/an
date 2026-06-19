'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { logout } from '@/app/login/actions';
import type { ServiceRequestCategory } from '@/lib/subscription-plans';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSearchProvider } from '@/components/data-table/shared/table-search-context';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/animate-ui/components/radix/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/animate-ui/primitives/radix/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import {
  ArrowDownToLine as Download,
  ArrowRightFromSquare as LogOut,
  ArrowUpFromLine as Upload,
  ChartPie as PieChartIcon,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollar as CoinsIcon,
  FaceRobot as Bot,
  Funnel,
  Gear as Settings2,
  LayoutCells as Frame,
  Magnifier as Search,
  Person as User,
  Plus,
  Route as Waypoints,
  SealCheck as BadgeCheck,
  ShieldKeyhole as ShieldCogCorner,
  CreditCard,
  GearBranches,
  Tag,
} from '@gravity-ui/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';


const DATA = {
  workspaces: [
    {
      name: 'AN System',
      logo: Waypoints,
      plan: 'Operations',
    },
    {
      name: 'AN System',
      logo: CoinsIcon,
      plan: 'Billing Management',
    },
    {
      name: 'AN System',
      logo: ShieldCogCorner,
      plan: 'Administrator',
    },
  ],
  navMain: [
    {
      title: 'Overview',
      url: '/main/overview',
      icon: PieChartIcon,
      isActive: true,
      items: [
        {
          title: 'Dashboard',
          url: '/main/overview/#dashboard',
        },
        {
          title: 'Manager View',
          url: '#',
        }
      ],
    },
    {
      title: 'Subscribers',
      url: '/main/subscribers',
      icon: User,
    },
    {
      title: 'Installations',
      url: '/main/installations',
      icon: Settings2,
    },
    {
      title: 'Job Order',
      url: '/main/job-orders',
      icon: Bot,
    }
  ],
  billingNavMain: [
    {
      title: 'Payments',
      url: '/main/payments',
      icon: CreditCard,
    },
    {
      title: 'Invoices',
      url: '/main/due-accounts',
      icon: CoinsIcon,
    },
    {
      title: 'Collections',
      url: '/main/collections',
      icon: BadgeCheck,
    },
  ],
  adminNavMain: [
    {
      title: 'Subscription Plans',
      url: '/main/subscription-plans',
      icon: Tag,
    },
    {
      title: 'Manage Modem',
      url: '/main/modems',
      icon: Settings2,
    },
    {
      title: 'Manage Branch',
      url: '/main/branches',
      icon: GearBranches,
    },
  ],
};

interface RadixSidebarDemoProps {
  children?: React.ReactNode;
  serviceRequestCategories: ServiceRequestCategory[];
  user: {
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

const SUBSCRIBER_STATUS_FILTERS = ['Active', 'Inactive', 'Pending'];
const SUBSCRIBER_PLAN_FILTERS = ['Basic 50 Mbps', 'Fiber 100 Mbps', 'Fiber 200 Mbps', 'Fiber 300 Mbps'];
const SUBSCRIPTION_PLAN_STATUS_FILTERS = ['Active', 'Draft', 'Archived'];
const WORKSPACE_DEFAULT_ROUTES: Record<string, string> = {
  Operations: '/main/overview',
  'Billing Management': '/main/payments',
  Administrator: '/main/subscription-plans',
};

export const RadixSidebarDemo = ({
  children,
  serviceRequestCategories,
  user,
}: RadixSidebarDemoProps) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getWorkspaceForPath = React.useCallback((path: string) => {
    if (DATA.billingNavMain.some((item) => path === item.url)) {
      return DATA.workspaces[1];
    }

    if (DATA.adminNavMain.some((item) => path === item.url)) {
      return DATA.workspaces[2];
    }

    return DATA.workspaces[0];
  }, []);
  const [activeWorkspace, setActiveWorkspace] = React.useState(() => getWorkspaceForPath(pathname));
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const subscriberSearchRef = React.useRef<HTMLInputElement>(null);
  const activeNavMain: NavItem[] =
    activeWorkspace.plan === 'Billing Management'
      ? DATA.billingNavMain
      : activeWorkspace.plan === 'Administrator'
        ? DATA.adminNavMain
        : DATA.navMain;
  const activeProjects =
    activeWorkspace.plan === 'Operations' ? serviceRequestCategories : [];
  const isSubscriberDetailsPage = pathname.startsWith('/main/subscribers/');
  const subscriberAccountNumber = isSubscriberDetailsPage
    ? decodeURIComponent(pathname.split('/').at(-1) ?? '')
    : '';
  const activeNavItem = activeNavMain.find((item) =>
    pathname === item.url || (item.url === '/main/subscribers' && isSubscriberDetailsPage),
  );
  const isServiceRequestPage = pathname === '/main/service-request';
  const serviceRequestCategoryFilter = searchParams.get('category') ?? 'all';
  const breadcrumbPage = isServiceRequestPage
    ? serviceRequestCategoryFilter === 'all'
      ? 'Service Request'
      : serviceRequestCategoryFilter
    : activeNavItem?.title ?? 'Overview';
  const isSubscribersPage = pathname === '/main/subscribers';
  const isInstallationsPage = pathname === '/main/installations';
  const isJobOrdersPage = pathname === '/main/job-orders';
  const isBranchesPage = pathname === '/main/branches';
  const isModemsPage = pathname === '/main/modems';
  const isSubscriptionPlansPage = pathname === '/main/subscription-plans';
  const isPaymentsPage = pathname === '/main/payments';
  const isDueAccountsPage = pathname === '/main/due-accounts';
  const isCollectionsPage = pathname === '/main/collections';
  const isBillingTablePage = isPaymentsPage || isDueAccountsPage || isCollectionsPage;
  const isTablePage = isSubscribersPage || isInstallationsPage || isJobOrdersPage || isBranchesPage || isModemsPage || isSubscriptionPlansPage || isBillingTablePage;
  const canAddFromHeader = !isCollectionsPage;
  const searchQuery = searchParams.get('q') ?? '';
  const [tableSearch, setTableSearch] = React.useState(searchQuery);
  const subscriberStatusFilter = searchParams.get('status') ?? 'all';
  const subscriberPlanFilter = searchParams.get('plan') ?? 'all';
  const activeSubscriberFilters = [
    subscriberStatusFilter !== 'all',
    subscriberPlanFilter !== 'all',
  ].filter(Boolean).length;
  const subscriptionPlanStatusFilter = searchParams.get('status') ?? 'all';
  const subscriptionPlanCategoryFilter = searchParams.get('category') ?? 'all';
  const activeSubscriptionPlanFilters = [
    subscriptionPlanStatusFilter !== 'all',
    subscriptionPlanCategoryFilter !== 'all',
  ].filter(Boolean).length;
  const searchPlaceholder = isJobOrdersPage
    ? 'Search job orders'
    : isInstallationsPage
      ? 'Search installations'
      : isPaymentsPage
        ? 'Search payments'
      : isDueAccountsPage
        ? 'Search invoices'
      : isCollectionsPage
        ? 'Search collections'
      : isBranchesPage
        ? 'Search branches'
        : isModemsPage
          ? 'Search modems'
        : isSubscriptionPlansPage
          ? 'Search plans'
          : 'Search subscribers';
  const addButtonLabel = isJobOrdersPage
    ? 'Add Job Order'
    : isInstallationsPage
      ? 'Add Installation'
      : isPaymentsPage
        ? 'Add Payment'
      : isDueAccountsPage
        ? 'Add Invoice'
      : isBranchesPage
        ? 'Add Branch'
        : isModemsPage
          ? 'Add Modem'
        : isSubscriptionPlansPage
          ? 'Add Plan'
          : 'Add Subscriber';
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const handleWorkspaceSelect = React.useCallback(
    (workspace: (typeof DATA.workspaces)[number]) => {
      setActiveWorkspace(workspace);

      const nextRoute = WORKSPACE_DEFAULT_ROUTES[workspace.plan];

      if (pathname === nextRoute) return;

      router.replace(nextRoute, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const updateSubscriberSearch = React.useCallback(
    (value: string) => {
      setTableSearch(value);
    },
    [],
  );

  const handleAddClick = React.useCallback(() => {
    if (!canAddFromHeader || (!isSubscribersPage && !isInstallationsPage && !isJobOrdersPage && !isBranchesPage && !isModemsPage && !isSubscriptionPlansPage && !isPaymentsPage && !isDueAccountsPage)) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set('create', '1');
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [canAddFromHeader, isBranchesPage, isDueAccountsPage, isInstallationsPage, isJobOrdersPage, isModemsPage, isPaymentsPage, isSubscribersPage, isSubscriptionPlansPage, pathname, router, searchParams]);

  const handleCategoryClick = React.useCallback(() => {
    if (!isSubscriptionPlansPage) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set('categoryDrawer', 'create');
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [isSubscriptionPlansPage, pathname, router, searchParams]);

  const updateSubscriberFilter = React.useCallback(
    (key: 'status' | 'plan', value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clearSubscriberFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('status');
    params.delete('plan');

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const updateSubscriptionPlanFilter = React.useCallback(
    (key: 'status' | 'category', value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clearSubscriptionPlanFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('status');
    params.delete('category');

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const expandSearch = React.useCallback(() => {
    setIsSearchExpanded(true);
    window.requestAnimationFrame(() => subscriberSearchRef.current?.focus());
  }, []);

  React.useEffect(() => {
    if (!isTablePage) return;

    const handleSearchShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (event.key !== '/' || isEditableTarget || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      event.preventDefault();
      expandSearch();
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, [expandSearch, isTablePage]);

  React.useEffect(() => {
    setIsSearchExpanded(false);
  }, [pathname]);

  React.useEffect(() => {
    setTableSearch(searchQuery);
  }, [pathname, searchQuery]);

  React.useEffect(() => {
    const workspaceForPath = getWorkspaceForPath(pathname);

    setActiveWorkspace((currentWorkspace) =>
      currentWorkspace.plan === workspaceForPath.plan ? currentWorkspace : workspaceForPath,
    );
  }, [getWorkspaceForPath, pathname]);

  if (!activeWorkspace) return null;

  return (
    <TableSearchProvider value={{ search: tableSearch, setSearch: setTableSearch }}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
          {/* Workspace Switcher */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="group/workspace-trigger data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="relative flex aspect-square size-8 items-center justify-center bg-transparent">
                      <span className="flex size-8 items-center justify-center overflow-hidden">
                        <Image
                          src="/logo.png"
                          alt="AN System"
                          width={32}
                          height={32}
                          priority
                          className="size-8 scale-125 object-cover"
                        />
                      </span>
                      <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-sidebar">
                        <activeWorkspace.logo className="size-2.5" />
                      </span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeWorkspace.name}
                      </span>
                      <p className='text-xs'>
                        {activeWorkspace.plan}
                      </p>
                    </div>
                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/workspace-trigger:rotate-180" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Workspaces
                  </DropdownMenuLabel>
                  {DATA.workspaces.map((workspace, index) => (
                    <DropdownMenuItem
                      key={`${workspace.name}-${workspace.plan}`}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <workspace.logo className="size-4 shrink-0" />
                      </div>
                      {workspace.plan}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Workspace Switcher */}
        </SidebarHeader>

        <SidebarContent>
          {/* Nav Main */}
          {activeNavMain.length > 0 && (
            <SidebarGroup>
              <SidebarMenu>
                {activeNavMain.map((item) => {
                  const isActive = pathname === item.url;
                  return item.items && item.items.length > 0 ? (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive || isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                        <Link href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          )}
          {/* Nav Main */}

          {/* Nav Project */}
          {activeProjects.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Service Request</SidebarGroupLabel>
            <SidebarMenu>
              {activeProjects.map((item) => {
                const isActive = pathname === '/main/service-request' && serviceRequestCategoryFilter === item.name;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={`/main/service-request?category=${encodeURIComponent(item.name)}`}>
                        {item.iconDataUrl ? (
                          <span className="relative size-4 shrink-0 overflow-hidden rounded-full" aria-hidden="true">
                            <Image
                              src={item.iconDataUrl}
                              alt=""
                              fill
                              unoptimized
                              sizes="16px"
                              className="scale-125 object-cover"
                            />
                          </span>
                        ) : (
                          <Frame />
                        )}
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="top-1.5">{item.pendingCount}</SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="pr-2 text-sidebar-foreground/70">
                  <Link href="/main/subscription-plans?categoryDrawer=create">
                    <Plus />
                    <span>Category</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          )}
          {/* Nav Project */}
        </SidebarContent>
        <SidebarFooter>
          {/* Nav User */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="group/user-trigger data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user.avatar ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/user-trigger:rotate-180" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={user.avatar ?? undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.name}
                        </span>
                        <span className="truncate text-xs">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck />
                      {user.role}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-between"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span>Theme</span>
                    <ThemeTogglerButton
                      variant="ghost"
                      size="xs"
                      direction="ltr"
                      modes={['light', 'dark', 'system']}
                      className="-mr-1"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="p-0"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <form action={logout} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
                      >
                        <LogOut />
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Nav User */}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 my-auto" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  {isSubscriberDetailsPage ? (
                    <BreadcrumbLink href="/main/subscribers">
                      Subscribers
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {isSubscriberDetailsPage && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="max-w-[48vw] truncate font-mono">
                        {subscriberAccountNumber}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {isTablePage && (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              {isSearchExpanded || tableSearch ? (
                <div className="relative w-44 sm:w-64">
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-blue-600" />
                  <Input
                    ref={subscriberSearchRef}
                    type="search"
                    placeholder={searchPlaceholder}
                    value={tableSearch}
                    onChange={(event) => updateSubscriberSearch(event.target.value)}
                    className="h-8 border-transparent bg-background/40 pl-8 pr-7 text-sm shadow-none hover:bg-muted/50 focus-visible:bg-background dark:bg-transparent dark:hover:bg-muted/40 dark:focus-visible:bg-background"
                    aria-label={searchPlaceholder}
                  />
                  <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-4 min-w-4 -translate-y-1/2 items-center justify-center rounded border bg-muted px-1 text-[9px] font-medium text-muted-foreground sm:flex">
                    /
                  </kbd>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={expandSearch}
                  aria-label={searchPlaceholder}
                >
                  <Search  />
                </Button>
              )}
              {isSubscriptionPlansPage && (
                <Button type="button" variant="ghost" size="sm" onClick={handleCategoryClick}>
                  <Settings2  data-icon="inline-start" />
                  <span className="hidden sm:inline">Category</span>
                </Button>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                {isSubscribersPage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={activeSubscriberFilters > 0 ? 'bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary' : undefined}
                      >
                        <Funnel  data-icon="inline-start" />
                        <span className="hidden sm:inline">
                          Filters{activeSubscriberFilters > 0 ? ` (${activeSubscriberFilters})` : ''}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={subscriberStatusFilter}
                        onValueChange={(value) => updateSubscriberFilter('status', value)}
                      >
                        <DropdownMenuRadioItem value="all">All statuses</DropdownMenuRadioItem>
                        {SUBSCRIBER_STATUS_FILTERS.map((status) => (
                          <DropdownMenuRadioItem key={status} value={status}>
                            {status}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Plan</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={subscriberPlanFilter}
                        onValueChange={(value) => updateSubscriberFilter('plan', value)}
                      >
                        <DropdownMenuRadioItem value="all">All plans</DropdownMenuRadioItem>
                        {SUBSCRIBER_PLAN_FILTERS.map((plan) => (
                          <DropdownMenuRadioItem key={plan} value={plan}>
                            {plan}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      {activeSubscriberFilters > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={clearSubscriberFilters}>
                            Clear filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isSubscriptionPlansPage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={activeSubscriptionPlanFilters > 0 ? 'bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary' : undefined}
                      >
                        <Funnel className="text-blue-600" data-icon="inline-start" />
                        <span className="hidden sm:inline">
                          Filters{activeSubscriptionPlanFilters > 0 ? ` (${activeSubscriptionPlanFilters})` : ''}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={subscriptionPlanStatusFilter}
                        onValueChange={(value) => updateSubscriptionPlanFilter('status', value)}
                      >
                        <DropdownMenuRadioItem value="all">All statuses</DropdownMenuRadioItem>
                        {SUBSCRIPTION_PLAN_STATUS_FILTERS.map((status) => (
                          <DropdownMenuRadioItem key={status} value={status}>
                            {status}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Category</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={subscriptionPlanCategoryFilter}
                        onValueChange={(value) => updateSubscriptionPlanFilter('category', value)}
                      >
                        <DropdownMenuRadioItem value="all">All categories</DropdownMenuRadioItem>
                        {serviceRequestCategories.map((category) => (
                          <DropdownMenuRadioItem key={category.id} value={category.name}>
                            {category.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      {activeSubscriptionPlanFilters > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={clearSubscriptionPlanFilters}>
                            Clear filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button type="button" variant="ghost" size="sm">
                  <Upload  data-icon="inline-start" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <Download  data-icon="inline-start" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                {canAddFromHeader && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:text-white"
                    onClick={handleAddClick}
                  >
                    <Plus  data-icon="inline-start" />
                    <span className="hidden font-semibold sm:inline">{addButtonLabel}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 pt-0">
          {children}
        </div>
        </SidebarInset>
      </SidebarProvider>
    </TableSearchProvider>
  );
};

export default RadixSidebarDemo;
