'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, Building2, Globe, Route, ArrowRight, TrendingUp, Briefcase } from 'lucide-react';

interface Stats {
  totals: { chapters: number; members: number; regions: number; cities: number };
  topRegions: { region_name: string; total_chapters: number; total_members: number }[];
  topProfessions: { profession_category: string; count: number }[];
  topChapters: { chapter_id: number; chapter_name: string; total_members: number; city: string }[];
}

const professionIcons: Record<string, string> = {
  'Retail': '🛍️', 'Construction': '🏗️', 'Manufacturing': '🏭',
  'Finance & Insurance': '💰', 'Advertising & Marketing': '📢',
  'Health & Wellness': '🏥', 'Food & Beverage': '🍽️',
  'Architecture & Engineering': '📐', 'Legal & Accounting': '⚖️',
  'Computer & Programming': '💻', 'Real Estate Services': '🏠',
  'Travel': '✈️', 'Training & Coaching': '🎓', 'Consulting': '📊',
};

const quickChips = [
  { label: '💻 IT & Tech', profession: 'Computer & Programming' },
  { label: '💰 Finance', profession: 'Finance & Insurance' },
  { label: '🏠 Real Estate', profession: 'Real Estate Services' },
  { label: '⚖️ Legal', profession: 'Legal & Accounting' },
  { label: '🏗️ Construction', profession: 'Construction' },
  { label: '🏥 Healthcare', profession: 'Health & Wellness' },
  { label: '📢 Marketing', profession: 'Advertising & Marketing' },
  { label: '🏭 Manufacturing', profession: 'Manufacturing' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!value || started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <div ref={ref} className="stat-value">{display.toLocaleString()}{suffix}</div>;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/stats.json').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="page-container">
      {/* Floating Particles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 4 + i * 2, height: 4 + i * 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.12)',
            left: `${15 + i * 14}%`, top: `${10 + (i * 17) % 60}%`,
            animation: `dotPulse ${3 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', padding: '40px 0 48px', position: 'relative', zIndex: 1 }}
      >
        <h1 style={{
          fontSize: 46, fontWeight: 900, marginBottom: 8,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #f59e0b, #3b82f6)',
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'gradientShift 4s ease-in-out infinite',
          letterSpacing: '-1px',
        }}>
          BNI Route Connect
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px' }}
        >
          Discover {stats?.totals.members?.toLocaleString() || '61,500+'} members across {stats?.totals.chapters?.toLocaleString() || '1,584'} chapters in India
        </motion.p>

        {/* Main Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ maxWidth: 600, margin: '0 auto 24px' }}
        >
          <div className="search-bar" style={{ padding: '14px 20px' }}>
            <Search />
            <input
              placeholder="Search members, chapters, professions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search) {
                  window.location.href = `/members?search=${encodeURIComponent(search)}`;
                }
              }}
            />
            <button className="btn btn-primary btn-sm" onClick={() => search && (window.location.href = `/members?search=${encodeURIComponent(search)}`)}>
              Search
            </button>
          </div>
        </motion.div>

        {/* Quick Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="chip-row" style={{ justifyContent: 'center' }}
        >
          {quickChips.map(c => (
            <Link key={c.profession} href={`/members?profession=${encodeURIComponent(c.profession)}`} className="chip">
              {c.label}
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Stats with animated counters */}
      {stats && (
        <motion.div
          className="stat-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            { icon: <Building2 size={22} />, color: 'green', value: stats.totals.chapters, label: 'Chapters' },
            { icon: <Users size={22} />, color: 'blue', value: stats.totals.members, label: 'Members' },
            { icon: <Globe size={22} />, color: 'purple', value: stats.totals.regions, label: 'Regions' },
            { icon: <MapPin size={22} />, color: 'amber', value: stats.totals.cities, label: 'Cities' },
          ].map((s, i) => (
            <motion.div key={s.label} className="stat-card" custom={i} variants={fadeUp}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div>
                <AnimatedNumber value={s.value} />
                <div className="stat-label">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* CTA: Route Connect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/route" style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
          <div className="card card-clickable cta-pulse" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Route size={26} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Find Chapters on Your Route</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter start and end location → discover BNI chapters along the way</div>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
        </Link>
      </motion.div>

      <motion.div
        className="grid-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Top Regions */}
        <motion.div className="card" custom={0} variants={fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>🏆 Top Regions</h2>
            <Link href="/regions" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          {stats?.topRegions.slice(0, 8).map((r, i) => (
            <Link key={r.region_name} href={`/regions?id=${r.region_name}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{r.region_name}</span>
              <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>{r.total_members} members</span>
            </Link>
          ))}
        </motion.div>

        {/* Top Professions */}
        <motion.div className="card" custom={1} variants={fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>📊 Top Professions</h2>
            <Link href="/members" className="btn btn-ghost btn-sm">Browse <ArrowRight size={14} /></Link>
          </div>
          {stats?.topProfessions.slice(0, 8).map((p) => (
            <Link key={p.profession_category} href={`/members?profession=${encodeURIComponent(p.profession_category)}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
              <span style={{ fontSize: 18 }}>{professionIcons[p.profession_category] || '💼'}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{p.profession_category}</span>
              <span style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{p.count.toLocaleString()}</span>
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Top Chapters */}
      {stats?.topChapters && (
        <motion.div
          className="card" style={{ marginTop: 24 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🌟 Largest Chapters</h2>
          <div className="grid-3" style={{ gap: 12 }}>
            {stats.topChapters.map((ch) => (
              <Link key={ch.chapter_id} href={`/chapters/${ch.chapter_id}`} className="chapter-card" style={{ textDecoration: 'none' }}>
                <div className="chapter-card-name">{ch.chapter_name}</div>
                <div className="chapter-card-venue"><MapPin size={12} /> {ch.city || 'India'}</div>
                <div className="chapter-card-footer">
                  <span className="chapter-card-members"><Users size={12} /> {ch.total_members} members</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
