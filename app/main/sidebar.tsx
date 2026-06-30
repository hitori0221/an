"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { logout } from "@/app/login/actions";
import { useReducedAnimation } from "@/app/motion-provider";
import type { ServiceRequestCategory } from "@/lib/subscription-plans";
import type { Branch } from "@/app/main/branches/_components/data-table/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSearchProvider } from "@/components/data-table/shared/table-search-context";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
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
} from "@/components/animate-ui/components/radix/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/animate-ui/primitives/radix/collapsible";
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
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  ArrowRightFromSquare as LogOut,
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
  MapPin,
  Tag,
} from "@gravity-ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function ReducedAnimationButton() {
  const { reduceAnimation, toggleReduceAnimation } = useReducedAnimation();

  return (
    <button
      type="button"
      aria-pressed={reduceAnimation}
      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
      onClick={toggleReduceAnimation}
    >
      <span>Reduce animation</span>
      <span className="text-xs text-muted-foreground">
        {reduceAnimation ? "On" : "Off"}
      </span>
    </button>
  );
}

const DATA = {
  workspaces: [
    {
      name: "AN System",
      logo: Waypoints,
      plan: "Operations",
    },
    {
      name: "AN System",
      logo: CoinsIcon,
      plan: "Billing Management",
    },
    {
      name: "AN System",
      logo: ShieldCogCorner,
      plan: "Administrator",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/main/overview",
      resource: "overview",
      icon: PieChartIcon,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/main/overview",
          resource: "dashboard",
        },
        {
          title: "Manager View",
          url: "/main/overview/manager-view",
          resource: "manager_view",
        },
      ],
    },
    {
      title: "Subscribers",
      url: "/main/subscribers",
      resource: "subscribers",
      icon: User,
    },
    {
      title: "Installations",
      url: "/main/installations",
      resource: "installations",
      icon: Settings2,
    },
    {
      title: "Job Order",
      url: "/main/job-orders",
      resource: "job_orders",
      icon: Bot,
    },
  ],
  billingNavMain: [
    {
      title: "Payments",
      url: "/main/payments",
      resource: "payments",
      icon: CreditCard,
    },
    {
      title: "Expirations",
      url: "/main/expirations",
      resource: "expirations",
      icon: Bell,
    },
    {
      title: "Collections",
      url: "/main/collections",
      resource: "collections",
      icon: BadgeCheck,
    },
  ],
  adminNavMain: [
    {
      title: "Subscription Plans",
      url: "/main/subscription-plans",
      resource: "subscription_plans",
      icon: Tag,
    },
    {
      title: "Manage Modem",
      url: "/main/modems",
      resource: "modems",
      icon: Settings2,
    },
    {
      title: "Manage Branch",
      url: "/main/branches",
      resource: "branches",
      icon: GearBranches,
    },
    {
      title: "System Users",
      url: "/main/users",
      resource: "system_users",
      icon: User,
    },
  ],
};

interface RadixSidebarDemoProps {
  children?: React.ReactNode;
  serviceRequestCategories: ServiceRequestCategory[];
  branches: Branch[];
  permissions: string[];
  branchScope: string | null;
  branchScopeName: string | null;
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
  resource: string;
  icon: React.ElementType;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    resource: string;
  }[];
};

const SUBSCRIBER_STATUS_FILTERS = ["Active", "Inactive", "Pending"];
const SUBSCRIBER_PLAN_FILTERS = [
  "Basic 50 Mbps",
  "Fiber 100 Mbps",
  "Fiber 200 Mbps",
  "Fiber 300 Mbps",
];
const SUBSCRIPTION_PLAN_STATUS_FILTERS = ["Active", "Draft", "Archived"];
export const RadixSidebarDemo = ({
  children,
  serviceRequestCategories,
  branches,
  permissions,
  branchScope,
  branchScopeName,
  user,
}: RadixSidebarDemoProps) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canView = React.useCallback(
    (resource: string) =>
      permissions.includes("*") || permissions.includes(`${resource}.view`),
    [permissions],
  );
  const filterNav = React.useCallback(
    (items: NavItem[]) =>
      items.flatMap((item) => {
        const visibleSubItems = item.items?.filter((subItem) =>
          canView(subItem.resource),
        );

        if (item.items) {
          if (!visibleSubItems?.length) return [];
          return [
            { ...item, url: visibleSubItems[0].url, items: visibleSubItems },
          ];
        }

        return canView(item.resource) ? [item] : [];
      }),
    [canView],
  );
  const operationsNav = React.useMemo(
    () => filterNav(DATA.navMain),
    [filterNav],
  );
  const billingNav = React.useMemo(
    () => filterNav(DATA.billingNavMain),
    [filterNav],
  );
  const adminNav = React.useMemo(
    () => filterNav(DATA.adminNavMain),
    [filterNav],
  );
  const availableWorkspaces = React.useMemo(
    () =>
      DATA.workspaces.filter((workspace) => {
        if (workspace.plan === "Operations")
          return operationsNav.length > 0 || canView("service_requests");
        if (workspace.plan === "Billing Management")
          return billingNav.length > 0;
        return adminNav.length > 0;
      }),
    [adminNav.length, billingNav.length, canView, operationsNav.length],
  );
  const getWorkspaceForPath = React.useCallback(
    (path: string) => {
      const requested = DATA.billingNavMain.some((item) => path === item.url)
        ? DATA.workspaces[1]
        : DATA.adminNavMain.some((item) => path === item.url)
          ? DATA.workspaces[2]
          : DATA.workspaces[0];
      return (
        availableWorkspaces.find(
          (workspace) => workspace.plan === requested.plan,
        ) ??
        availableWorkspaces[0] ??
        null
      );
    },
    [availableWorkspaces],
  );
  const [activeWorkspace, setActiveWorkspace] = React.useState(() =>
    getWorkspaceForPath(pathname),
  );
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const subscriberSearchRef = React.useRef<HTMLInputElement>(null);
  const activeNavMain: NavItem[] =
    activeWorkspace?.plan === "Billing Management"
      ? billingNav
      : activeWorkspace?.plan === "Administrator"
        ? adminNav
        : activeWorkspace?.plan === "Operations"
          ? operationsNav
          : [];
  const activeProjects =
    activeWorkspace?.plan === "Operations" && canView("service_requests")
      ? serviceRequestCategories
      : [];
  const isSubscriberDetailsPage = pathname.startsWith("/main/subscribers/");
  const subscriberAccountNumber = isSubscriberDetailsPage
    ? decodeURIComponent(pathname.split("/").at(-1) ?? "")
    : "";
  const activeNavItem = activeNavMain.find(
    (item) =>
      pathname === item.url ||
      (item.url === "/main/subscribers" && isSubscriberDetailsPage),
  );
  const isServiceRequestPage = pathname === "/main/service-request";
  const isDashboardPage = pathname === "/main/overview";
  const isOverviewPage = pathname.startsWith("/main/overview");
  const serviceRequestCategoryFilter = searchParams.get("category") ?? "all";
  const breadcrumbPage = isServiceRequestPage
    ? serviceRequestCategoryFilter === "all"
      ? "Service Request"
      : serviceRequestCategoryFilter
    : pathname === "/main/overview/manager-view"
      ? "Manager View"
      : (activeNavItem?.title ?? "Overview");
  const isSubscribersPage = pathname === "/main/subscribers";
  const isInstallationsPage = pathname === "/main/installations";
  const isJobOrdersPage = pathname === "/main/job-orders";
  const isBranchesPage = pathname === "/main/branches";
  const isModemsPage = pathname === "/main/modems";
  const isSubscriptionPlansPage = pathname === "/main/subscription-plans";
  const isUsersPage = pathname === "/main/users";
  const isPaymentsPage = pathname === "/main/payments";
  const branchFilter = branchScope ?? searchParams.get("branch") ?? "all";
  const isExpirationsPage = pathname === "/main/expirations";
  const isCollectionsPage = pathname === "/main/collections";
  const isBillingTablePage =
    isPaymentsPage || isExpirationsPage || isCollectionsPage;
  const isTablePage =
    isSubscribersPage ||
    isInstallationsPage ||
    isJobOrdersPage ||
    isBranchesPage ||
    isModemsPage ||
    isSubscriptionPlansPage ||
    isUsersPage ||
    isBillingTablePage;
  const canAddFromHeader = !isCollectionsPage && !isExpirationsPage;
  const searchQuery = searchParams.get("q") ?? "";
  const [tableSearch, setTableSearch] = React.useState(searchQuery);
  const subscriberStatusFilter = searchParams.get("status") ?? "all";
  const subscriberPlanFilter = searchParams.get("plan") ?? "all";
  const activeSubscriberFilters = [
    subscriberStatusFilter !== "all",
    subscriberPlanFilter !== "all",
  ].filter(Boolean).length;
  const subscriptionPlanStatusFilter = searchParams.get("status") ?? "all";
  const subscriptionPlanCategoryFilter = searchParams.get("category") ?? "all";
  const activeSubscriptionPlanFilters = [
    subscriptionPlanStatusFilter !== "all",
    subscriptionPlanCategoryFilter !== "all",
  ].filter(Boolean).length;
  const searchPlaceholder = isJobOrdersPage
    ? "Search job orders"
    : isInstallationsPage
      ? "Search installations"
      : isPaymentsPage
        ? "Search payments"
        : isExpirationsPage
          ? "Search expirations"
          : isCollectionsPage
            ? "Search collections"
            : isBranchesPage
              ? "Search branches"
              : isUsersPage
                ? "Search system users"
                : isModemsPage
                  ? "Search modems"
                  : isSubscriptionPlansPage
                    ? "Search plans"
                    : "Search subscribers";
  const addButtonLabel = isJobOrdersPage
    ? "Add Job Order"
    : isInstallationsPage
      ? "Add Installation"
      : isPaymentsPage
        ? "Add Payment"
        : isBranchesPage
          ? "Add Branch"
          : isUsersPage
            ? "Create User"
            : isModemsPage
              ? "Add Modem"
              : isSubscriptionPlansPage
                ? "Add Plan"
                : "Add Subscriber";
  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleWorkspaceSelect = React.useCallback(
    (workspace: (typeof DATA.workspaces)[number]) => {
      setActiveWorkspace(workspace);

      const nextRoute =
        workspace.plan === "Billing Management"
          ? billingNav[0]?.url
          : workspace.plan === "Administrator"
            ? adminNav[0]?.url
            : (operationsNav[0]?.url ??
              (canView("service_requests")
                ? "/main/service-request"
                : undefined));

      if (!nextRoute || pathname === nextRoute) return;

      router.replace(nextRoute, {
        scroll: false,
      });
    },
    [adminNav, billingNav, canView, operationsNav, pathname, router],
  );

  const updateSubscriberSearch = React.useCallback((value: string) => {
    setTableSearch(value);
  }, []);

  const handleAddClick = React.useCallback(() => {
    if (
      !canAddFromHeader ||
      (!isSubscribersPage &&
        !isInstallationsPage &&
        !isJobOrdersPage &&
        !isBranchesPage &&
        !isModemsPage &&
        !isSubscriptionPlansPage &&
        !isUsersPage &&
        !isPaymentsPage)
    )
      return;

    const params = new URLSearchParams(searchParams.toString());

    params.set("create", "1");
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [
    canAddFromHeader,
    isBranchesPage,
    isInstallationsPage,
    isJobOrdersPage,
    isModemsPage,
    isPaymentsPage,
    isSubscribersPage,
    isSubscriptionPlansPage,
    isUsersPage,
    pathname,
    router,
    searchParams,
  ]);

  const handlePermissionsClick = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("permissions", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleCategoryClick = React.useCallback(() => {
    if (!isSubscriptionPlansPage) return;

    const params = new URLSearchParams(searchParams.toString());

    params.set("categoryDrawer", "create");
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [isSubscriptionPlansPage, pathname, router, searchParams]);

  const updateSubscriberFilter = React.useCallback(
    (key: "status" | "plan", value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "all") {
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

  const updateBranchFilter = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "all") params.delete("branch");
      else params.set("branch", value);

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clearSubscriberFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("status");
    params.delete("plan");

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const updateSubscriptionPlanFilter = React.useCallback(
    (key: "status" | "category", value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "all") {
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

    params.delete("status");
    params.delete("category");

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

      if (
        event.key !== "/" ||
        isEditableTarget ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      expandSearch();
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [expandSearch, isTablePage]);

  React.useEffect(() => {
    setIsSearchExpanded(false);
  }, [pathname]);

  React.useEffect(() => {
    setTableSearch(searchQuery);
  }, [pathname, searchQuery]);

  React.useEffect(() => {
    if (
      !branchScope ||
      !isBillingTablePage ||
      searchParams.get("branch") === branchScope
    )
      return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("branch", branchScope);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [branchScope, isBillingTablePage, pathname, router, searchParams]);

  React.useEffect(() => {
    const workspaceForPath = getWorkspaceForPath(pathname);

    setActiveWorkspace((currentWorkspace) =>
      currentWorkspace?.plan === workspaceForPath?.plan
        ? currentWorkspace
        : workspaceForPath,
    );
  }, [getWorkspaceForPath, pathname]);

  if (!activeWorkspace) return null;

  return (
    <TableSearchProvider
      value={{ search: tableSearch, setSearch: setTableSearch }}
    >
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            {/* Workspace Switcher */}
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu
                  open={availableWorkspaces.length > 1 && workspaceMenuOpen}
                  onOpenChange={(open) =>
                    setWorkspaceMenuOpen(availableWorkspaces.length > 1 && open)
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className={`group/workspace-trigger data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${
                        availableWorkspaces.length <= 1
                          ? "pointer-events-none cursor-default"
                          : ""
                      }`}
                      tabIndex={availableWorkspaces.length <= 1 ? -1 : 0}
                      onClick={(event) => {
                        if (availableWorkspaces.length <= 1)
                          event.preventDefault();
                      }}
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
                        <p className="text-xs">{activeWorkspace.plan}</p>
                      </div>
                      {availableWorkspaces.length > 1 && (
                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/workspace-trigger:rotate-180" />
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    align="start"
                    side={isMobile ? "bottom" : "right"}
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Workspaces
                    </DropdownMenuLabel>
                    {availableWorkspaces.map((workspace, index) => (
                      <DropdownMenuItem
                        key={`${workspace.name}-${workspace.plan}`}
                        onClick={() => handleWorkspaceSelect(workspace)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                          <workspace.logo className="size-4 shrink-0" />
                        </div>
                        {workspace.plan}
                        <DropdownMenuShortcut>
                          ⌘{index + 1}
                        </DropdownMenuShortcut>
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
                    const isActive =
                      pathname === item.url ||
                      item.items?.some((subItem) => pathname === subItem.url) ||
                      (item.items?.some(
                        (subItem) => subItem.url === "/main/overview",
                      ) &&
                        pathname.startsWith("/main/overview"));
                    return item.items && item.items.length > 0 ? (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={item.isActive || isActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={isActive}
                            >
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
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={isActive}
                        >
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
                    const isActive =
                      pathname === "/main/service-request" &&
                      serviceRequestCategoryFilter === item.name;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link
                            href={`/main/service-request?category=${encodeURIComponent(item.name)}`}
                          >
                            {item.iconDataUrl ? (
                              <span
                                className="relative size-4 shrink-0 overflow-hidden rounded-full"
                                aria-hidden="true"
                              >
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
                        <SidebarMenuBadge className="top-1.5">
                          {item.pendingCount}
                        </SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  })}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="pr-2 text-sidebar-foreground/70"
                    >
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
                        <AvatarFallback className="rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.name}
                        </span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                      <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/user-trigger:rotate-180" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
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
                          <span className="truncate text-xs">{user.email}</span>
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
                      className="p-0"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <ThemeTogglerButton
                        variant="ghost"
                        size="xs"
                        direction="ltr"
                        modes={["light", "dark", "system"]}
                        className="h-auto! w-full! justify-between! rounded-sm px-2 py-1.5 text-sm font-normal"
                      >
                        <span>Theme</span>
                      </ThemeTogglerButton>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="p-0"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <ReducedAnimationButton />
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
          {isDashboardPage && (
            <header className="flex h-12 shrink-0 items-center gap-2 px-3 md:hidden">
              <SidebarTrigger className="-ml-1" />
              <span className="text-sm font-semibold text-foreground">
                Dashboard
              </span>
            </header>
          )}
          {!isDashboardPage && (
            <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 h-4 my-auto"
                />
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
                        onChange={(event) =>
                          updateSubscriberSearch(event.target.value)
                        }
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
                  {isUsersPage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePermissionsClick}
                    >
                      <ShieldCogCorner data-icon="inline-start" />
                      <span className="hidden sm:inline">Permissions</span>
                    </Button>
                  )}
                  {isSubscriptionPlansPage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCategoryClick}
                    >
                      <Settings2 data-icon="inline-start" />
                      <span className="hidden sm:inline">Category</span>
                    </Button>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isBillingTablePage && branchScope && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="pointer-events-none cursor-default"
                      >
                        <MapPin data-icon="inline-start" />
                        <span className="hidden max-w-32 truncate sm:inline">
                          {branchScopeName ??
                            branches.find((branch) => branch.id === branchScope)
                              ?.name ??
                            "Assigned branch"}
                        </span>
                      </Button>
                    )}
                    {isBillingTablePage && !branchScope && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={
                              branchFilter !== "all"
                                ? "bg-secondary hover:bg-secondary/80"
                                : undefined
                            }
                          >
                            <MapPin data-icon="inline-start" />
                            <span className="hidden max-w-32 truncate sm:inline">
                              {branchFilter === "all"
                                ? "All branches"
                                : (branches.find(
                                    (branch) => branch.id === branchFilter,
                                  )?.name ?? "Branch")}
                            </span>
                            <ChevronDown data-icon="inline-end" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Filter by branch
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={branchFilter}
                            onValueChange={updateBranchFilter}
                          >
                            <DropdownMenuRadioItem value="all">
                              All branches
                            </DropdownMenuRadioItem>
                            {branches
                              .filter((branch) => branch.status === "Active")
                              .map((branch) => (
                                <DropdownMenuRadioItem
                                  key={branch.id}
                                  value={branch.id}
                                >
                                  <span className="truncate">
                                    {branch.name}
                                  </span>
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {branch.code}
                                  </span>
                                </DropdownMenuRadioItem>
                              ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {isSubscribersPage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={
                              activeSubscriberFilters > 0
                                ? "bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary"
                                : undefined
                            }
                          >
                            <Funnel data-icon="inline-start" />
                            <span className="hidden sm:inline">
                              Filters
                              {activeSubscriberFilters > 0
                                ? ` (${activeSubscriberFilters})`
                                : ""}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Status
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={subscriberStatusFilter}
                            onValueChange={(value) =>
                              updateSubscriberFilter("status", value)
                            }
                          >
                            <DropdownMenuRadioItem value="all">
                              All statuses
                            </DropdownMenuRadioItem>
                            {SUBSCRIBER_STATUS_FILTERS.map((status) => (
                              <DropdownMenuRadioItem
                                key={status}
                                value={status}
                              >
                                {status}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Plan
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={subscriberPlanFilter}
                            onValueChange={(value) =>
                              updateSubscriberFilter("plan", value)
                            }
                          >
                            <DropdownMenuRadioItem value="all">
                              All plans
                            </DropdownMenuRadioItem>
                            {SUBSCRIBER_PLAN_FILTERS.map((plan) => (
                              <DropdownMenuRadioItem key={plan} value={plan}>
                                {plan}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          {activeSubscriberFilters > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={clearSubscriberFilters}
                              >
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
                            className={
                              activeSubscriptionPlanFilters > 0
                                ? "bg-secondary hover:bg-secondary/80 dark:bg-secondary/80 dark:hover:bg-secondary"
                                : undefined
                            }
                          >
                            <Funnel
                              className="text-blue-600"
                              data-icon="inline-start"
                            />
                            <span className="hidden sm:inline">
                              Filters
                              {activeSubscriptionPlanFilters > 0
                                ? ` (${activeSubscriptionPlanFilters})`
                                : ""}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Status
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={subscriptionPlanStatusFilter}
                            onValueChange={(value) =>
                              updateSubscriptionPlanFilter("status", value)
                            }
                          >
                            <DropdownMenuRadioItem value="all">
                              All statuses
                            </DropdownMenuRadioItem>
                            {SUBSCRIPTION_PLAN_STATUS_FILTERS.map((status) => (
                              <DropdownMenuRadioItem
                                key={status}
                                value={status}
                              >
                                {status}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Category
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={subscriptionPlanCategoryFilter}
                            onValueChange={(value) =>
                              updateSubscriptionPlanFilter("category", value)
                            }
                          >
                            <DropdownMenuRadioItem value="all">
                              All categories
                            </DropdownMenuRadioItem>
                            {serviceRequestCategories.map((category) => (
                              <DropdownMenuRadioItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          {activeSubscriptionPlanFilters > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={clearSubscriptionPlanFilters}
                              >
                                Clear filters
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {canAddFromHeader && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:text-white"
                        onClick={handleAddClick}
                      >
                        <Plus data-icon="inline-start" />
                        <span className="hidden font-semibold sm:inline">
                          {addButtonLabel}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </header>
          )}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden",
              isOverviewPage ? "min-h-0 overflow-hidden p-0" : "p-4 pt-0",
            )}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TableSearchProvider>
  );
};

export default RadixSidebarDemo;
