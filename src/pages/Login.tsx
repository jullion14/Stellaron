import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label style={{
        display: 'block',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-text)',
        marginBottom: '0.375rem',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? '••••••••'}
          style={{
            width: '100%',
            background: 'var(--color-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text)',
            padding: '0.625rem 2.5rem 0.625rem 0.875rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/builder';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password.');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!username.trim()) {
        setError('Please enter a username.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }
    }

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        navigate(from, { replace: true });
      }
    } else {
      const { error } = await signUp(email, password, username.trim());
      if (error) {
        setError(error);
      } else {
        setMessage('Account created! Check your email to confirm before logging in.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '2rem',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-accent)',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}>
            Stellaron
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            {mode === 'login' ? 'Sign in to access the Builder' : 'Create an account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--color-panel)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '1.5rem',
        }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setMessage(null);
                setPassword('');
                setConfirmPassword('');
                setUsername('');
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: mode === m ? 'var(--color-surface)' : 'transparent',
                color: mode === m ? 'var(--color-accent)' : 'var(--color-muted)',
                transition: 'all 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              marginBottom: '0.375rem',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="you@example.com"
              style={{
                width: '100%',
                background: 'var(--color-panel)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text)',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
          {/* Username — only on signup */}
          {mode === 'signup' && (
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                marginBottom: '0.375rem',
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Choose a username"
                style={{
                  width: '100%',
                  background: 'var(--color-panel)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Password */}
          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {/* Confirm Password — only on signup */}
          {mode === 'signup' && (
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
            />
          )}
        </div>
          
        {/* Error / Message */}
        {error && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid var(--color-red)',
            borderRadius: '6px',
            padding: '0.75rem',
            color: 'var(--color-red)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: '#0a1a0a',
            border: '1px solid #34d399',
            borderRadius: '6px',
            padding: '0.75rem',
            color: '#34d399',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isLoading ? 'var(--color-border)' : 'var(--color-accent)',
            border: 'none',
            borderRadius: '8px',
            color: isLoading ? 'var(--color-text)' : '#000',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800,
            fontSize: '0.875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

      </div>
    </div>
  );
}