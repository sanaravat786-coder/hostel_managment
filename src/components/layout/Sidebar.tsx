import {
  Bell,
  BedDouble,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Users,
  Users2,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
}

const adminNavItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/fees', icon: CreditCard, label: 'Fees' },
  { to: '/visitors', icon: Users2, label: 'Visitors' },
  { to: '/complaints', icon: MessageSquareWarning, label: 'Complaints' },
  { to: '/notices', icon: Bell, label: 'Notices' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

const studentNavItems = [
    { to: '/notices', icon: Bell, label: 'Notices' },
    { to: '/complaints', icon: MessageSquareWarning, label: 'My Complaints' },
    { to: '/fees', icon: CreditCard, label: 'My Fees' },
];

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const { isAdmin } = useAuth();
  const navItems = isAdmin ? adminNavItems : studentNavItems;
  const defaultPath = isAdmin ? '/admin/dashboard' : '/notices';

  return (
    <div
      className={cn(
        'hidden border-r bg-background md:block',
        isCollapsed && 'md:grid-cols-[80px_1fr] lg:grid-cols-[80px_1fr]'
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to={defaultPath} className="flex items-center gap-2 font-semibold">
            <Building2 className="h-6 w-6" />
            <span className={cn(isCollapsed && 'hidden')}>HMS</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav
            className={cn(
              'grid items-start px-2 text-sm font-medium lg:px-4',
              isCollapsed && 'justify-center'
            )}
          >
            <TooltipProvider>
              {navItems.map((item) => (
                <Tooltip key={item.label} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                          isActive && 'bg-muted text-primary',
                          isCollapsed && 'justify-center'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className={cn(isCollapsed && 'hidden')}>
                        {item.label}
                      </span>
                    </NavLink>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
        </div>
      </div>
    </div>
  );
}
