import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PenLine, Receipt, Wallet, Building, Settings, LogOut, MessageCircle, MoreHorizontal, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/daily', icon: PenLine, label: 'Daily Log' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/funding', icon: Wallet, label: 'Funding' },
  { to: '/rent', icon: Building, label: 'Rent' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const MOBILE_PRIMARY = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/daily', icon: PenLine, label: 'Daily' },
  { to: '/transactions', icon: Receipt, label: 'Txns' },
  { to: '/funding', icon: Wallet, label: 'Funding' },
];

const MOBILE_MORE = [
  { to: '/rent', icon: Building, label: 'Rent Tracker', desc: 'Track monthly payments', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { to: '/chat', icon: MessageCircle, label: 'Budget Chat', desc: 'AI spending insights', color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  { to: '/settings', icon: Settings, label: 'Settings', desc: 'Preferences & profile', color: 'bg-muted text-muted-foreground' },
];

export function AppLayout() {
  const { session, signOut } = useAuth();
  const { data: settings } = useSettings();
  const location = useLocation();
  const userEmail = session?.user?.email || '';
  const displayName = (settings as any)?.display_name || userEmail.split('@')[0];
  const [moreOpen, setMoreOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.rpc('is_admin', { _user_id: session.user.id }).then(({ data }) => {
      setIsAdminUser(!!data);
    });
  }, [session?.user?.id]);

  const navItems = isAdminUser ? [...NAV_ITEMS, { to: '/admin', icon: Shield, label: 'Admin' }] : NAV_ITEMS;
  const mobileMore = isAdminUser ? [...MOBILE_MORE, { to: '/admin', icon: Shield, label: 'Admin', desc: 'Admin console', color: 'bg-red-500/15 text-red-600 dark:text-red-400' }] : MOBILE_MORE;

  const isMoreActive = mobileMore.some(item => location.pathname.startsWith(item.to));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 gradient-sidebar text-sidebar-foreground">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Travel Intern</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Budget Tracker</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-black/20'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-sidebar-foreground border border-sidebar-foreground/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{userEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-evenly items-center h-16">
          {MOBILE_PRIMARY.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-3 transition-all duration-200',
                  isActive ? 'text-secondary scale-110' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 text-xs font-medium py-1 px-3 transition-all duration-200',
              isMoreActive ? 'text-secondary scale-110' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          {/* User profile header with gradient */}
          <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-primary/8 via-accent/10 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-12 w-12 border-2 border-primary/25 shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Nav items — horizontal grid */}
          <div className="px-4 py-4 grid grid-cols-3 gap-3">
            {mobileMore.map(item => (
              <DrawerClose asChild key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-2 px-2 py-4 rounded-2xl text-sm font-medium transition-all border',
                      isActive
                        ? 'bg-primary/10 border-primary/20 text-primary shadow-sm'
                        : 'bg-card border-border/60 hover:border-primary/20 hover:shadow-sm'
                    )
                  }
                >
                  <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
                </NavLink>
              </DrawerClose>
            ))}
          </div>

          <Separator className="mx-4 w-auto" />

          {/* Sign out */}
          <div className="px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <DrawerClose asChild>
              <button
                onClick={signOut}
                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/8 transition-all w-full group border border-transparent hover:border-destructive/15"
              >
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Sign Out</span>
              </button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
