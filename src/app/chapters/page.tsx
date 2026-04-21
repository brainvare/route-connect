'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Building2, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface Chapter {
  chapter_id: number; chapter_name: string; venue_name: string; city: string;
  meeting_schedule: string; total_members: number; region_name: string; meeting_day: string;
}

function ChaptersContent() {
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 60;

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(d => { setAllChapters(d); setLoading(false); });
  }, []);

  const filtered = allChapters.filter(ch => {
    if (search && !`${ch.chapter_name} ${ch.venue_name} ${ch.city} ${ch.region_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (day && ch.meeting_day !== day) return false;
    return true;
  });
  const total = filtered.length;
  const chapters = filtered.slice(page * limit, (page + 1) * limit);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🏢 Chapters</h1>
        <p className="page-subtitle">{total.toLocaleString()} chapters</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={16} />
          <input placeholder="Search chapters..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
      </div>
      <div className="chip-row" style={{ marginBottom: 24 }}>
        {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
          <span key={d} className={`chip ${day === d ? 'active' : ''}`} onClick={() => { setDay(d); setPage(0); }}>
            {d || 'All Days'}
          </span>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
        <>
          <div className="grid-3">
            {chapters.map(ch => (
              <Link key={ch.chapter_id} href={`/chapters/${ch.chapter_id}/`} className="chapter-card" style={{ textDecoration: 'none' }}>
                <div className="chapter-card-name">{ch.chapter_name}</div>
                <div className="chapter-card-venue"><Building2 size={12} /> {ch.venue_name || ch.city || '—'}</div>
                <div className="chapter-card-schedule">{ch.meeting_schedule || 'TBD'}</div>
                <div className="chapter-card-footer">
                  <span className="chapter-card-members"><Users size={12} /> {ch.total_members}</span>
                  <span className="badge">{ch.region_name}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={14} /> Prev</button>
            <span>Page {page + 1} of {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit) - 1}>Next <ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChaptersPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading...</div>}><ChaptersContent /></Suspense>;
}
