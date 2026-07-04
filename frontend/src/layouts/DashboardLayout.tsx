import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../store/uiStore';
import { 
  BarChart3, 
  Search, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  UserCheck 
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, theme, toggleTheme, toggleSidebar } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'risk_analyst', 'auditor'] },
    { path: '/evaluate', label: 'Score Workbench', icon: ShieldCheck, roles: ['admin', 'risk_analyst'] },
    { path: '/applicants', label: 'Applicants', icon: Search, roles: ['admin', 'risk_analyst', 'auditor'] },
    { path: '/model-health', label: 'Model Performance', icon: FileText, roles: ['admin', 'risk_analyst', 'auditor'] },
    { path: '/admin', label: 'Admin Console', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-bgPrimary text-textPrimary transition-colors duration-300">
      {/* Sidebar Section */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-borderColor bg-bgSecondary transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div>
          {/* Logo Brand area */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-borderColor">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-display font-extrabold text-xl">
                C
              </div>
              {sidebarOpen && (
                <span className="font-display font-bold text-lg tracking-wide text-textPrimary">
                  CrediShield <span className="text-borderActive">AI</span>
                </span>
              )}
            </Link>
            {sidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="rounded-lg p-1.5 hover:bg-bgTertiary text-textSecondary hover:text-textPrimary lg:hidden"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 p-3">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-sans font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-borderActive text-white shadow-lg shadow-blue-500/10'
                      : 'text-textSecondary hover:bg-bgTertiary hover:text-textPrimary'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Profile and System Buttons */}
        <div className="p-3 border-t border-borderColor flex flex-col gap-2">
          {/* Theme toggle & Sidebar collapse toggle */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center rounded-lg p-2 bg-bgTertiary text-textSecondary hover:text-textPrimary transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={toggleSidebar}
              className="flex-1 flex items-center justify-center rounded-lg p-2 bg-bgTertiary text-textSecondary hover:text-textPrimary transition-all hidden lg:flex"
              title="Collapse Menu"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* User profile tag */}
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-bgTertiary/50 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-borderActive/20 text-borderActive">
                <UserCheck size={16} />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs text-textMuted uppercase font-bold tracking-wider">
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-textSecondary font-sans truncate max-w-[140px]">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Logout Trigger */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-sans font-medium text-danger hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout Session</span>}
          </button>
        </div>
      </aside>

      {/* Main View Workspace */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* Header section */}
        <header className="flex h-16 items-center justify-between border-b border-borderColor bg-bgSecondary px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 hover:bg-bgTertiary text-textSecondary hover:text-textPrimary lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-display font-semibold text-lg text-textPrimary capitalize">
              {location.pathname === '/' ? 'Risk Intelligence' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-sans text-textMuted">
              Last login: {new Date().toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* View Layout Router Target */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
