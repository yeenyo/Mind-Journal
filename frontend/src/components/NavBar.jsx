import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { buttonClasses } from '../lib/buttonStyles';
import { CloseIcon, MenuIcon } from './Icons';

const APP_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/insights', label: 'Patterns' },
  { to: '/breakdown', label: 'Break it down' },
  { to: '/settings', label: 'Settings' },
];

// Signed-out visitors get the informational pages instead of the app. Kept to
// four so the bar doesn't wrap on a small laptop.
const PUBLIC_LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing-faq', label: 'Pricing' },
  { to: '/resources', label: 'Resources' },
  { to: '/faq', label: 'FAQ' },
];

function linkClasses({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

export default function NavBar() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  const links = user ? APP_LINKS : PUBLIC_LINKS;

  // Any navigation should dismiss the mobile menu.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Tapping anywhere outside the bar closes the menu, as does Escape. Without
  // this the only way out is the button you just came from, which on a phone
  // means aiming at a 40px target to undo an accidental tap.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function onPointerDown(event) {
      if (navRef.current && !navRef.current.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <nav ref={navRef} className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to={user ? '/dashboard' : '/'}
          className="icon-tilt-parent flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
        >
          <span className="icon-tilt flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </span>
          MindJournal
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <Button variant="secondary" size="sm" onClick={signOut} className="ml-2">
              Log out
            </Button>
          ) : (
            <>
              <Link
                to="/auth/login"
                className={`ml-2 ${buttonClasses({ variant: 'ghost', size: 'sm' })}`}
              >
                Log in
              </Link>
              <Link to="/auth/signup" className={buttonClasses({ size: 'sm' })}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Link to="/auth/signup" className={buttonClasses({ size: 'sm' })}>
              Sign up
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="press rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="fade-in border-t border-gray-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link, i) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClasses}
                style={{ '--stagger-index': i }}
              >
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <Button variant="secondary" size="sm" onClick={signOut} className="mt-2">
                Log out
              </Button>
            ) : (
              <Link
                to="/auth/login"
                className={`mt-2 ${buttonClasses({ variant: 'secondary', size: 'sm', fullWidth: true })}`}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
