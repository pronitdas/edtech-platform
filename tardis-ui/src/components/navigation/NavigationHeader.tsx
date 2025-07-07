import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Brain,
  BookOpen,
  Users,
  Target
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType;
  requiresTeacher?: boolean;
  requiresStudent?: boolean;
  requiresContentCreator?: boolean;
}

const NavigationHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isTeacher, isStudent, isContentCreator, logout } = useUser();

  const navigationItems: NavigationItem[] = [
    {
      path: '/app',
      label: 'Dashboard',
      icon: Home,
    },
    {
      path: '/practice',
      label: 'Practice',
      icon: Target,
      requiresStudent: true,
    },
    {
      path: '/teacher',
      label: 'Classroom',
      icon: GraduationCap,
      requiresTeacher: true,
    },
    {
      path: '/creator',
      label: 'Content Studio',
      icon: BookOpen,
      requiresContentCreator: true,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
    },
    {
      path: '/analytics/general',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  const filteredNavigation = navigationItems.filter(item => {
    if (item.requiresTeacher && !isTeacher()) return false;
    if (item.requiresStudent && !isStudent()) return false;
    if (item.requiresContentCreator && !isContentCreator()) return false;
    return true;
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || 
           (path !== '/app' && location.pathname.startsWith(path));
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Tardis</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">
                  {isTeacher() ? 'Teacher' : isStudent() ? 'Student' : 'User'}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-800 border-t border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              {/* User Info Mobile */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-700 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">
                    {isTeacher() ? 'Teacher' : isStudent() ? 'Student' : 'User'}
                  </p>
                </div>
              </div>

              {/* Navigation Items */}
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Settings and Logout */}
              <div className="pt-4 border-t border-gray-700 mt-4 space-y-2">
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavigationHeader;