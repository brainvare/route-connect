'use client';
import { useEffect, useState } from 'react';
import { Building2, Users, Globe, MapPin, TrendingUp } from 'lucide-react';

interface Stats {
  totals: { chapters: number; members: number; regions: number; cities: number };
  topRegions: { region_name: string; total_chapters: number; total_members: number }[];
  topProfessions: { profession_category: string; count: number }[];
  meetingDays: { meeting_day: string; count: number }[];
  stateDistribution: { state: string; count: number }[];
  topChapters: { chapter_id: number; chapter_name: string; total_members: number; city: string }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/data/stats.json').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /> Loading analytics...</div>;

  const maxRegion = stats.topRegions[0]?.total_members || 1;
  const maxProf = stats.topProfessions[0]?.count || 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 Admin Dashboard</h1>
        <p className="page-subtitle">BNI India Network Analytics</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Building2 size={22} /></div>
          <div><div className="stat-value">{stats.totals.chapters.toLocaleString()}</div><div className="stat-label">Total Chapters</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} /></div>
          <div><div className="stat-value">{stats.totals.members.toLocaleString()}</div><div className="stat-label">Total Members</div></div>
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

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Top Regions */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top Regions by Members</h2>
          {stats.topRegions.map(r => (
            <div key={r.region_name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.region_name}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(r.total_members / maxRegion) * 100}%`, background: 'linear-gradient(90deg, var(--accent-green), var(--accent-blue))', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ width: 50, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{r.total_members.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Top Professions */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💼 Top Professions</h2>
          {stats.topProfessions.slice(0, 15).map(p => (
            <div key={p.profession_category} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 120, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.profession_category}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(p.count / maxProf) * 100}%`, background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-rose))', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ width: 50, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{p.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Meeting Days */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📅 Meetings by Day</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, paddingTop: 20 }}>
            {stats.meetingDays.map(d => {
              const maxDay = stats.meetingDays[0]?.count || 1;
              const height = (d.count / maxDay) * 120;
              return (
                <div key={d.meeting_day} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 8 }}>{d.count}</div>
                  <div style={{ height, background: 'linear-gradient(180deg, var(--accent-blue), rgba(59,130,246,0.2))', borderRadius: '4px 4px 0 0', margin: '0 auto', width: '80%' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{d.meeting_day?.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Distribution */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🗺️ Chapters by State</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.stateDistribution.map(s => (
              <span key={s.state} className="chip">
                {s.state} <span style={{ opacity: 0.5, marginLeft: 4, fontWeight: 700 }}>{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Chapters */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🌟 Largest Chapters</h2>
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>Chapter</th><th>City</th><th>Members</th></tr></thead>
            <tbody>
              {stats.topChapters.map((ch, i) => (
                <tr key={ch.chapter_id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ch.chapter_name}</td>
                  <td>{ch.city || '—'}</td>
                  <td><span className="badge green">{ch.total_members}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
