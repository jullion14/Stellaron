import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/characters',  label: 'Characters' },
  { to: '/light-cones', label: 'Light Cones' },
  { to: '/relics',      label: 'Relics' },
  { to: '/builder',     label: 'Builder' },
  { to: '/team',        label: 'Team' },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get display_name from user metadata, fallback to email prefix
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '';

  return (
    <nav
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
      className="sticky top-0 z-50"
    >
      <div
        className="max-w-7xl mx-auto px-6 h-14"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}
      >
        {/* Left — spacer */}
        <div />

        {/* Center — Logo + Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}>
          {/* Logo */}
          <Link to="/">
            <span
              style={{
                color: 'var(--color-accent)',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Stellaron
            </span>
          </Link>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            background: 'var(--color-border)',
            flexShrink: 0,
          }} />

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {NAV_LINKS.map(({ to, label }) => {
              const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                    background: active ? 'rgba(79,195,247,0.08)' : 'transparent',
                    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                    fontFamily: 'Rajdhani, sans-serif',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    transition: 'color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right — Auth */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'flex-end',
        }}>
          {user ? (
            <>
              <Link
                to="/profile"
                style={{
                  color: 'var(--color-accent)',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                }}
              >
                {displayName}
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-muted)',
                  padding: '0.25rem 0.75rem',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-red)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-red)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                padding: '0.25rem 0.75rem',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}