'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuAction,
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import {
  ArrowDownToLine as Download,
  ArrowRight as Forward,
  ArrowRightFromSquare as LogOut,
  ArrowUpFromLine as Upload,
  ChartPie as PieChart,
  ChartPie as PieChartIcon,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollar as CoinsIcon,
  Ellipsis as MoreHorizontal,
  FaceRobot as Bot,
  Folder,
  Gear as Settings2,
  LayoutCells as Frame,
  Magnifier as Search,
  MapPin as Map,
  Person as User,
  Plus,
  Route as Waypoints,
  SealCheck as BadgeCheck,
  ShieldKeyhole as ShieldCogCorner,
  Sparkles,
  TrashBin as Trash2,
  CreditCard,
} from '@gravity-ui/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

const DATA = {
  user: {
    name: 'Skyleen',
    email: 'skyleen@example.com',
    avatar:
      'https://pbs.twimg.com/profile_images/1909615404789506048/MTqvRsjo_400x400.jpg',
  },
  teams: [
    {
      name: 'Operations',
      logo: Waypoints,
      plan: 'AN System',
    },
    {
      name: 'Account / Billing',
      logo: CoinsIcon,
      plan: 'AN System',
    },
    {
      name: 'Administrator',
      logo: ShieldCogCorner,
      plan: 'AN System',
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
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

interface RadixSidebarDemoProps {
  children?: React.ReactNode;
}

export const RadixSidebarDemo = ({ children }: RadixSidebarDemoProps) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTeam, setActiveTeam] = React.useState(DATA.teams[0]);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const subscriberSearchRef = React.useRef<HTMLInputElement>(null);
  const activeNavItem = DATA.navMain.find((item) => pathname === item.url);
  const breadcrumbPage = activeNavItem?.title ?? 'Overview';
  const isSubscribersPage = pathname === '/main/subscribers';
  const isInstallationsPage = pathname === '/main/installations';
  const isJobOrdersPage = pathname === '/main/job-orders';
  const isTablePage = isSubscribersPage || isInstallationsPage || isJobOrdersPage;
  const subscriberSearch = searchParams.get('q') ?? '';
  const searchPlaceholder = isJobOrdersPage
    ? 'Search job orders'
    : isInstallationsPage
      ? 'Search installations'
      : 'Search subscribers';
  const addButtonLabel = isJobOrdersPage
    ? 'Add Job Order'
    : isInstallationsPage
      ? 'Add Installation'
      : 'Add Subscriber';

  const updateSubscriberSearch = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleAddClick = React.useCallback(() => {
    if (!isJobOrdersPage) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set('create', '1');
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [isJobOrdersPage, pathname, router, searchParams]);

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

  if (!activeTeam) return null;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" >
        <SidebarHeader>
          {/* Team Switcher */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="group/team-trigger data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
                      <activeTeam.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {activeTeam.name}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/team-trigger:rotate-180" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                  </DropdownMenuLabel>
                  {DATA.teams.map((team, index) => (
                    <DropdownMenuItem
                      key={team.name}
                      onClick={() => setActiveTeam(team)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      {team.name}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Add team
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Team Switcher */}
        </SidebarHeader>

        <SidebarContent>
          {/* Nav Main */}
          <SidebarGroup>
            <SidebarMenu>
              {DATA.navMain.map((item) => {
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
          {/* Nav Main */}

          {/* Nav Project */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Service Request</SidebarGroupLabel>
            <SidebarMenu>
              {DATA.projects.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-48 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align={isMobile ? 'end' : 'start'}
                      >
                        <DropdownMenuItem>
                          <Folder className="text-muted-foreground" />
                          <span>View Project</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Forward className="text-muted-foreground" />
                          <span>Share Project</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="text-muted-foreground" />
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <MoreHorizontal className="text-sidebar-foreground/70" />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
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
                        src={DATA.user.avatar}
                        alt={DATA.user.name}
                      />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {DATA.user.name}
                      </span>
                      <span className="truncate text-xs">
                        {DATA.user.email}
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
                          src={DATA.user.avatar}
                          alt={DATA.user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          CN
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {DATA.user.name}
                        </span>
                        <span className="truncate text-xs">
                          {DATA.user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Sparkles />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
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
                  <DropdownMenuItem>
                    <LogOut />
                    Log out
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/main/overview">
                    {activeTeam.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {isTablePage && (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              {isSearchExpanded || subscriberSearch ? (
                <div className="relative w-44 sm:w-64">
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={subscriberSearchRef}
                    type="search"
                    placeholder={searchPlaceholder}
                    value={subscriberSearch}
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
                  <Search />
                </Button>
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button type="button" variant="ghost" size="sm">
                  <Upload data-icon="inline-start" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <Download data-icon="inline-start" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary"
                  onClick={handleAddClick}
                >
                  <Plus data-icon="inline-start" />
                  <span className="hidden sm:inline">{addButtonLabel}</span>
                </Button>
              </div>
            </div>
          )}
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RadixSidebarDemo;
