import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { user, updateDisplayName } = useAuth();

  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [displayNameMsg, setDisplayNameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [loadingDisplayName, setLoadingDisplayName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateDisplayName = async () => {
    setDisplayNameMsg(null);
    setLoadingDisplayName(true);

    if (!displayName.trim()) {
      setDisplayNameMsg({ text: 'Display name cannot be empty.', ok: false });
      setLoadingDisplayName(false);
      return;
    }

    const { error } = await updateDisplayName(displayName.trim());

    if (error) {
      setDisplayNameMsg({ text: error, ok: false });
    } else {
      setDisplayNameMsg({ text: 'Display name updated successfully.', ok: true });
    }

    setLoadingDisplayName(false);
  };

  const handleUpdateEmail = async () => {
    setEmailMsg(null);
    setLoadingEmail(true);

    if (!newEmail.trim()) {
      setEmailMsg({ text: 'Please enter a new email.', ok: false });
      setLoadingEmail(false);
      return;
    }

    // Actually update the email
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      setEmailMsg({ text: error.message, ok: false });
    } else {
      setEmailMsg({ text: 'Email updated successfully.', ok: true });
      setNewEmail('');
    }

    setLoadingEmail(false);
  };

  const handleUpdatePassword = async () => {
    setPasswordMsg(null);
    setLoadingPassword(true);

    if (!newPassword) {
      setPasswordMsg({ text: 'Please enter a new password.', ok: false });
      setLoadingPassword(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', ok: false });
      setLoadingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', ok: false });
      setLoadingPassword(false);
      return;
    }

    // Actually update the password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg({ text: error.message, ok: false });
    } else {
      setPasswordMsg({ text: 'Password updated successfully.', ok: true });
      setNewPassword('');
      setConfirmNewPassword('');
    }

    setLoadingPassword(false);
  };

  return (
    <div style={{
      maxWidth: '560px',
      margin: '3rem auto',
      padding: '0 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      <div>
        <h1 style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem',
        }}>
          Profile
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          {user?.email}
        </p>
      </div>

      {/* Display Name */}
      <Section title="Display Name">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          style={inputStyle}
        />
        {displayNameMsg && <Feedback msg={displayNameMsg} />}
        <SaveButton onClick={handleUpdateDisplayName} loading={loadingDisplayName} />
      </Section>

      {/* Email */}
      <Section title="Change Email">
        <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Current: <span style={{ color: 'var(--color-text)' }}>{user?.email}</span>
        </p>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          style={inputStyle}
        />
        {emailMsg && <Feedback msg={emailMsg} />}
        <SaveButton onClick={handleUpdateEmail} loading={loadingEmail} />
      </Section>

      {/* Password */}
      <Section title="Change Password">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          style={{ ...inputStyle, marginBottom: '0.75rem' }}
        />
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirm new password"
          style={inputStyle}
        />
        {passwordMsg && <Feedback msg={passwordMsg} />}
        <SaveButton onClick={handleUpdatePassword} loading={loadingPassword} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <h2 style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        marginBottom: '0.25rem',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Feedback({ msg }: { msg: { text: string; ok: boolean } }) {
  return (
    <div style={{
      padding: '0.625rem 0.875rem',
      borderRadius: '6px',
      fontSize: '0.8rem',
      background: msg.ok ? '#0a1a0a' : '#1a0a0a',
      border: `1px solid ${msg.ok ? '#34d399' : 'var(--color-red)'}`,
      color: msg.ok ? '#34d399' : 'var(--color-red)',
    }}>
      {msg.text}
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        alignSelf: 'flex-start',
        padding: '0.5rem 1.25rem',
        background: loading ? 'var(--color-border)' : 'var(--color-accent)',
        border: 'none',
        borderRadius: '6px',
        color: loading ? 'var(--color-muted)' : '#000',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        fontSize: '0.8rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading ? 'Saving…' : 'Save'}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-panel)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  padding: '0.625rem 0.875rem',
  fontSize: '0.875rem',
  outline: 'none',
};