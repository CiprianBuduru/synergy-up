import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Building2, FileText, LogOut, Package, ShoppingBag, Brain, UserSearch } from 'lucide-react';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import DataLoadingScreen from '@/components/DataLoadingScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isLoading } = useData();
  const location = useLocation();

  if (isLoading) return <DataLoadingScreen />;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/new', icon: FileText, label: 'Nouă' },
    { to: '/products', icon: ShoppingBag, label: 'Produse' },
    { to: '/kits', icon: Package, label: 'Kit Generator' },
    { to: '/knowledge', icon: Brain, label: 'Knowledge' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <span className="text-xs font-bold text-accent-foreground">LM</span>
              </div>
              <span className="font-display text-sm font-semibold text-foreground">Like Media Group</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(item => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />
            <span className="text-xs text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
