import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/characters', label: 'Characters' },
  { to: '/builder',    label: 'Builder' },
  { to: '/team',       label: 'Team' },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-8 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center shrink-0 text-center">
          <span
            style={{ color: 'var(--color-accent)', fontFamily: 'Rajdhani, sans-serif' }}
            className="text-xl font-bold tracking-widest uppercase"
          >
            Stellaron
          </span>
        </Link>

        {/* Divider */}
        <div style={{ background: 'var(--color-border)' }} className="w-px h-6" />

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                  background: active ? 'rgba(79,195,247,0.08)' : 'transparent',
                  borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                  fontFamily: 'Rajdhani, sans-serif',
                  padding: '0.25rem 1.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
