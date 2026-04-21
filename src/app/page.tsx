'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/stats.json').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          BNI Route Connect
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 32px' }}>
          Discover {stats?.totals.members?.toLocaleString() || '61,500+'} members across {stats?.totals.chapters?.toLocaleString() || '1,584'} chapters in India
        </p>

        {/* Main Search */}
        <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
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
        </div>

        {/* Quick Chips */}
        <div className="chip-row" style={{ justifyContent: 'center' }}>
          {quickChips.map(c => (
            <Link key={c.profession} href={`/members?profession=${encodeURIComponent(c.profession)}`} className="chip">
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><Building2 size={22} /></div>
            <div><div className="stat-value">{stats.totals.chapters.toLocaleString()}</div><div className="stat-label">Chapters</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={22} /></div>
            <div><div className="stat-value">{stats.totals.members.toLocaleString()}</div><div className="stat-label">Members</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Globe size={22} /></div>
            <div><div className="stat-value">{stats.totals.regions}</div><div className="stat-label">Regions</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><MapPin size={22} /></div>
            <div><div className="stat-value">{stats.totals.cities.toLocaleString()}</div><div className="stat-label">Cities</div></div>
          </div>
        </div>
      )}

      {/* CTA: Route Connect */}
      <Link href="/route" style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
        <div className="card card-clickable" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', borderColor: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 20 }}>
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

      <div className="grid-2">
        {/* Top Regions */}
        <div className="card">
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
        </div>

        {/* Top Professions */}
        <div className="card">
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
        </div>
      </div>

      {/* Top Chapters */}
      {stats?.topChapters && (
        <div className="card" style={{ marginTop: 24 }}>
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
        </div>
      )}
    </div>
  );
}
