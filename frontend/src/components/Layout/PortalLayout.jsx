import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Home', href: '/portal', icon: HomeIcon },
  { name: 'History', href: '/portal/history', icon: ClockIcon },
  { name: 'Profile', href: '/portal/profile', icon: UserCircleIcon },
];

const PortalLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                <span className="text-2xl">&#9749;</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Coffee Roulette</h1>
                <p className="text-xs text-amber-600">Connect & Collaborate</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/portal'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Admin Dashboard"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span className="hidden md:inline">Admin</span>
                </NavLink>
              )}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full text-white font-medium text-sm">
                  {user?.firstName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.firstName || user?.displayName?.split(' ')[0] || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="sm:hidden border-t border-amber-100 px-4 py-2 flex justify-around">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/portal'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'text-amber-700'
                    : 'text-gray-500'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-white/50 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Coffee Roulette by Mercator IT Solutions
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
