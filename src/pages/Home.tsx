import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Character Browser',
    desc: 'Browse all characters, light cones & relics with full stat sheets and kit info.',
    to: '/characters',
    accent: 'var(--color-accent)',
  },
  {
    title: 'Build Simulator',
    desc: 'Equip relics, set substats and see your final stat totals instantly.',
    to: '/builder',
    accent: '#c8a84b',
  },
  {
    title: 'Team Damage',
    desc: 'Simulate a full team and see combined damage output numbers.',
    to: '/team',
    accent: '#f472b6',
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '4rem' }}>
        <p style={{ color: 'var(--color-accent)', fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Personal Toolkit
        </p>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text)', marginBottom: '1rem', lineHeight: 1.1 }}>
          Stellaron
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.25rem', lineHeight: 1.7 }}>
          A personal theory-crafting tool for Honkai: Star Rail —<br />
          build characters, simulate relics, and calculate team damage.
        </p>
        <div style={{ width: '80px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)', margin: '2rem auto 0' }} />
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 280px)', gap: '1.5rem', width: '100%', maxWidth: '920px', justifyContent: 'center' }}>
        {FEATURES.map(({ title, desc, to, accent }) => (
          <Link
            key={to}
            to={to}
            style={{ display: 'block', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.75rem', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}
          >
            <div style={{ width: '32px', height: '3px', background: accent, borderRadius: '2px', marginBottom: '1.25rem' }} />
            <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem' }}>{title}</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{desc}</p>
            <p style={{ marginTop: '1.25rem', fontSize: '0.7rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>Open →</p>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: '4rem', fontSize: '0.7rem', letterSpacing: '0.15em', /*color: 'var(--color-border)'*/color: 'white', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>
        Work in progress — built slowly, for fun
      </p>
    </div>
  );
}