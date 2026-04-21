'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Globe, Users, Building2, ArrowLeft } from 'lucide-react';

interface Region {
  region_id: number; region_name: string; domain: string; total_chapters: number; total_members: number;
}

interface RegionDetail {
  region: Region;
  chapters: { chapter_id: number; chapter_name: string; total_members: number; city: string; meeting_schedule: string }[];
  topProfessions: { profession_category: string; count: number }[];
  cities: { city: string; count: number }[];
}

function RegionsContent() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [detail, setDetail] = useState<RegionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(data => { setRegions(data.regions); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setDetail(null); return; }
    setLoading(true);
    const region = regions.find(r => r.region_name === selectedRegion);
    if (region) {
      fetch(`/api/regions?id=${region.region_id}`).then(r => r.json()).then(d => { setDetail(d); setLoading(false); });
    }
  }, [selectedRegion, regions]);

  // Region detail view
  if (selectedRegion && detail) {
    const maxProf = detail.topProfessions[0]?.count || 1;
    return (
      <div className="page-container">
        <button onClick={() => setSelectedRegion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>
          <ArrowLeft size={14} /> All Regions
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{detail.region.region_name}</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <span className="badge green"><Building2 size={12} /> {detail.region.total_chapters} chapters</span>
          <span className="badge amber"><Users size={12} /> {detail.region.total_members} members</span>
        </div>
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Top Professions</h2>
            {detail.topProfessions.map(p => (
              <div key={p.profession_category} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 120, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{p.profession_category}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.count / maxProf) * 100}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))', borderRadius: 4 }} />
                </div>
                <span style={{ width: 40, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{p.count}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏙️ City Clusters</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {detail.cities.map(c => (
                <span key={c.city} className="chip">{c.city} <span style={{ opacity: 0.5, marginLeft: 4 }}>{c.count}</span></span>
              ))}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>🏢 Chapters ({detail.chapters.length})</h2>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Chapter</th><th>City</th><th>Schedule</th><th>Members</th></tr></thead>
              <tbody>
                {detail.chapters.map(ch => (
                  <tr key={ch.chapter_id}>
                    <td><Link href={`/chapters/${ch.chapter_id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>{ch.chapter_name}</Link></td>
                    <td>{ch.city || '—'}</td>
                    <td style={{ fontSize: 13 }}>{ch.meeting_schedule || '—'}</td>
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

  // Regions list
  const filtered = search ? regions.filter(r => r.region_name.toLowerCase().includes(search.toLowerCase())) : regions;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🌍 Region Explorer</h1>
        <p className="page-subtitle">{regions.length} regions across India</p>
      </div>
      <div className="search-bar" style={{ marginBottom: 24, maxWidth: 400 }}>
        <Globe size={16} />
        <input placeholder="Search regions..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
        <div className="grid-3">
          {filtered.map(r => (
            <div key={r.region_id} className="card card-clickable" onClick={() => setSelectedRegion(r.region_name)} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{r.region_name}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--accent-green)' }}><Building2 size={13} style={{ verticalAlign: -2 }} /> {r.total_chapters} chapters</span>
                <span style={{ fontSize: 13, color: 'var(--accent-blue)' }}><Users size={13} style={{ verticalAlign: -2 }} /> {r.total_members} members</span>
              </div>
              <div style={{ marginTop: 12, height: 4, background: 'var(--bg-glass)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (r.total_members / (regions[0]?.total_members || 1)) * 100)}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegionsPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading...</div>}><RegionsContent /></Suspense>;
}
