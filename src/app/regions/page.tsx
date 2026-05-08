'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Building2, ArrowLeft, TrendingUp, MapPin, ChevronRight } from 'lucide-react';

interface Region { region_id: number; region_name: string; total_chapters: number; total_members: number; }

function RegionsContent() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    fetch('/data/regions.json').then(r => r.json()).then(d => { setRegions(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setDetail(null); return; }
    setLoading(true);
    fetch(`/data/regions/${selectedRegion.region_id}.json`).then(r => r.json()).then(d => { setDetail(d); setLoading(false); });
  }, [selectedRegion]);

  if (selectedRegion && detail) {
    const maxProf = detail.topProfessions[0]?.count || 1;
    return (
      <motion.div 
        className="page-container"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button onClick={() => setSelectedRegion(null)} className="btn btn-ghost btn-sm" style={{ marginBottom: 20, paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to All Regions
        </button>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.5px' }}>{detail.region.region_name}</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="badge green" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 10 }}>
              <Building2 size={14} style={{ marginRight: 6 }} /> 
              {detail.region.total_chapters} Chapters
            </div>
            <div className="badge amber" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 10 }}>
              <Users size={14} style={{ marginRight: 6 }} /> 
              {detail.region.total_members} Members
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 40 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="section-title"><TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} /> Profession Density</h2>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              {detail.topProfessions.map((p: any, i: number) => (
                <div key={p.profession_category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.profession_category}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                  </div>
                  <div className="bar-track" style={{ height: 6 }}>
                    <motion.div 
                      className="bar-fill blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.count / maxProf) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title"><MapPin size={18} style={{ color: 'var(--accent-rose)' }} /> Key Cities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {detail.cities.map((c: any) => (
                <motion.span 
                  key={c.city} 
                  className="chip"
                  whileHover={{ scale: 1.05 }}
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  {c.city} 
                  <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 11, fontWeight: 700 }}>{c.count}</span>
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🏢 Chapter Presence</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{detail.chapters.length} ACTIVE CHAPTERS</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>City</th>
                  <th>Meeting Day</th>
                  <th>Members</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detail.chapters.map((ch: any) => (
                  <tr key={ch.chapter_id}>
                    <td>
                      <Link href={`/chapters/${ch.chapter_id}/`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 700 }}>
                        {ch.chapter_name}
                      </Link>
                    </td>
                    <td><div style={{ fontSize: 13 }}>{ch.city || '—'}</div></td>
                    <td><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ch.meeting_schedule?.split(' ')[0] || '—'}</div></td>
                    <td><span className="badge green" style={{ fontWeight: 800 }}>{ch.total_members}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/chapters/${ch.chapter_id}/`}>
                        <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  }

  const filtered = search ? regions.filter(r => r.region_name.toLowerCase().includes(search.toLowerCase())) : regions;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>🌍 Region Explorer</h1>
        <p className="page-subtitle" style={{ fontSize: 14 }}>Navigate through {regions.length} BNI regions across the country</p>
      </div>

      <div className="search-bar" style={{ marginBottom: 32, maxWidth: 450, padding: '12px 18px' }}>
        <Globe size={18} />
        <input 
          placeholder="Search for a specific region..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ fontSize: 15 }}
        />
      </div>

      {loading ? (
        <div className="loading" style={{ height: 300 }}>
          <div className="spinner" /> 
          <span style={{ fontWeight: 500 }}>Loading regions...</span>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 20 }}>
          <AnimatePresence>
            {filtered.map((r, i) => (
              <motion.div 
                key={r.region_id} 
                className="card card-clickable" 
                onClick={() => setSelectedRegion(r)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ translateY: -5 }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.3px' }}>{r.region_name}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                    <Building2 size={14} /> {r.total_chapters}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-blue)', fontWeight: 600 }}>
                    <Users size={14} /> {r.total_members}
                  </div>
                </div>
                <div style={{ marginTop: 20, height: 4, background: 'var(--bg-glass)', borderRadius: 10, overflow: 'hidden' }}>
                  <motion.div 
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (r.total_members / (regions[0]?.total_members || 1)) * 100)}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function RegionsPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading regions...</div>}><RegionsContent /></Suspense>;
}
