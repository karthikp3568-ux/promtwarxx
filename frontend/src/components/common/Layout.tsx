import { useState, Suspense } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, History, Lock, Settings as SettingsIcon, User, Terminal, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import VerifyEmailBanner from '../auth/VerifyEmailBanner';
import RouteErrorBoundary from './RouteErrorBoundary';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/playground', label: 'Adversarial Lab', icon: Terminal },
  { to: '/history', label: 'History', icon: History },
  { to: '/privacy', label: 'Privacy', icon: Lock },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isGuest } = useAuth();

  return (
    <div className="min-h-dvh text-white flex flex-col relative w-full max-w-[100vw] overflow-x-clip">
      {/* Cinematic Cybersecurity Command Center Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Background Command Center Image with Subtle Opacity and Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity max-md:mix-blend-normal scale-105"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}cyber_command_bg.jpg')` }}
        />
        {/* Dark Radial Center Mask ensuring center content remains uncluttered and readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,9,18,0.7)_0%,rgba(3,9,18,0.92)_65%,rgba(3,9,18,0.98)_100%)]" />
        {/* Cyber Green Scanlines Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,160,0.015)_1px,transparent_1px)] bg-[size:100%_4px] opacity-60" />
      </div>

      {/* Animated Vivid Mesh Background Blobs */}
      <div className="bg-blob-container" aria-hidden="true">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      {/* Sticky Frosted Glass Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-strong border-b border-white/10 backdrop-blur-md">
        <div className="w-[min(100%-2rem,1280px)] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 text-white font-semibold min-h-[44px] min-w-[44px] group">
            <div className="icon-tile icon-tile-gradient w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5 text-white shrink-0" />
            </div>
            <span className="text-lg font-bold tracking-tight">TrustGuard <span className="text-gradient-primary">AI</span></span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] flex items-center ${
                    isActive
                      ? 'glass-pill bg-white/15 text-white border-white/30 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="ml-3 pl-3 border-l border-white/15 flex items-center gap-2">
              {user ? (
                <Link
                  to="/settings"
                  className="btn-glass text-sm px-3.5 py-1.5 min-h-[40px] text-gray-200"
                >
                  <User className="w-4 h-4 text-cyan" />
                  <span>{isGuest ? 'Guest' : (user.email?.split('@')[0] || 'Account')}</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary text-sm px-4 py-1.5 min-h-[40px]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-gray-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl glass-pill"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/15 py-3 px-4 space-y-2 glass-strong">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3.5 py-2.5 rounded-xl text-sm font-medium min-h-[44px] flex items-center ${
                    isActive ? 'bg-white/20 text-white font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-white/15">
              {user ? (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-sm text-gray-200 hover:text-white min-h-[44px] flex items-center gap-2 overflow-hidden"
                >
                  <User className="w-4 h-4 text-cyan shrink-0" />
                  <span className="truncate">
                    {isGuest ? 'Guest Session' : (user.email || 'Signed in')}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center text-sm min-h-[44px] flex items-center justify-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Page Area */}
      <main className="page-container flex-1 relative z-10 w-full max-w-[100vw] overflow-x-clip">
        <VerifyEmailBanner />
        <RouteErrorBoundary key={pathname}>
          <Suspense
            fallback={
              <div role="status" aria-live="polite" className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" />
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
