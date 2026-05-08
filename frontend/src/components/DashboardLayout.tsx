import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { 
  Users, 
  Menu, 
  Moon, 
  Sun, 
  LogOut,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser: any;
  onLogout: () => void;
}

export function DashboardLayout({ 
  children, 
  currentUser, 
  onLogout
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Eventos', path: '/events', icon: CalendarDays },
    { name: 'Pacientes', path: '/patients', icon: Users },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Sidebar Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-background transition-transform lg:flex",
        sidebarOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <span className="text-sm font-semibold">Indicadores Healthmais</span>
          </a>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navigation.map((item) => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User info + Theme toggle */}
        <div className="border-t p-3 space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-3 w-full rounded-lg px-3 py-2">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-7 h-7 rounded-full shrink-0" />
              ) : (
                <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col sm:gap-4 sm:py-4 lg:pl-64 min-h-screen">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Button 
            variant="outline" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="flex-1 flex items-center">
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block">
              {navigation.find(n => 
                n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
              )?.name || 'Indicadores Healthmais'}
            </h1>
          </div>


        </header>

        {/* Main Content */}
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
