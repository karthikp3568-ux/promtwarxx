import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Shield, Menu, X, History, Lock, Settings as SettingsIcon, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import VerifyEmailBanner from '../auth/VerifyEmailBanner';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/history', label: 'History', icon: History },
  { to: '/privacy', label: 'Privacy', icon: Lock },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isGuest } = useAuth();

  return (
    <div className="min-h-dvh text-white flex flex-col">
      <nav className="bg-navy-800/80 backdrop-blur-md border-b border-navy-600 sticky top-0 z-50">
        <div className="w-[min(100%-2rem,1280px)] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-white font-semibold min-h-[44px] min-w-[44px]">
            <Shield className="w-6 h-6 text-primary shrink-0" />
            <span className="text-lg font-bold">TrustGuard AI</span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center ${
                    isActive
                      ? 'bg-navy-700 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-navy-700/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="ml-3 pl-3 border-l border-navy-700 flex items-center gap-2">
              {user ? (
                <Link
                  to="/settings"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-navy-700 hover:bg-navy-600 text-gray-200 transition-colors min-h-[40px]"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>{isGuest ? 'Guest' : (user.email?.split('@')[0] || 'Account')}</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors min-h-[40px] flex items-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-gray-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-navy-600 py-3 px-4 space-y-2 bg-navy-800">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${
                    isActive ? 'bg-navy-700 text-white' : 'text-gray-300 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-navy-700">
              {user ? (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white min-h-[44px] flex items-center"
                >
                  Account: {isGuest ? 'Guest' : (user.email || 'Signed in')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-center rounded-lg text-sm font-semibold bg-primary text-white min-h-[44px] flex items-center justify-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="page-container flex-1">
        <VerifyEmailBanner />
        <Outlet />
      </main>
    </div>
  );
}
